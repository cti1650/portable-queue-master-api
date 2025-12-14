# ベースイメージはPythonを使う
FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係をコピーしてインストール
# このステップを分けることで、requirements.txtが変わらない限りキャッシュが効き、ビルドが速くなる（作業の削減！）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . /app

# FastAPIを動かすUvicornのデフォルトポート
EXPOSE 8000

# コンテナ起動時に main.py を実行
# ホスト0.0.0.0で公開しないと外部からアクセスできない
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]