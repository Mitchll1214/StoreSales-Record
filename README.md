<p align="center">
  <h1 align="center">🏪 门店商品销售统计系统</h1>
  <p align="center">多门店 · 多角色 · 销售录入与统计 · Docker 一键部署</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.x-black?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/Bootstrap-5.3-purple?logo=bootstrap" alt="Bootstrap">
  <img src="https://img.shields.io/badge/数据库-SQLite_|_MySQL-blue?logo=sqlite" alt="Database">
  <img src="https://img.shields.io/badge/架构-amd64_|_arm64-lightgrey?logo=arm" alt="Arch">
  <img src="https://img.shields.io/badge/部署-Docker-blue?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/许可证-MIT-yellow" alt="License">
</p>

---

## 📖 简介

一套面向连锁门店的**商品销售数据管理系统**。店员通过 Web 端录入每日销售数据，管理员可进行人员/商品/门店管理和多维度销售统计分析。支持 Docker 一键部署，数据库默认使用 SQLite（零配置），也可切换 MySQL。

### 核心特性

- 🔐 **双角色权限** — 店员（录入+查询） / 管理员（管理+统计），JWT 认证
- 📝 **销售录入** — 店员只能录入本人负责的商品，销售日期精确到小时
- 📊 **销售统计** — 按日期、门店、商品维度汇总，支持明细下钻和 CSV 导出
- 👥 **人员管理** — 管理员预添加人员→店员自主注册激活，密码重置
- 🏬 **门店 & 商品管理** — 门店可关联在售商品，店员可关联负责商品
- 🐳 **Docker 部署** — `docker compose up -d` 一键启动
- 💾 **数据库可切换** — 默认本地 SQLite（零配置），设 `DB_HOST` 即切 MySQL

<img width="1920" height="816" alt="image" src="https://github.com/user-attachments/assets/0e52923a-f779-4846-9572-4d5693bc93b7" />
<img width="1920" height="663" alt="image" src="https://github.com/user-attachments/assets/1d474e72-885d-4528-8a40-6b88fe022976" />
<img width="1911" height="750" alt="image" src="https://github.com/user-attachments/assets/52e30077-aee8-40a3-a74c-3102187e9424" />
<img width="1917" height="780" alt="image" src="https://github.com/user-attachments/assets/125291c7-5776-4b2a-81d4-9b542578e885" />
<img width="1917" height="777" alt="image" src="https://github.com/user-attachments/assets/14ea1f36-980b-4b09-b4c3-dccd7357ccf6" />
<img width="1908" height="669" alt="image" src="https://github.com/user-attachments/assets/50bc27c5-4135-45e3-ab82-362ad843ed43" />
<img width="1917" height="648" alt="image" src="https://github.com/user-attachments/assets/902d5a8c-e992-46f5-ba9b-0ceeec6a6ec4" />
<img width="1920" height="750" alt="image" src="https://github.com/user-attachments/assets/925de375-cb14-4219-8b77-073ac7c796e2" />
<img width="582" height="783" alt="image" src="https://github.com/user-attachments/assets/9364b9b2-c804-4031-a826-61320d65382c" />
<img width="726" height="824" alt="image" src="https://github.com/user-attachments/assets/803b75b9-fe31-4eff-8ed2-4febed85de25" />

---

## 🚀 快速开始

### 方式一：直接拉取镜像（最快，无需克隆源码）

```bash
# 创建项目目录
mkdir store-sales && cd store-sales

# 下载环境变量模板
curl -O https://raw.githubusercontent.com/Mitchll1214/StoreSales-Record/main/.env.example
mv .env.example .env

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  app:
    image: mitchll1214/storesales-record:latest
    container_name: store_sales_app
    restart: always
    ports:
      - "${PORT:-3000}:${PORT:-3000}"
    environment:
      JWT_SECRET: ${JWT_SECRET:-change-me-to-a-random-string}
      PORT: ${PORT:-3000}
    volumes:
      - sqlite_data:/app/data
volumes:
  sqlite_data:
EOF

# 启动（镜像自动适配 AMD64 / ARM64 架构）
docker compose up -d

# 访问
open http://localhost:3000
```

> 镜像 `mitchll1214/storesales-record` 支持 `linux/amd64` 和 `linux/arm64`，Docker 会自动选择匹配你机器的版本。

### 方式二：克隆源码 + Docker Compose 构建

```bash
git clone https://github.com/Mitchll1214/StoreSales-Record.git
cd StoreSales-Record

# 可选：复制环境变量模板
cp .env.example .env

# 启动
docker compose up -d

# 访问
open http://localhost:3000
```

### 方式三：Docker + MySQL（需克隆源码）

编辑 `.env`，填入 MySQL 连接信息并取消 `docker-compose.yml` 中 MySQL 服务的注释：

```env
DB_HOST=mysql        # docker-compose 内部服务名
DB_PORT=3306
DB_NAME=store_sales
DB_USER=root
DB_PASSWORD=你的密码
JWT_SECRET=随机字符串
PORT=3000
```

```bash
docker compose up -d
```

### 方式四：本地开发

```bash
npm install
cp .env.example .env    # 编辑 .env 按需配置

# SQLite 模式（默认，零配置）
npm run dev

# MySQL 模式（在 .env 中设置 DB_HOST）
DB_HOST=localhost npm run dev
```

### 默认账号

| 角色 | 手机号 | 密码 | 首次登录后 |
|------|--------|------|-----------|
| 管理员 | `13800000000` | `88888888` | 请立即修改密码 |

---

## 👥 角色与功能

### 店员（clerk）

| 模块 | 功能 |
|------|------|
| 信息管理 | 查看个人资料，修改收款银行卡号 |
| 销售录入 | 选择本人负责的商品，录入当日销售数量 |
| 销售查询 | 按商品/日期查询本门店全部销售记录（分页） |

### 管理员（admin）

| 模块 | 功能 |
|------|------|
| 人员管理 | 新增/修改人员，分配门店和负责商品，重置密码 |
| 商品管理 | 新增商品，管理启用/禁用状态 |
| 门店管理 | 新增/修改门店信息，关联在售商品 |
| 销售统计报表 | 按日期汇总各门店商品销量，查看明细，导出 CSV |
| 销售统计明细表 | 按起止日期/商品/门店查询原始记录，支持删除和导出 |

---

## 🔄 用户注册流程

```
管理员「新增人员」→ 账号状态 = 待激活
         ↓
店员打开注册页 → 输入手机号 + 设置密码
         ↓
校验：手机号存在 且 状态为"待激活"
         ↓
注册成功 → 状态自动变为"启用" → 可登录
```

---

## 🗄️ 数据库表设计

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `stores` | 门店信息表 | `store_code`(唯一), `store_name`, 联系人, 地址 |
| `products` | 商品信息表 | `product_code`(唯一), `product_name`, 状态, 负责人 |
| `users` | 用户表 | `phone`(唯一), `password`, `role`, `store_code`, 账号状态 |
| `store_products` | 门店-商品关联 | `store_code` + `product_id` 联合唯一 |
| `user_products` | 店员-商品关联 | `user_id` + `product_id` 联合唯一 |
| `sales_records` | 销售记录表 | 门店, 商品, 数量, 销售日期(精确到小时), 销售人员 |

> 所有字段均含中文注释，详见 `init.sql` 和 `src/models/*.js`。

---

## 🌐 API 概览

### 认证

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/login` | 登录页面 |
| `POST` | `/api/auth/login` | 登录（返回 JWT Cookie） |
| `GET` | `/register` | 注册页面 |
| `POST` | `/api/auth/register` | 店员注册激活 |
| `GET` | `/logout` | 退出 |

### 店员

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/clerk/info` | 个人信息页 |
| `GET` | `/api/clerk/info` | 获取个人信息 |
| `PUT` | `/api/clerk/info` | 修改银行卡号 |
| `GET` | `/clerk/sales-entry` | 销售录入页 |
| `POST` | `/api/clerk/sales` | 提交销售记录 |
| `GET` | `/clerk/sales-query` | 销售查询页 |
| `GET` | `/api/clerk/sales` | 查询记录（分页） |

### 管理员

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/admin/users` | 人员管理页 |
| `GET/POST` | `/api/admin/users` | 列表 / 新增 |
| `GET/PUT/DELETE` | `/api/admin/users/:id` | 详情 / 修改 / 删除 |
| `GET` | `/api/admin/users/export` | 导出人员 CSV |
| `GET` | `/admin/products` | 商品管理页 |
| `GET/POST` | `/api/admin/products` | 列表 / 新增 |
| `PUT/DELETE` | `/api/admin/products/:id` | 修改 / 删除 |
| `GET` | `/admin/stores` | 门店管理页 |
| `GET/POST` | `/api/admin/stores` | 列表 / 新增 |
| `GET/PUT/DELETE` | `/api/admin/stores/:id` | 详情 / 修改 / 删除 |
| `GET` | `/admin/reports` | 销售统计报表页 |
| `GET` | `/api/admin/reports` | 统计数据（支持日期范围） |
| `GET` | `/api/admin/reports/detail` | 汇总明细下钻 |
| `GET` | `/api/admin/reports/export` | 导出报表 CSV |
| `GET` | `/admin/sales-detail` | 销售明细表页 |
| `GET` | `/api/admin/sales-records` | 查询明细（分页） |
| `DELETE` | `/api/admin/sales-records/:id` | 删除记录 |
| `GET` | `/api/admin/sales-records/export` | 导出明细 CSV |
| `GET` | `/admin/operation-logs` | 操作日志页 |
| `GET` | `/api/admin/operation-logs` | 查询日志（分页+日期筛选） |
| `DELETE` | `/api/admin/operation-logs` | 清空45天前日志 |

---

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DB_HOST` | *(空)* | 留空=SQLite；设置则连接 MySQL |
| `DB_PORT` | `3306` | MySQL 端口（SQLite 忽略） |
| `DB_NAME` | `store_sales` | 数据库名 |
| `DB_USER` | `root` | MySQL 用户名 |
| `DB_PASSWORD` | — | MySQL 密码 |
| `DB_DIALECT` | *(自动)* | 手动指定 `sqlite` 或 `mysql` |
| `JWT_SECRET` | — | **生产环境务必修改** |
| `PORT` | `3000` | 服务端口 |

> **数据库选择逻辑**：检测到 `DB_HOST` 环境变量 → MySQL；否则 → SQLite（数据文件 `data/store_sales.sqlite`）。

---

## 📁 项目结构

```
StoreSales-Record/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── init.sql                     # MySQL 建表脚本
├── package.json
└── src/
    ├── app.js                   # Express 入口
    ├── config/
    │   └── database.js          # 数据库连接（自动 SQLite / MySQL）
    ├── middleware/
    │   └── auth.js              # JWT 认证 + 角色鉴权
    ├── models/                  # Sequelize 模型（7 张表，均含中文注释）
    │   ├── index.js             # 关联 & 自动建表 + 迁移
    │   ├── Store.js             # 门店
    │   ├── Product.js           # 商品
    │   ├── User.js              # 用户
    │   ├── StoreProduct.js      # 门店-商品
    │   ├── UserProduct.js       # 店员-商品
    │   ├── SalesRecord.js       # 销售记录
    │   └── OperationLog.js      # 操作日志
    ├── routes/
    │   ├── auth.js              # 登录/注册
    │   ├── home.js              # 首页（随机语录）
    │   ├── clerk.js             # 店员功能
    │   └── admin.js             # 管理员功能
    ├── views/                   # EJS 模板（Bootstrap 5 美化）
    │   ├── home.ejs             # 首页
    │   ├── login.ejs
    │   ├── register.ejs
    │   ├── clerk/               # info / sales-entry / sales-query
    │   ├── admin/               # users / products / stores / reports / sales-detail / operation-logs
    │   └── partials/            # header / sidebar-admin / sidebar-clerk
    └── public/
        └── css/style.css
```

---

## 🔒 安全建议

1. **生产环境**修改 `.env` 中 `JWT_SECRET` 为高强度随机字符串
2. 默认管理员密码 `88888888` 首次登录后请立即修改
3. JWT Token 存储在 httpOnly Cookie，有效期 8 小时
4. 所有密码使用 bcrypt 哈希存储

---

## 📄 许可证

MIT License
