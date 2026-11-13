# 第 10 週作業｜FastDrop 公開 npm 套件

**公開套件：**[create-fastdrop-cloudflare](https://www.npmjs.com/package/create-fastdrop-cloudflare)  
**目前版本：**`1.0.1`

## 作業說明

這次作業**沿用上次作業的 FastDrop 專案**。FastDrop 原本是一個以 React、TypeScript 與 Cloudflare Workers 製作的跨裝置檔案傳輸網站；這次將它整理成可公開安裝的 Node.js 套件，並發布到 **npm 公開套件庫**。

發布的套件名稱為 [`create-fastdrop-cloudflare`](https://www.npmjs.com/package/create-fastdrop-cloudflare)。它是一個**專案產生器**：使用者執行 `npx` 指令後，會得到包含 FastDrop 前端、Worker、D1 資料庫 migration 與 R2 設定的完整原始碼，再用自己的 Cloudflare 帳號開發或部署。

> 本次的「部署到套件庫」指發布到 npm，讓別人能取得並使用程式碼；執行 `npx` 不會自動把網站部署到 Cloudflare。

## FastDrop 的主要功能

| 功能 | 說明 |
| --- | --- |
| 裝置配對 | 建立房間，使用 10 位配對碼或 QR Code 讓另一台裝置加入。 |
| P2P 傳檔 | 裝置連線後透過 WebRTC DataChannel 直接傳送檔案。 |
| 雲端暫存 | 透過 Cloudflare R2 上傳與下載暫存檔案。 |
| 檔案預覽與進度 | 預覽支援的檔案，並顯示傳輸進度和預估剩餘時間。 |
| 容量管理 | 雲端暫存具有檔案大小、總容量與排隊限制。 |

## 本次套件化與發布流程

1. 以**上次作業的 FastDrop** 為基礎，將網站程式、Worker 和資料庫 migration 收入套件範本。
2. 製作命令列入口，讓 `npx create-fastdrop-cloudflare <資料夾名稱>` 能產生新的 FastDrop 專案。
3. 將範本中的 D1 資料庫 ID 改成佔位值，讓使用者改填自己的 Cloudflare 資源；套件不包含原專案的登入憑證或部署產物。
4. 撰寫 npm 套件的 README，說明功能、安裝、部署方式與傳輸限制。
5. 使用 `npm publish --dry-run` 檢查打包內容，再以 `npm publish` 發布到 npm。首次發布版本為 `1.0.0`，更新說明後發布 `1.0.1`。

## 如何使用公開套件

電腦需安裝 Node.js 20 以上版本。在 PowerShell 或其他終端機執行：

```powershell
npx create-fastdrop-cloudflare my-fastdrop
cd my-fastdrop
npm install
npm run db:migrate:local
npm run dev
```

產生的專案包含 `src/`、`worker/`、`migrations/` 和 `wrangler.jsonc`。若要正式部署到自己的 Cloudflare 帳號，須先建立 D1 資料庫與 R2 bucket，將自己的 D1 `database_id` 填入 `wrangler.jsonc`，套用遠端 migration 後再執行 `npm run deploy`。詳細步驟請見 [npm 套件頁的 README](https://www.npmjs.com/package/create-fastdrop-cloudflare?activeTab=readme)。

## 發布結果與驗證

- npm 顯示發布成功：`+ create-fastdrop-cloudflare@1.0.0`；更新說明後公開頁面顯示 `1.0.1`。
- 已從打包後的套件在本機安裝並執行命令列入口，確認可產生 FastDrop 專案及 `.gitignore`。
- 公開連結：[https://www.npmjs.com/package/create-fastdrop-cloudflare](https://www.npmjs.com/package/create-fastdrop-cloudflare)

本次作業重點是把既有 Cloudflare app 整理成可重複使用的 npm 專案範本，並完成公開套件發布。
