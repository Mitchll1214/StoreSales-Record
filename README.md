<p align="center">
  <h1 align="center">🏪 门店商品销售统计系统</h1>
  <p align="center">多门店 · 多角色 · 销售录入与统计 · 库存上报 · 排班管理 · Docker 一键部署</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.x-black?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/Bootstrap-5.3-purple?logo=bootstrap" alt="Bootstrap">
  <img src="https://img.shields.io/badge/数据库-SQLite_|_MySQL-blue?logo=sqlite" alt="Database">
  <img src="https://img.shields.io/badge/Docker-部署-blue?logo=docker" alt="Docker">
</p>

---

## 📖 简介

一套面向连锁门店的**商品销售与库存管理系统**。店员通过 Web 端录入每日销售数据、上报库存，查看排班；管理员进行人员/商品/门店管理、多维度销售统计、库存报表和排班安排。默认 SQLite（零配置），也可切换 MySQL。

### 核心特性

- 🔐 **双角色权限** — 店员（录入/查询/库存/排班） / 管理员（管理/统计/排班），JWT 认证
- 📝 **销售录入** — 店员录入本人负责商品销量，日期精确到小时，下拉框支持条码搜索
- 📦 **库存上报** — 店员按日期填写商品库存数，支持 7 天内回溯，自动回填历史数据
- 📅 **排班管理** — 管理员可视化日历排班，店员查看本门店排班
- ⭐ **自定义快捷入口** — 每个页面标题栏可收藏/取消，首页仅展示已收藏的菜单卡片
- 📊 **销售统计** — 按日期/门店/商品汇总，明细下载，CSV 导出
- 👥 **人员管理** — 管理员预添加人员→店员自主注册激活，密码重置
- 🏬 **门店 & 商品管理** — 门店可关联在售商品，店员可关联负责商品
- 🐳 **Docker 部署** — `docker compose up -d` 一键启动
- 💾 **数据库可切换** — 默认本地 SQLite（零配置），设 `DB_HOST` 即切 MySQL
- 🕐 **北京时间** — 全局 `+08:00` 时区，数据库与应用一致

---

## 🚀 快速开始

### 方式一：直接拉取镜像

```bash
mkdir store-sales && cd store-sales
curl -O https://raw.githubusercontent.com/Mitchll1214/StoreSales-Record/main/.env.example
mv .env.example .env

cat > docker-compose.yml << 'EOF'
services:
  app:
    image: mitchll1214/store-sales-record:latest
    container_name: store_sales_app
    restart: always
    ports:
      - "${PORT:-3000}:${PORT:-3000}"
    environment:
      JWT_SECRET: ${JW**********g}
      PORT: ${PORT:-3000}
    volumes:
      - sqlite_data:/app/data
volumes:
  sqlite_data:
EOF

docker compose up -d
open http://localhost:3000
```

### 方式二：克隆源码 + Docker Compose

```bash
git clone https://github.com/Mitchll1214/StoreSales-Record.git
cd StoreSales-Record
cp .env.example .env
docker compose up -d
```

### 方式三：Docker + 外部 MySQL

```env
DB_HOST=your-mysql-host.com
DB_PORT=3306
DB_NAME=store_sales
DB_USER=root
DB_PASSWORD=your*****word
```

### 方式四：本地开发

```bash
npm install && cp .env.example .env
npm run dev                          # SQLite 默认
DB_HOST=your-mysql-host.com npm run dev  # MySQL
```

### 默认账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 管理员 | `13800000000` | `88888888` |

---

## 👥 角色与功能

### 店员

| 模块 | 功能 |
|------|------|
| 信息管理 | 查看/修改个人资料和银行卡号 |
| 销售录入 | 选择本人负责商品，录入每日销售数量 |
| 销售数据查询 | 按商品/日期查询本门店销售记录 |
| 库存上报 | 按日期填写商品库存数，查看历史和上次提交时间 |
| 门店排班 | 查看本门店日历排班 |

### 管理员

| 模块 | 功能 |
|------|------|
| 人员管理 | 新增/修改/删除人员，分配门店和负责商品，重置密码，导出 CSV |
| 商品管理 | 新增/修改/删除商品，管理启用/禁用状态 |
| 门店管理 | 新增/修改/删除门店，关联在售商品 |
| 排班管理 | 可视化日历排班，按日期+门店勾选人员 |
| 库存报表 | 按门店/商品/日期筛选，排序，导出 CSV |
| 销售统计报表 | 按日期汇总各门店商品销量，明细下载，导出 CSV |
| 销售统计明细表 | 查询原始销售记录，支持删除和导出 |
| 操作日志 | 查看所有用户关键操作记录，可清空 45 天前日志 |

---

## 🔄 用户注册流程

```
管理员「新增人员」→ 状态 = 待激活
     ↓
店员注册页 → 输入手机号 + 设置密码
     ↓
校验通过 → 状态自动变为"启用" → 可登录
```

---

## 🗄️ 数据库表设计

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `ssr_stores` | 门店信息表 | `store_code`(唯一), `store_name` |
| `ssr_products` | 商品信息表 | `product_code`(唯一), `product_name`, `status` |
| `ssr_users` | 用户表 | `phone`(唯一), `role`, `store_code`, `status` |
| `ssr_store_products` | 门店-商品关联 | `store_code` + `product_id` 联合唯一 |
| `ssr_user_products` | 店员-商品关联 | `user_id` + `product_id` 联合唯一 |
| `ssr_sales_records` | 销售记录表 | `store_code`, `product_id`, `quantity`, `sale_date` |
| `ssr_inventory_records` | 库存记录表 | `store_code` + `product_id` + `record_date` 联合唯一 |
| `ssr_schedules` | 排班表 | `schedule_date` + `store_code` + `user_id` 联合唯一 |
| `ssr_operation_logs` | 操作日志表 | `user_phone`, `action`, `created_at` |
| `ssr_user_favorites` | 用户收藏表 | `user_id` + `page_key` 联合唯一 |

---

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DB_HOST` | *(空)* | 留空=SQLite；设置则连接 MySQL |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_NAME` | `store_sales` | 数据库名 |
| `DB_USER` | `root` | MySQL 用户名 |
| `DB_PASSWORD` | — | MySQL 密码 |
| `JWT_SECRET` | — | 生产环境务必修改 |
| `PORT` | `3000` | 服务端口 |

---

## 📁 项目结构

```
StoreSales-Record/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── init.sql
├── package.json
└── src/
    ├── app.js
    ├── config/
    │   └── database.js
    ├── middleware/
    │   └── auth.js
    ├── models/
    │   ├── index.js
    │   ├── Store.js / Product.js / User.js
    │   ├── StoreProduct.js / UserProduct.js
    │   ├── SalesRecord.js / InventoryRecord.js
    │   ├── Schedule.js / OperationLog.js / UserFavorite.js
    ├── routes/
    │   ├── auth.js / home.js / clerk.js / admin.js
    ├── views/
    │   ├── home.ejs / login.ejs / register.ejs
    │   ├── clerk/   (info, sales-entry, sales-query, inventory, schedules)
    │   ├── admin/   (users, products, stores, reports, sales-detail, inventory, schedules, operation-logs)
    │   └── partials/
    └── public/css/style.css
```

---

## 📄 许可证

MIT License
