// 管理员功能路由 — 人员管理、商品管理、门店管理、销售统计报表
const express = require('express');
const bcrypt = require('bcryptjs');
const { Op, fn, col, literal } = require('sequelize');
const {
  User, Product, Store, StoreProduct, UserProduct, SalesRecord, sequelize,
} = require('../models');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

// 仅对 /admin/* 和 /api/admin/* 路径启用登录 + 管理员角色校验
router.use('/admin', authRequired, adminRequired);
router.use('/api/admin', authRequired, adminRequired);

// ========== 页面路由 ==========

router.get('/admin/users', (req, res) => {
  res.render('admin/users', { user: req.user, currentPage: 'users', title: '人员管理' });
});

router.get('/admin/products', (req, res) => {
  res.render('admin/products', { user: req.user, currentPage: 'products', title: '商品管理' });
});

router.get('/admin/stores', (req, res) => {
  res.render('admin/stores', { user: req.user, currentPage: 'stores', title: '门店管理' });
});

router.get('/admin/reports', (req, res) => {
  res.render('admin/reports', { user: req.user, currentPage: 'reports', title: '销售统计报表' });
});

router.get('/admin/sales-detail', (req, res) => {
  res.render('admin/sales-detail', { user: req.user, currentPage: 'sales-detail', title: '销售统计明细表' });
});

// ========== 人员管理 API ==========

// 查询人员列表（支持筛选）
router.get('/api/admin/users', async (req, res) => {
  try {
    const { store_code, name, phone, status } = req.query;
    const where = {};
    if (store_code) where.store_code = store_code;
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (phone) where.phone = { [Op.like]: `%${phone}%` };
    if (status) where.status = status;

    const users = await User.findAll({
      where,
      attributes: ['id', 'phone', 'name', 'gender', 'role', 'store_code', 'bank_card', 'status'],
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 新增人员
router.post('/api/admin/users', async (req, res) => {
  try {
    const { phone, name, gender, role, store_code, product_ids } = req.body;
    if (!phone) return res.status(400).json({ error: '手机号必填' });
    if (!name) return res.status(400).json({ error: '姓名必填' });
    if (!role) return res.status(400).json({ error: '角色必选' });

    // 检查手机号唯一
    const existing = await User.findOne({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: '该手机号已存在' });
    }

    // 默认密码 88888888，状态为 pending（待激活）
    const hashedPassword = await bcrypt.hash('88888888', 10);
    const user = await User.create({
      phone,
      password: hashedPassword,
      name,
      gender: gender || null,
      role: role || 'clerk',
      store_code: store_code || '',
      status: 'pending',
    });

    // 关联负责商品（店员角色）
    if (product_ids && product_ids.length > 0 && role === 'clerk') {
      const records = product_ids.map(pid => ({ user_id: user.id, product_id: pid }));
      await UserProduct.bulkCreate(records);
    }

    res.json({ success: true, message: '新增成功', data: user });
  } catch (err) {
    console.error('新增人员失败:', err);
    res.status(500).json({ error: '新增失败' });
  }
});

// 修改人员信息
router.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { name, gender, role, store_code, product_ids, reset_password, status } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    if (name) user.name = name;
    if (gender !== undefined) user.gender = gender;
    if (role) user.role = role;
    if (store_code) user.store_code = store_code;
    if (status) user.status = status;

    // 重置密码为默认密码 88888888
    if (reset_password) {
      user.password = await bcrypt.hash('88888888', 10);
    }

    await user.save();

    // 更新负责商品关联（先删后建）
    if (product_ids !== undefined && role === 'clerk') {
      await UserProduct.destroy({ where: { user_id: user.id } });
      if (product_ids.length > 0) {
        const records = product_ids.map(pid => ({ user_id: user.id, product_id: pid }));
        await UserProduct.bulkCreate(records);
      }
    }

    res.json({ success: true, message: '修改成功' });
  } catch (err) {
    console.error('修改人员失败:', err);
    res.status(500).json({ error: '修改失败' });
  }
});

// 获取单个人员详情
router.get('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    // 获取负责商品
    const userProducts = await UserProduct.findAll({ where: { user_id: user.id } });
    const productIds = userProducts.map(up => up.product_id);

    res.json({
      ...user.toJSON(),
      product_ids: productIds,
      password: undefined, // 不返回密码
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 删除人员（同时清理关联的商品关系）
router.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    // 清理该用户的商品负责关联
    await UserProduct.destroy({ where: { user_id: user.id } });

    await user.destroy();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除人员失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// ========== 商品管理 API ==========

// 查询所有商品
router.get('/api/admin/products', async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['created_at', 'DESC']] });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 新增商品
router.post('/api/admin/products', async (req, res) => {
  try {
    const { product_code, product_name, person_in_charge } = req.body;
    if (!product_code) return res.status(400).json({ error: '商品条码必填' });
    if (!product_name) return res.status(400).json({ error: '商品名称必填' });

    const existing = await Product.findOne({ where: { product_code } });
    if (existing) return res.status(400).json({ error: '商品条码已存在' });

    const product = await Product.create({
      product_code,
      product_name,
      person_in_charge: person_in_charge || null,
      status: 1, // 默认启用
    });
    res.json({ success: true, message: '新增成功', data: product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '新增失败' });
  }
});

// 修改商品（切换状态）
router.put('/api/admin/products/:id', async (req, res) => {
  try {
    const { status, product_name, person_in_charge } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: '商品不存在' });

    if (status !== undefined) product.status = status;
    if (product_name) product.product_name = product_name;
    if (person_in_charge !== undefined) product.person_in_charge = person_in_charge;
    await product.save();

    res.json({ success: true, message: '修改成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '修改失败' });
  }
});

// 删除商品（同时清理关联的门店/店员/销售记录）
router.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: '商品不存在' });

    // 清理关联数据
    await StoreProduct.destroy({ where: { product_id: product.id } });
    await UserProduct.destroy({ where: { product_id: product.id } });
    await SalesRecord.destroy({ where: { product_id: product.id } });

    await product.destroy();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除商品失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// ========== 门店管理 API ==========

// 查询所有门店
router.get('/api/admin/stores', async (req, res) => {
  try {
    const stores = await Store.findAll({ order: [['created_at', 'DESC']] });
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 新增门店
router.post('/api/admin/stores', async (req, res) => {
  try {
    const { store_code, store_name, contact_person, contact_phone, contact_person2, contact_phone2, address, product_ids } = req.body;
    if (!store_code) return res.status(400).json({ error: '门店编码必填' });
    if (!store_name) return res.status(400).json({ error: '门店名称必填' });

    const existing = await Store.findOne({ where: { store_code } });
    if (existing) return res.status(400).json({ error: '门店编码已存在' });

    const store = await Store.create({
      store_code,
      store_name,
      contact_person: contact_person || null,
      contact_phone: contact_phone || null,
      contact_person2: contact_person2 || null,
      contact_phone2: contact_phone2 || null,
      address: address || null,
    });

    // 关联在售商品
    if (product_ids && product_ids.length > 0) {
      const records = product_ids.map(pid => ({ store_code: store.store_code, product_id: pid }));
      await StoreProduct.bulkCreate(records);
    }

    res.json({ success: true, message: '新增成功', data: store });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '新增失败' });
  }
});

// 修改门店
router.put('/api/admin/stores/:id', async (req, res) => {
  try {
    const { store_name, contact_person, contact_phone, contact_person2, contact_phone2, address, product_ids } = req.body;
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ error: '门店不存在' });

    if (store_name) store.store_name = store_name;
    if (contact_person !== undefined) store.contact_person = contact_person;
    if (contact_phone !== undefined) store.contact_phone = contact_phone;
    if (contact_person2 !== undefined) store.contact_person2 = contact_person2;
    if (contact_phone2 !== undefined) store.contact_phone2 = contact_phone2;
    if (address !== undefined) store.address = address;
    await store.save();

    // 更新在售商品关联
    if (product_ids !== undefined) {
      await StoreProduct.destroy({ where: { store_code: store.store_code } });
      if (product_ids.length > 0) {
        const records = product_ids.map(pid => ({ store_code: store.store_code, product_id: pid }));
        await StoreProduct.bulkCreate(records);
      }
    }

    res.json({ success: true, message: '修改成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '修改失败' });
  }
});

// 获取单个门店详情（含在售商品）
router.get('/api/admin/stores/:id', async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ error: '门店不存在' });

    const sps = await StoreProduct.findAll({ where: { store_code: store.store_code } });
    const productIds = sps.map(sp => sp.product_id);

    res.json({ ...store.toJSON(), product_ids: productIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 删除门店（同时清理关联商品、用户、销售记录）
router.delete('/api/admin/stores/:id', async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ error: '门店不存在' });

    const storeCode = store.store_code;

    // 清理关联数据
    await StoreProduct.destroy({ where: { store_code: storeCode } });
    await SalesRecord.destroy({ where: { store_code: storeCode } });
    // 将该门店下的用户门店编码置空
    await User.update({ store_code: '' }, { where: { store_code: storeCode } });

    await store.destroy();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除门店失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// ========== 销售统计报表 API ==========

// 统计：每款商品在每个门店中的销售合计数
router.get('/api/admin/reports', async (req, res) => {
  try {
    const { date, store_code, product_ids } = req.query;

    // 日期筛选（精确到小时）
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where = {
      sale_date: { [Op.between]: [startOfDay, endOfDay] },
    };
    if (store_code) where.store_code = store_code;

    // 多商品筛选
    if (product_ids) {
      const ids = Array.isArray(product_ids) ? product_ids : product_ids.split(',');
      where.product_id = { [Op.in]: ids.map(Number) };
    }

    const results = await SalesRecord.findAll({
      attributes: [
        'store_code',
        'product_id',
        'product_name',
        [fn('SUM', col('quantity')), 'total_quantity'],
        [fn('COUNT', col('id')), 'record_count'],
      ],
      where,
      group: ['store_code', 'product_id', 'product_name'],
      order: [['store_code', 'ASC'], ['product_name', 'ASC']],
      raw: true,
    });

    res.json({ data: results, date: targetDate.toISOString().slice(0, 10) });
  } catch (err) {
    console.error('报表查询失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 统计明细：查看某条汇总记录下的所有销售明细
router.get('/api/admin/reports/detail', async (req, res) => {
  try {
    const { date, store_code, product_id } = req.query;
    if (!date || !store_code || !product_id) {
      return res.status(400).json({ error: '参数不完整' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await SalesRecord.findAll({
      where: {
        store_code,
        product_id: parseInt(product_id, 10),
        sale_date: { [Op.between]: [startOfDay, endOfDay] },
      },
      order: [['sale_date', 'ASC']],
    });

    const formatted = records.map(r => {
      const parts = r.sales_person.split('+');
      return {
        id: r.id,
        store_code: r.store_code,
        product_name: r.product_name,
        quantity: r.quantity,
        sale_date: r.sale_date,
        recorded_at: r.recorded_at,
        sales_person: r.sales_person,
        sales_person_name: parts[1] || r.sales_person,
      };
    });

    res.json({ data: formatted });
  } catch (err) {
    console.error('明细查询失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 导出报表为 CSV
router.get('/api/admin/reports/export', async (req, res) => {
  try {
    const { date, store_code, product_ids } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where = {
      sale_date: { [Op.between]: [startOfDay, endOfDay] },
    };
    if (store_code) where.store_code = store_code;
    if (product_ids) {
      const ids = Array.isArray(product_ids) ? product_ids : product_ids.split(',');
      where.product_id = { [Op.in]: ids.map(Number) };
    }

    const results = await SalesRecord.findAll({
      attributes: [
        'store_code',
        'product_id',
        'product_name',
        [fn('SUM', col('quantity')), 'total_quantity'],
        [fn('COUNT', col('id')), 'record_count'],
      ],
      where,
      group: ['store_code', 'product_id', 'product_name'],
      order: [['store_code', 'ASC'], ['product_name', 'ASC']],
      raw: true,
    });

    // 生成 CSV（BOM 头确保 Excel 正确识别中文）
    const BOM = '\uFEFF';
    let csv = BOM + '门店编码,商品名称,销售总数量,记录笔数\n';
    for (const r of results) {
      csv += `${r.store_code},${r.product_name},${r.total_quantity},${r.record_count}\n`;
    }

    const filename = `销售统计报表_${targetDate.toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(csv);
  } catch (err) {
    console.error('导出失败:', err);
    res.status(500).json({ error: '导出失败' });
  }
});

// ========== 销售统计明细表 API ==========

// 查询销售明细（支持起止日期、商品多选、门店筛选，分页）
router.get('/api/admin/sales-records', async (req, res) => {
  try {
    const { start_date, end_date, store_code, product_ids, page = 1, page_size = 10 } = req.query;
    const where = {};

    if (start_date && end_date) {
      where.sale_date = { [Op.between]: [new Date(start_date), new Date(end_date)] };
    } else if (start_date) {
      where.sale_date = { [Op.gte]: new Date(start_date) };
    } else if (end_date) {
      where.sale_date = { [Op.lte]: new Date(end_date) };
    }

    if (store_code) where.store_code = store_code;

    if (product_ids) {
      const ids = Array.isArray(product_ids) ? product_ids : product_ids.split(',');
      where.product_id = { [Op.in]: ids.map(Number) };
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(page_size, 10);
    const { count, rows } = await SalesRecord.findAndCountAll({
      where,
      order: [['sale_date', 'DESC'], ['recorded_at', 'DESC']],
      limit: parseInt(page_size, 10),
      offset,
    });

    const formatted = rows.map(r => {
      const parts = r.sales_person.split('+');
      return {
        id: r.id,
        store_code: r.store_code,
        product_id: r.product_id,
        product_name: r.product_name,
        quantity: r.quantity,
        sale_date: r.sale_date,
        recorded_at: r.recorded_at,
        sales_person: r.sales_person,
        sales_person_name: parts[1] || r.sales_person,
      };
    });

    res.json({
      data: formatted,
      total: count,
      page: parseInt(page, 10),
      page_size: parseInt(page_size, 10),
      total_pages: Math.ceil(count / parseInt(page_size, 10)),
    });
  } catch (err) {
    console.error('明细查询失败:', err);
    res.status(500).json({ error: '查询失败' });
  }
});

// 删除单条销售记录
router.delete('/api/admin/sales-records/:id', async (req, res) => {
  try {
    const record = await SalesRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: '记录不存在' });
    await record.destroy();
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除失败:', err);
    res.status(500).json({ error: '删除失败' });
  }
});

// 导出销售明细为 CSV
router.get('/api/admin/sales-records/export', async (req, res) => {
  try {
    const { start_date, end_date, store_code, product_ids } = req.query;
    const where = {};

    if (start_date && end_date) {
      where.sale_date = { [Op.between]: [new Date(start_date), new Date(end_date)] };
    } else if (start_date) {
      where.sale_date = { [Op.gte]: new Date(start_date) };
    } else if (end_date) {
      where.sale_date = { [Op.lte]: new Date(end_date) };
    }

    if (store_code) where.store_code = store_code;

    if (product_ids) {
      const ids = Array.isArray(product_ids) ? product_ids : product_ids.split(',');
      where.product_id = { [Op.in]: ids.map(Number) };
    }

    const rows = await SalesRecord.findAll({
      where,
      order: [['sale_date', 'DESC']],
    });

    const BOM = '\uFEFF';
    let csv = BOM + '门店编码,商品名称,销售数量,销售日期,登记时间,销售人员\n';
    for (const r of rows) {
      const parts = r.sales_person.split('+');
      csv += [
        r.store_code,
        r.product_name,
        r.quantity,
        new Date(r.sale_date).toLocaleString('zh-CN'),
        new Date(r.recorded_at).toLocaleString('zh-CN'),
        parts[1] || r.sales_person,
      ].join(',') + '\n';
    }

    const filename = `销售明细_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(csv);
  } catch (err) {
    console.error('导出失败:', err);
    res.status(500).json({ error: '导出失败' });
  }
});

module.exports = router;
