// 门店商品销售统计系统 — Express 应用入口
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const { syncDatabase, Store, User } = require('./models');
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const clerkRoutes = require('./routes/clerk');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ========== 中间件 ==========

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie 解析
app.use(cookieParser());

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));

// ========== 视图引擎 ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ========== 路由 ==========

// 根路径重定向到登录页
app.get('/', (req, res) => res.redirect('/login'));

// 认证路由（登录、注册、登出）
app.use('/', authRoutes);

// 首页路由
app.use('/', homeRoutes);

// 店员路由（挂载在 / 下，路由内部自带 /clerk 前缀）
app.use('/', clerkRoutes);

// 管理员路由（挂载在 / 下，路由内部自带 /admin 前缀）
app.use('/', adminRoutes);

// 404 处理
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: '接口不存在' });
  }
  res.status(404).send('<h3>404 - 页面不存在</h3><a href="/login">返回登录</a>');
});

// ========== 初始化默认数据 ==========
async function seedDefaults() {
  // 确保总部门店存在
  const existingStore = await Store.findOne({ where: { store_code: 'HQ001' } });
  if (!existingStore) {
    await Store.create({
      store_code: 'HQ001',
      store_name: '总部',
      contact_person: '管理员',
      contact_phone: '13800000000',
      address: '总部地址',
      status: 1,
    });
    console.log('[Seed] 默认门店 HQ001 已创建');
  }

  // 确保默认管理员存在（密码 88888888）
  const existingAdmin = await User.findOne({ where: { phone: '13800000000' } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('88888888', 10);
    await User.create({
      phone: '13800000000',
      password: hashedPassword,
      name: '系统管理员',
      gender: '男',
      role: 'admin',
      store_code: 'HQ001',
      status: 'active',
    });
    console.log('[Seed] 默认管理员已创建 (13800000000 / 88888888)');
  }
}

// ========== 启动服务 ==========
async function start() {
  // 同步数据库（带重试）
  await syncDatabase();

  // 初始化默认数据
  await seedDefaults();

  app.listen(PORT, () => {
    console.log(`[Server] 门店销售统计系统已启动: http://localhost:${PORT}`);
    console.log(`[Server] 默认管理员账号: 13800000000 / 88888888`);
  });
}

start().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
