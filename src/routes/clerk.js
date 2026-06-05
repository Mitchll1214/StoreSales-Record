// 店员功能路由 — 信息管理、销售录入、销售数据查询
const express = require('express');
const { Op } = require('sequelize');
const { User, Product, SalesRecord, UserProduct, StoreProduct, OperationLog } = require('../models');
const { authRequired, clerkRequired } = require('../middleware/auth');

const router = express.Router();

// 获取北京时间（Docker 容器内 UTC 时区修正）
function beijingNow() {
  const utc = new Date();
  return new Date(utc.getTime() + 8 * 60 * 60 * 1000);
}

// 仅对 /clerk/* 和 /api/clerk/* 路径启用登录 + 店员角色校验
router.use('/clerk', authRequired, clerkRequired);
router.use('/api/clerk', authRequired, clerkRequired);

// ========== 页面路由 ==========

// 个人信息页
router.get('/clerk/info', (req, res) => {
  res.render('clerk/info', {
    user: req.user,
    currentPage: 'info',
    title: '信息管理',
  });
});

// 销售录入页
router.get('/clerk/sales-entry', async (req, res) => {
  try {
    // 获取该店员负责的商品（仅启用状态）
    const userProducts = await UserProduct.findAll({
      where: { user_id: req.user.id },
      attributes: ['product_id'],
    });
    const productIds = userProducts.map(up => up.product_id);
    const products = productIds.length > 0
      ? await Product.findAll({
          where: { id: productIds, status: 1 },
        })
      : [];

    res.render('clerk/sales-entry', {
      user: req.user,
      products,
      currentPage: 'sales-entry',
      title: '销售录入',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('服务器错误');
  }
});

// 销售数据查询页
router.get('/clerk/sales-query', (req, res) => {
  res.render('clerk/sales-query', {
    user: req.user,
    currentPage: 'sales-query',
    title: '销售数据查询',
  });
});

// ========== API路由 ==========

// 获取个人信息
router.get('/api/clerk/info', (req, res) => {
  res.json({
    phone: req.user.phone,
    name: req.user.name,
    gender: req.user.gender,
    store_code: req.user.store_code,
    bank_card: req.user.bank_card || '',
    payee_name: req.user.payee_name || '',
    bank_name: req.user.bank_name || '',
  });
});

// 更新个人信息
router.put('/api/clerk/info', async (req, res) => {
  try {
    const { bank_card, payee_name, bank_name } = req.body;
    if (bank_card !== undefined) req.user.bank_card = bank_card || null;
    if (payee_name !== undefined) req.user.payee_name = payee_name || null;
    if (bank_name !== undefined) req.user.bank_name = bank_name || null;
    await req.user.save();
    res.json({ success: true, message: '更新成功' });
    // 记录操作日志
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      await OperationLog.create({
        user_phone: req.user.phone,
        user_name: req.user.name,
        action: '修改个人信息',
        ip_address: ip,
        created_at: beijingNow(),
      });
    } catch (_) { /* 日志失败不影响主流程 */ }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新失败' });
  }
});

// 获取店员负责的商品列表
router.get('/api/clerk/products', async (req, res) => {
  try {
    const userProducts = await UserProduct.findAll({
      where: { user_id: req.user.id },
    });
    const productIds = userProducts.map(up => up.product_id);
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds }, status: 1 },
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

// 提交销售记录
router.post('/api/clerk/sales', async (req, res) => {
  try {
    const { product_id, quantity, sale_date } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: '请选择商品' });
    }
    if (!quantity || !Number.isInteger(+quantity) || +quantity <= 0) {
      return res.status(400).json({ error: '销售数量必须为正整数' });
    }

    // 验证该店员负责此商品
    const up = await UserProduct.findOne({
      where: { user_id: req.user.id, product_id },
    });
    if (!up) {
      return res.status(400).json({ error: '您不负责该商品，无法录入' });
    }

    // 获取商品名称
    const product = await Product.findByPk(product_id);
    if (!product || product.status !== 1) {
      return res.status(400).json({ error: '商品不存在或已禁用' });
    }

    const record = await SalesRecord.create({
      store_code: req.user.store_code,
      product_id: product.id,
      product_name: product.product_name,
      quantity: parseInt(quantity, 10),
      sale_date: sale_date || beijingNow(),
      sales_person: `${req.user.phone}+${req.user.name}`,
      recorded_at: beijingNow(),
    });

    res.json({ success: true, message: '销售记录提交成功', data: record });
    // 记录操作日志
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      await OperationLog.create({
        user_phone: req.user.phone,
        user_name: req.user.name,
        action: `提交销售：${product.product_name} x${quantity} (门店:${req.user.store_code})`,
        ip_address: ip,
        created_at: beijingNow(),
      });
    } catch (_) { /* 日志失败不影响主流程 */ }
  } catch (err) {
    console.error('提交销售记录失败:', err);
    res.status(500).json({ error: '提交失败' });
  }
});

// 查询销售数据（该门店所有记录）
router.get('/api/clerk/sales', async (req, res) => {
  try {
    const { product_id, start_date, end_date, page = 1, page_size = 10 } = req.query;
    const where = { store_code: req.user.store_code };

    // 商品筛选
    if (product_id) {
      where.product_id = product_id;
    }

    // 日期筛选：默认最近30天，最多前推60天
    if (start_date && end_date) {
      where.sale_date = { [Op.between]: [new Date(start_date), new Date(end_date)] };
    } else {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.sale_date = { [Op.gte]: thirtyDaysAgo };
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(page_size, 10);
    const { count, rows } = await SalesRecord.findAndCountAll({
      where,
      order: [['sale_date', 'DESC'], ['recorded_at', 'DESC']],
      limit: parseInt(page_size, 10),
      offset,
    });

    // 格式化数据
    const records = rows.map(r => ({
      id: r.id,
      store_code: r.store_code,
      sale_date: r.sale_date,
      sales_person: r.sales_person,
      product_name: r.product_name,
      quantity: r.quantity,
      recorded_at: r.recorded_at,
    }));

    // 提取销售人员姓名（去掉手机号前缀）
    const formatted = records.map(r => {
      const parts = r.sales_person.split('+');
      return { ...r, sales_person_name: parts[1] || r.sales_person };
    });

    res.json({
      data: formatted,
      total: count,
      page: parseInt(page, 10),
      page_size: parseInt(page_size, 10),
      total_pages: Math.ceil(count / parseInt(page_size, 10)),
    });
  } catch (err) {
    console.error('查询销售记录失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 获取门店所有商品（用于筛选下拉）
router.get('/api/clerk/store-products', async (req, res) => {
  try {
    const storeProducts = await StoreProduct.findAll({ where: { store_code: req.user.store_code } });
    const productIds = storeProducts.map(sp => sp.product_id);
    if (productIds.length === 0) return res.json([]);
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds }, status: 1 },
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取失败' });
  }
});

module.exports = router;
