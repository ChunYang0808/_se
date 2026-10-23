# 🎓 CampusFlow｜學生課程任務管理系統

> **HW7 — Software Testing**
> 使用 Node.js + Express 建立的學生課程任務管理網站，並完整實作 **Unit Test、System Test 與 E2E Test** 三種軟體測試。

CampusFlow 是一個以繁體中文呈現的響應式課程任務 Dashboard，可協助學生管理不同課程的作業、截止日期與完成狀態。

本專案同時作為 **HW7 網站測試作業**，重點在於透過不同層級的測試，驗證 Server 核心邏輯、Web API 與完整使用者操作流程。

---

## 🧪 Testing Status

| 測試類型        | 測試工具       | 測試範圍         | 執行結果                 |
| ----------- | ---------- | ------------ | -------------------- |
| Unit Test   | Jest       | Server 核心邏輯  | ✅ 7 / 7 Passed       |
| System Test | Supertest  | REST Web API | ✅ 7 / 7 Passed       |
| E2E Test    | Playwright | 完整 UI 使用流程   | ✅ 1 / 1 Passed       |
| **Total**   | —          | **三種測試**     | **✅ 15 / 15 Passed** |

---

## ✨ 網站功能

### 📊 Dashboard

首頁即時統計：

- 總任務數
- 待完成任務數
- 已完成任務數
- 未來 7 天內即將到期任務數

### ➕ 課程任務管理

每筆任務包含：

- 課程名稱
- 任務名稱
- 截止日期
- 優先程度：低／中／高

並支援：

- 新增任務
- 標記完成
- 恢復為未完成
- 刪除任務

### 🔎 任務篩選

可依照任務狀態快速切換：

- 全部
- 待完成
- 已完成

### 💡 使用者體驗

- 前端輸入驗證
- 後端輸入驗證
- 操作成功／失敗 Toast 提示
- Responsive Design 響應式版面
- 繁體中文介面

---

## 🛠️ 使用技術

### Frontend

- HTML
- CSS
- Vanilla JavaScript

### Backend

- Node.js
- Express

### Testing

- Jest — Unit Testing
- Supertest — System / API Testing
- Playwright — End-to-End Testing

> 任務資料儲存在 Server 記憶體中，因此重新啟動 Server 後資料會清空。本專案以軟體測試展示為主要目的，不使用額外資料庫。

---

## 📁 專案架構

```text
HW7(Testing HW)/
│
├── public/                    # 前端頁面、樣式與互動
│
├── src/
│   ├── app.js                 # Express App 與 REST API
│   ├── server.js              # Server 進入點
│   └── taskService.js         # 任務核心邏輯
│
├── tests/
│   ├── unit/                  # Jest 單元測試
│   └── system/                # Supertest API 系統測試
│
├── e2e/                       # Playwright E2E 測試
│
├── playwright.config.js       # Playwright 設定
├── package.json               # npm 套件與 Scripts
├── package-lock.json
├── .gitignore
└── README.md
```

---

# 🧪 三種軟體測試

本專案依照作業要求，分別從 **Server 核心邏輯、Web API、完整使用者操作** 三個層級進行測試。

---

## 1️⃣ Unit Test — Server 核心邏輯

Unit Test 直接測試 Server 的 `TaskService` 核心邏輯，不需要透過瀏覽器操作網站。

### 測試內容

- ✅ 正常建立任務
- ✅ 拒絕空白任務名稱
- ✅ 拒絕空白課程名稱
- ✅ 修改任務完成狀態
- ✅ 刪除任務
- ✅ 處理不存在的任務
- ✅ Server 核心任務邏輯

### 執行方式

```powershell
npm run test:unit
```

也可以使用：

```powershell
npm test
```

### 測試結果

**✅ 7 / 7 Passed**

---

## 2️⃣ System Test — Web API

System Test 使用 **Supertest** 透過 HTTP Request 測試 Express REST API。

與 Unit Test 不同，此階段不是只測單一函式，而是確認 Server API 整體能正確接收 Request 並回傳 Response。

### 測試 API

```text
GET     /api/tasks
POST    /api/tasks
PATCH   /api/tasks/:id
DELETE  /api/tasks/:id
```

同時驗證：

- ✅ GET 取得任務
- ✅ POST 建立任務
- ✅ PATCH 修改任務
- ✅ DELETE 刪除任務
- ✅ 400 Bad Request
- ✅ 404 Not Found
- ✅ API 完整操作流程

### 執行方式

```powershell
npm run test:system
```

### 測試結果

**✅ 7 / 7 Passed**

---

## 3️⃣ E2E Test — 完整使用者流程

E2E Test 使用 **Playwright + Chromium Headless Browser**，模擬真實使用者從瀏覽器操作 CampusFlow。

測試主要操作完全透過 UI 執行，而非直接呼叫 API。

### Playwright 自動執行流程

```text
開啟 CampusFlow
        ↓
輸入課程「網路概論」
        ↓
輸入任務「完成第七週作業」
        ↓
設定截止日期與優先程度
        ↓
點擊新增任務
        ↓
確認任務出現在畫面
        ↓
確認 Dashboard 統計更新
        ↓
標記任務完成
        ↓
切換「已完成」篩選
        ↓
確認完成任務存在
        ↓
刪除任務
        ↓
確認任務從 UI 消失
```

### 執行方式

```powershell
npm run test:e2e
```

### 測試結果

**✅ 1 / 1 Passed**

---

# 🚀 安裝與啟動

## 1. 安裝 Dependencies

本專案需要 **Node.js 20 以上版本**。

```powershell
npm install
```

## 2. 安裝 Playwright Chromium

第一次執行 E2E Test 前：

```powershell
npx playwright install chromium
```

## 3. 啟動 CampusFlow

```powershell
npm run dev
```

啟動完成後開啟：

```text
http://localhost:3000
```

一般啟動也可以使用：

```powershell
npm start
```

---

# ⚡ 快速驗收

如果要快速確認三種測試是否全部正常，可以執行：

```powershell
npm run test:all
```

系統會依序執行：

```text
Unit Test
    ↓
System / API Test
    ↓
Playwright E2E Test
```

目前測試結果：

```text
Unit Test       ✅ 7 / 7 Passed
System Test     ✅ 7 / 7 Passed
E2E Test        ✅ 1 / 1 Passed
─────────────────────────────
Total           ✅ 15 / 15 Passed
```

---

## 📌 常用指令

| 指令                    | 功能                     |
| --------------------- | ---------------------- |
| `npm run dev`         | 啟動開發 Server            |
| `npm start`           | 啟動 CampusFlow          |
| `npm test`            | 執行 Unit Test           |
| `npm run test:unit`   | 執行 Unit Test           |
| `npm run test:system` | 執行 System / API Test   |
| `npm run test:e2e`    | 執行 Playwright E2E Test |
| `npm run test:all`    | 一次執行全部三種測試             |

---

## 🎯 作業重點

本專案透過三個不同層級驗證網站：

**Unit Test**
→ 驗證 Server 核心程式邏輯。

**System Test**
→ 驗證 Web API 與 Server 整體功能。

**E2E Test**
→ 使用 Headless Browser 模擬真實使用者操作完整網站。

藉由三種測試，可以從單一程式邏輯一路驗證到實際使用者操作流程，確保 CampusFlow 的主要功能能正常運作。

---

HW7 — Software Testing 🧪
