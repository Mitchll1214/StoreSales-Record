// 认证路由 — 登录、注册、登出
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ========== 页面路由 ==========

// 登录页面
router.get('/login', (req, res) => {
  // 已登录则跳转对应首页
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.redirect(decoded.role === 'admin' ? '/admin/users' : '/clerk/info');
    } catch (_) { /* token无效，继续显示登录页 */ }
  }
  res.render('login', { error: null });
});

// 注册页面
router.get('/register', (req, res) => {
  res.render('register', { error: null, success: null });
});

// ========== API路由 ==========

// 登录API
router.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: '手机号未注册，请联系管理员添加人员' });
    }
    if (user.status === 'pending') {
      return res.status(400).json({ error: '账号尚未激活，请先注册' });
    }
    if (user.status === 'disabled') {
      return res.status(400).json({ error: '账号已被禁用，请联系管理员' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: '密码错误，可联系管理员重置' });
    }

    // 签发JWT，有效期8小时
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    // 返回JSON，前端根据角色跳转
    res.json({
      success: true,
      role: user.role,
      redirect: user.role === 'admin' ? '/admin/users' : '/clerk/info',
      name: user.name,
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 注册API（手机号+密码）
router.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于6位' });
    }

    // 查找该手机号的用户，状态必须为 pending（待激活）
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(400).json({ error: '该手机号不存在于系统中，请联系管理员添加' });
    }
    if (user.status === 'active') {
      return res.status(400).json({ error: '该手机号已注册激活，请直接登录' });
    }
    if (user.status === 'disabled') {
      return res.status(400).json({ error: '该账号已被禁用，无法注册' });
    }
    // status === 'pending' — 允许注册

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.status = 'active';
    await user.save();

    res.json({ success: true, message: '注册&激活成功，请登录' });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 登出
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
