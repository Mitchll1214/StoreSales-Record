// 商品销售记录表 — 记录每笔商品销售明细
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalesRecord = sequelize.define('SalesRecord', {
  // 主键ID，自增
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  // 销售门店编码
  store_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '销售门店编码',
  },
  // 销售商品ID
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '销售商品ID',
  },
  // 销售商品名称（冗余存储，方便查询展示）
  product_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '销售商品名称（冗余存储）',
  },
  // 销售数量（正整数）
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '销售数量（正整数）',
  },
  // 销售日期（精确到小时）
  sale_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '销售日期（日期+小时）',
  },
  // 记录时间（存入数据库的服务器时间）
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '记录时间（存入数据库的服务器时间）',
  },
  // 销售人员（手机号+姓名）
  sales_person: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '销售人员（格式：手机号+人员姓名）',
  },
}, {
  tableName: 'ssr_sales_records',
  comment: '商品销售记录表 — 记录每笔商品销售明细',
});

module.exports = SalesRecord;
