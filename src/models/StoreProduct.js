// 门店在售商品关联表 — 多对多关联门店与商品
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoreProduct = sequelize.define('StoreProduct', {
  // 主键ID，自增
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  // 门店编码
  store_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '门店编码',
  },
  // 商品ID
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID（关联ssr_products表）',
  },
}, {
  tableName: 'ssr_store_products',
  comment: '门店在售商品关联表 — 多对多关联门店与商品',
  indexes: [
    { unique: true, fields: ['store_code', 'product_id'] },
  ],
});

module.exports = StoreProduct;
