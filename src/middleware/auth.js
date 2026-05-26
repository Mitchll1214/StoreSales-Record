// JWT 认证中间件 — 验证用户登录状态 & 角色权限
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-to-a-random-string';

// 验证JWT token，将用户信息注入 req.user
async function authRequired(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    // API请求返回JSON，页面请求重定向到登录页
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: '请先登录' });
    }
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    if (user.status !== 'active') {
      res.clearCookie('token');
      return res.status(403).json({ error: '账号已被禁用或未激活' });
    }
    req.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
    return res.redirect('/login');
  }
}

// 仅允许管理员角色访问
function adminRequired(req, res, next) {
  if (req.user.role !== 'admin') {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ error: '无权限，仅管理员可操作' });
    }
    return res.status(403).send('无权限访问');
  }
  next();
}

// 仅允许店员角色访问
function clerkRequired(req, res, next) {
  if (req.user.role !== 'clerk') {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ error: '无权限，仅店员可操作' });
    }
    return res.status(403).send('无权限访问');
  }
  next();
}

module.exports = { authRequired, adminRequired, clerkRequired, JWT_SECRET };
