import os
import threading
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import IntegrityError
from starlette.requests import Request
from starlette.responses import HTMLResponse

# --- DB設定 ---
DATABASE_FILE = "queue_data.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

# スレッドセーフのためにチェックアローンにする
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} 
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 💡【重要】SQLite同時書き込み対策：グローバルな排他制御ロック
DB_LOCK = threading.Lock() 

# --- モデル定義 (DB Table) ---
class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(Integer, primary_key=True, index=True)
    queue_number = Column(Integer, unique=True, index=True, nullable=False)
    party_size = Column(Integer, nullable=False)
    seat_type = Column(String, nullable=False) # 'Table', 'Counter', 'Any'
    status = Column(String, default="Waiting", nullable=False) # 'Waiting', 'Serving', 'Completed', 'Cancelled'
    created_at = Column(DateTime, default=datetime.now, nullable=False)

Base.metadata.create_all(bind=engine)

# --- Pydanticスキーマ (API I/O) ---
class QueueBase(BaseModel):
    party_size: int
    seat_type: str
    
class QueueCreate(QueueBase):
    pass

class QueueUpdate(BaseModel):
    status: str

class QueueEntryResponse(QueueBase):
    id: int
    queue_number: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- FastAPI アプリケーション ---
app = FastAPI(title="Portable Queue Master API", version="1.0.0")

# 💡 静的ファイルディレクトリの公開
app.mount("/static", StaticFiles(directory="static"), name="static")

# DBセッション依存性注入ヘルパー
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 💡 ヘルパー関数: 次の整理番号を取得する
def get_next_queue_number(db) -> int:
    max_num = db.query(QueueEntry.queue_number).order_by(QueueEntry.queue_number.desc()).first()
    # 最初の番号は101から開始
    return (max_num[0] if max_num else 100) + 1 

# --- UI画面を返すエンドポイント ---
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def serve_client_ui(request: Request):
    # 発券画面
    with open("static/index_client.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/manage", response_class=HTMLResponse, include_in_schema=False)
async def serve_manager_ui(request: Request):
    # 管理画面
    with open("static/index_manage.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/display", response_class=HTMLResponse, include_in_schema=False)
async def serve_display_ui(request: Request):
    # 待ち受け画面
    with open("static/index_display.html", "r", encoding="utf-8") as f:
        return f.read()

# --- API エンドポイント ---

# 1. 新規受付（発番）
@app.post("/queue", response_model=QueueEntryResponse, status_code=201)
def create_queue_entry(entry: QueueCreate):
    # 💡 書き込み処理は必ずロックで囲む！
    with DB_LOCK:
        db = next(get_db())
        try:
            next_num = get_next_queue_number(db)
            db_entry = QueueEntry(
                queue_number=next_num,
                party_size=entry.party_size,
                seat_type=entry.seat_type,
                status="Waiting"
            )
            db.add(db_entry)
            db.commit()
            db.refresh(db_entry)
            return db_entry
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=500, detail="番号発番エラー（重複）")
        finally:
            db.close()

# 2. 全リスト取得
@app.get("/queue", response_model=List[QueueEntryResponse])
def get_queue_list(status: Optional[str] = None):
    db = next(get_db())
    query = db.query(QueueEntry)
    if status:
        query = query.filter(QueueEntry.status == status)
    return query.order_by(QueueEntry.queue_number.asc()).all()

# 3. ステータス更新
@app.put("/queue/{queue_number}", response_model=QueueEntryResponse)
def update_queue_status(queue_number: int, update: QueueUpdate):
    # 💡 書き込み処理は必ずロックで囲む！
    with DB_LOCK:
        db = next(get_db())
        db_entry = db.query(QueueEntry).filter(QueueEntry.queue_number == queue_number).first()
        
        if db_entry is None:
            raise HTTPException(status_code=404, detail="指定された整理番号が見つかりません")
        
        db_entry.status = update.status
        
        db.commit()
        db.refresh(db_entry)
        return db_entry
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")
