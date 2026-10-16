# Docker 基本操作與 Web 系統實作

## 一、作業目的

本作業主要練習 Docker 的基本操作，並使用 Docker 建立一個簡單的 Web 系統。

本次實作包含：

- Docker 基本操作
- Nginx Web Server
- Nginx Reverse Proxy
- Python Flask Web Application
- PostgreSQL Database
- Docker Compose 多容器管理


## 二、系統架構

本次建立的系統架構如下：

瀏覽器
  ↓
Nginx Web Server
  ↓
Reverse Proxy
  ↓
Python Flask
  ↓
PostgreSQL Database

使用者透過瀏覽器連線至 Nginx，
Nginx 再透過 Reverse Proxy 將請求轉送至 Flask，
Flask 最後連線至 PostgreSQL 資料庫取得資料。


## 三、Docker 安裝與基本測試

安裝 Docker Desktop 後，首先使用以下指令確認 Docker 版本：

    docker --version

接著執行 Docker 官方提供的 hello-world Image：

    docker run hello-world

執行成功後顯示：

    Hello from Docker!

代表 Docker Engine 可以正常下載 Image、建立並執行 Container。


## 四、Nginx Web Server 測試

使用以下指令建立 Nginx Container：

    docker run -d --name my-nginx -p 8080:80 nginx

接著查看目前正在執行的 Container：

    docker ps

成功啟動後，在瀏覽器開啟：

    http://localhost:8080

瀏覽器成功顯示「Welcome to nginx!」頁面，
代表 Nginx Web Server 已成功建立並運作。


## 五、PostgreSQL Database

使用以下指令建立 PostgreSQL Container：

    docker run -d --name my-postgres -e POSTGRES_PASSWORD=123456 -e POSTGRES_DB=dockerdb -p 5432:5432 postgres

建立完成後，使用以下指令進入 PostgreSQL：

    docker exec -it my-postgres psql -U postgres -d dockerdb

接著使用 SQL 指令查看 PostgreSQL 版本：

    SELECT version();

成功取得 PostgreSQL 版本資訊，
代表 PostgreSQL Database 可以正常運作。

輸入以下指令可以離開 PostgreSQL：

    \q


## 六、建立 Python Flask Web Application

在 app 資料夾中建立：

- app.py
- requirements.txt
- Dockerfile

requirements.txt 使用以下 Python 套件：

    Flask
    psycopg2-binary

其中 Flask 用來建立 Web Application，
psycopg2-binary 則讓 Python 可以連線至 PostgreSQL Database。

Dockerfile 使用 Python 3.12 作為執行環境，
並安裝 requirements.txt 中所需要的套件。

使用以下指令建立自己的 Docker Image：

    docker build -t my-flask-app ./app

建立完成後使用以下指令查看 Images：

    docker images

接著啟動 Flask Container：

    docker run -d --name my-flask -p 5000:5000 my-flask-app

最後使用瀏覽器開啟：

    http://localhost:5000

成功顯示自己建立的 Flask Web 頁面，
代表 Python Flask 已經成功在 Docker Container 中執行。


## 七、Nginx Reverse Proxy

為了讓使用者不需要直接存取 Flask，
本次使用 Nginx 建立 Reverse Proxy。

在 nginx.conf 中設定：

    location / {
        proxy_pass http://app:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

其中：

    proxy_pass http://app:5000;

代表 Nginx 收到使用者的 Request 後，
會將 Request 轉送至 Flask Application 的 5000 Port。

因此使用者只需要存取 Nginx，
不需要直接連線到後端 Flask。


## 八、Docker Compose

為了方便管理多個 Container，
本次建立 docker-compose.yml 統一管理整個系統。

Docker Compose 中包含三個主要 Service：

- db：PostgreSQL Database
- app：Python Flask Application
- nginx：Nginx Web Server / Reverse Proxy

使用以下指令建立並啟動整個系統：

    docker compose up -d --build

其中：

    up

代表啟動 Compose 中定義的服務。

    -d

代表讓 Container 在背景執行。

    --build

代表啟動前重新 Build Application Image。

啟動後可以使用以下指令查看狀態：

    docker compose ps

成功啟動後，在瀏覽器開啟：

    http://localhost:8081


## 九、Flask 連線 PostgreSQL

Flask 使用 psycopg2 連線至 PostgreSQL。

連線設定中使用：

    host="db"
    database="dockerdb"
    user="postgres"
    password="123456"

其中 host 使用 db 而不是 localhost。

原因是 Docker Compose 會為各個 Service 建立共同的 Docker Network，
因此 Flask Container 可以直接使用 Service 名稱「db」
找到 PostgreSQL Container。

Flask 連線成功後執行：

    SELECT version();

並將取得的 PostgreSQL 版本資訊顯示於 Web 頁面。


## 十、最終測試結果

最終使用瀏覽器開啟：

    http://localhost:8081

Web 頁面成功顯示：

    Python Flask Web Server 運作成功！
    Nginx Reverse Proxy 運作成功！
    PostgreSQL Database 連線成功！

代表整個系統已成功串接。


## 十一、最終系統流程

完整的 Request 流程如下：

Browser
  ↓
Nginx
  ↓
Reverse Proxy
  ↓
Python Flask
  ↓
PostgreSQL

也就是：

使用者
  ↓
localhost:8081
  ↓
Nginx Container
  ↓
Flask Container
  ↓
PostgreSQL Container


## 十二、常用 Docker 指令整理

查看 Docker 版本：

    docker --version

執行 hello-world：

    docker run hello-world

查看目前正在執行的 Container：

    docker ps

查看所有 Container：

    docker ps -a

查看 Docker Images：

    docker images

停止指定 Container：

    docker stop <container-name>

啟動指定 Container：

    docker start <container-name>

建立 Docker Image：

    docker build -t <image-name> <path>

使用 Docker Compose 啟動服務：

    docker compose up -d

重新 Build 並啟動：

    docker compose up -d --build

查看 Compose 狀態：

    docker compose ps

停止並移除 Docker Compose 建立的 Container：

    docker compose down


## 十三、專案檔案結構

docker-homework
│
├── docker-compose.yml
├── README.md
│
├── app
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
│
└── nginx
    └── nginx.conf


## 十四、學習心得

透過本次作業，我了解了 Docker Image、Container、Dockerfile
以及 Docker Compose 的基本概念與操作方式。

一開始先透過 hello-world 確認 Docker 可以正常運作，
接著分別建立 Nginx、PostgreSQL 與 Python Flask Container。

實作過程中也了解 Nginx Reverse Proxy 的用途。
使用者不需要直接連線至後端 Flask，
而是先將 Request 傳送至 Nginx，
再由 Nginx 將 Request 轉送給 Flask Application。

最後再透過 Docker Compose 將 Nginx、Flask 與 PostgreSQL
整合成同一套多容器 Web 系統。

最終成功完成以下架構：

Nginx → Flask → PostgreSQL

並成功讓 Web 頁面顯示 PostgreSQL 的連線狀態與版本資訊，
完成本次 Docker 基本操作與 Web 系統實作。