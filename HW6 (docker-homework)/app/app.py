from flask import Flask
import psycopg2

app = Flask(__name__)

@app.route("/")
def home():
    try:
        conn = psycopg2.connect(
            host="db",
            database="dockerdb",
            user="postgres",
            password="123456"
        )

        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        db_status = "✅ PostgreSQL Database 連線成功！"
    except Exception as e:
        db_status = f"❌ PostgreSQL Database 連線失敗：{e}"
        version = "無法取得"

    return f"""
    <h1>🐳 Docker 作業系統</h1>
    <h2>系統狀態</h2>

    <p>✅ Python Flask Web Server 運作成功！</p>
    <p>✅ Nginx Reverse Proxy 運作成功！</p>
    <p>{db_status}</p>

    <hr>

    <h3>PostgreSQL 資訊</h3>
    <p>{version}</p>
    """

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)