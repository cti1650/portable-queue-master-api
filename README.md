# PQMaster (Portable Queue Master) 未完成

## 📌 概要

* **目的**: FastAPI + SQLite (排他制御) で作るポータブルな順番待ちAPI。
* **ポータブル**: 単独実行ファイル（Win/Mac）とDocker開発環境をサポート。

---

## 🛠️ Docker開発環境（ローカル操作）

`Makefile` を使用し、環境を汚さずに操作する。

| コマンド | 動作 | データ永続化 |
| :--- | :--- | :--- |
| `make up` | **起動** (`http://localhost:8000/`) | ON |
| `make down` | **安全停止**・コンテナ削除 | ON (データ保持) |
| `make clean` | **完全初期化** | OFF (ボリューム削除) |

---

## 🌐 アプリケーション画面

| 役割 | URL | 主なAPI操作 |
| :--- | :--- | :--- |
| **発券** | `/` | `POST /queue` |
| **管理** | `/manage` | `PUT /queue/{num}` |
| **表示** | `/display` | `GET /queue` |

---

## 💻 コア技術

* **API**: Python / FastAPI
* **DB**: SQLite (排他制御は `threading.Lock` で実装)
* **実行**: PyInstaller (`.exe`, `.mac`)
* **開発**: Docker Compose (Named Volume使用)

## 注意事項
- Macの実行ファイルを起動する前に格納場所でコマンド実行でGatekeeperブロックの解除が必要
  `xattr -r -d com.apple.quarantine ./pqmaster_mac`
- Mac環境での起動を試みたが、以下のエラーが発生して起動しなかったため、一旦作業を保留する
  `ERROR: Error loading ASGI app. Could not import module "main".`