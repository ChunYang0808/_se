# my-curl

<p align="center">
  <strong>一個以 Python 製作、用法接近 curl 的輕量 HTTP 命令列用戶端。</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.8%2B-3776AB?logo=python&logoColor=white" alt="Python 3.8+">
  <img src="https://img.shields.io/badge/HTTP-Client-0A7A73" alt="HTTP Client">
  <img src="https://img.shields.io/badge/Dependency-requests-8B5CF6" alt="requests">
</p>

---

## ✨ 功能特色

- 使用熟悉的命令列選項發送 HTTP 請求
- 支援 `GET`、`POST`、`PUT`、`DELETE` 等自訂 HTTP 方法
- 可加入多個自訂 Request Headers
- 支援傳送 Request Body；未指定方法時會自動以 `POST` 送出
- 可顯示 Response Headers、HTTP 狀態與完整 Response Body
- 提供連線失敗、逾時、URL 格式錯誤與 Header 格式錯誤提示

## 📁 專案結構

```text
my-curl/
├── mycurl.py          # 主程式：解析指令、送出請求、顯示回應
├── requirements.txt   # Python 相依套件
└── README.md          # 專案說明文件
```

## 🚀 快速開始

### 1. 取得專案

```bash
git clone <你的-repository-url>
cd my-curl
```

### 2. 安裝相依套件

```bash
pip install -r requirements.txt
```

### 3. 發送第一個請求

```bash
python mycurl.py https://httpbin.org/get
```

執行後會顯示 HTTP 狀態與伺服器回傳的內容。

## 🧭 指令格式

```bash
python mycurl.py [options] <URL>
```

> URL 必須包含協定，例如 `https://example.com`。

## ⚙️ 選項說明

| 選項 | 說明 | 範例 |
| --- | --- | --- |
| `-X, --request METHOD` | 指定 HTTP 方法 | `-X DELETE` |
| `-H, --header "Key: Value"` | 新增自訂 Header；可重複使用 | `-H "Accept: application/json"` |
| `-d, --data DATA` | 傳送 Request Body；未指定 `-X` 時預設為 POST | `-d "name=Tom"` |
| `-i, --include-headers` | 額外顯示 Response Headers | `-i` |
| `--timeout SECONDS` | 設定逾時秒數，預設為 10 | `--timeout 30` |

## 🧪 使用範例

### GET：讀取資料

```bash
python mycurl.py https://httpbin.org/get
```

### POST：傳送表單資料

當使用 `-d` 但沒有設定 `-X` 時，my-curl 會自動使用 `POST`。

```bash
python mycurl.py -d "name=Tom&age=20" https://httpbin.org/post
```

### POST：傳送 JSON

```bash
python mycurl.py -X POST \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Tom\"}" \
  https://httpbin.org/post
```

### 加入自訂 Header

```bash
python mycurl.py \
  -H "User-Agent: MyCurl/1.0" \
  -H "Accept: application/json" \
  https://httpbin.org/get
```

### 顯示回應標頭

```bash
python mycurl.py -i https://httpbin.org/get
```

### 設定逾時時間

```bash
python mycurl.py --timeout 30 https://httpbin.org/delay/3
```

## 📤 輸出範例

一般請求會先顯示狀態，再顯示 Response Body：

```text
Status: 200 OK

{
  "args": {},
  "headers": { ... },
  "url": "https://httpbin.org/get"
}
```

加上 `-i` 時，也會在最前面顯示回應狀態列與 Headers。

## ⚠️ 錯誤處理

| 情況 | 行為 |
| --- | --- |
| 無法連線 | 顯示連線失敗訊息並結束 |
| 請求逾時 | 顯示設定的逾時秒數並結束 |
| URL 未含協定 | 提示加上 `http://` 或 `https://` |
| Header 格式不正確 | 提示正確格式：`Key: Value` |
| 其他 requests 例外 | 顯示原始錯誤訊息並結束 |

## 📝 開發備註

- HTTP 請求由 [`requests`](https://requests.readthedocs.io/) 處理。
- Header 使用字典儲存；同一個名稱重複指定時，後面的值會覆蓋前面的值。
- HTTP `4xx` 與 `5xx` 回應會正常印出狀態與內容，程式不會自動將其視為例外。
- `-d` 的內容會原樣傳送。若 API 需要 JSON，請自行設定 `Content-Type: application/json` 並提供正確 JSON。

## 🔒 使用提醒

`POST`、`PUT`、`DELETE` 等方法可能新增、修改或刪除遠端資料。送出前請確認 URL、方法、Headers 與資料內容；避免把密碼、Token 或 API 金鑰直接寫入命令紀錄或公開倉庫。

---

<p align="center">Made with Python · Simple HTTP testing from my-curl</p>
