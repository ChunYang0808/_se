# 期中作業整合清單

這份清單整理軟體工程課程第 1～9 週的作業內容與學習成果。上課週皆有出席並準時繳交作業；第 5 週放假，沒有課堂作業。

## 每週檢驗表格

| 第幾週 | 習題內容 | 有上課且準時繳交 | 補交且附上請假證明 | 作業連結 |
|---|---|---|---|---|
| 1 | curl | 是 | — | [HW1](https://github.com/ChunYang0808/_se/tree/main/HW1) |
| 2 | 校務系統 | 是 | — | [HW2](https://github.com/ChunYang0808/_se/tree/main/HW2) |
| 3 | 有價值專案 | 是 | — | [FastDrop](https://github.com/ChunYang0808/_se/tree/main/HW8%28FastDrop%29) |
| 4 | git flow | 是 | — | [HW4](https://github.com/ChunYang0808/_se/tree/main/HW4) |
| 5 | 放假 | 放假（無課） | — | — |
| 6 | docker | 是 | — | [HW6](https://github.com/ChunYang0808/_se/tree/main/HW6%20%28docker-homework%29) |
| 7 | 網站測試 | 是 | — | [HW7](https://github.com/ChunYang0808/_se/tree/main/HW7%28Testing%20HW%29) |
| 8 | 有價值專案 | 是 | — | [FastDrop](https://github.com/ChunYang0808/_se/blob/main/HW8%28FastDrop%29/README.md) |
| 9 | Cloudflare 網站專案 | 是 | — | [FastDrop 加強版](https://github.com/ChunYang0808/_se/blob/main/HW8%28FastDrop%29/README.md) |

## 每週作業內容

### 第 1 週：curl

使用 Python 製作一個簡易的 curl 風格命令列工具，練習發送 HTTP 請求。程式支援常見請求方法、自訂標頭與內容，並能顯示回應狀態及資料。作業見 [HW1](https://github.com/ChunYang0808/_se/tree/main/HW1)。

### 第 2 週：校務系統

1:1介面高度還原校務資訊系統的互動模擬網站，練習用網頁呈現登入、查課、選課和課表等操作。網站以展示資料模擬選課流程，並加入加退選與課表連動。作業見 [HW2](https://github.com/ChunYang0808/_se/tree/main/HW2)。

### 第 3 週：有價值專案

以 FastDrop 作為有價值專案，嘗試解決跨裝置傳送文字與檔案的不便。專案設計以 WebRTC 進行即時點對點傳輸，也提供臨時檔案分享的方式；相關程式集中在 [FastDrop](https://github.com/ChunYang0808/_se/tree/main/HW8%28FastDrop%29)。

### 第 4 週：git flow

練習 Git 與 GitHub 的版本控制流程，包含分支、提交紀錄及遠端專案的操作。作業 README 整理了主分支、開發分支與相關專案的連結，方便回顧操作過程。作業見 [HW4](https://github.com/ChunYang0808/_se/tree/main/HW4)。

### 第 5 週：放假

本週放假，沒有課堂作業或繳交連結。

### 第 6 週：docker

練習 Docker 的基本操作，並用容器組合簡單的 Web 系統。作業包含 Nginx、Python Flask、PostgreSQL 和 Docker Compose，了解網頁請求如何經過反向代理到應用程式與資料庫。作業見 [HW6](https://github.com/ChunYang0808/_se/tree/main/HW6%20%28docker-homework%29)。

### 第 7 週：網站測試

針對 CampusFlow 網站練習不同層級的測試。作業分別用單元測試檢查任務邏輯、API 測試檢查伺服器介面，並用 Playwright 模擬瀏覽器中的完整操作流程。作業見 [HW7](https://github.com/ChunYang0808/_se/tree/main/HW7%28Testing%20HW%29)。

### 第 8 週：有價值專案

延續第 3 週的 FastDrop，整理專案的使用方式、功能與技術架構。報告說明裝置配對、文字與檔案傳輸，以及接收方不在線時的限時暫存分享；內容見 [FastDrop](https://github.com/ChunYang0808/_se/blob/main/HW8%28FastDrop%29/README.md)。

### 第 9 週：Cloudflare 網站專案

同樣以 FastDrop 作為本週的網站專案，重點放在 Cloudflare 相關的部署與服務整合。專案使用 Cloudflare Workers 協助連線與後端處理、D1 管理資料，並以 R2 提供限時檔案暫存。此外，更新了網站種多功能；說明見同一份 [FastDrop 加強版](https://github.com/ChunYang0808/_se/blob/main/HW8%28FastDrop%29/README.md)。