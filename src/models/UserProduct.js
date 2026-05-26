// 店员负责商品关联表 — 多对多关联店员与商品
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProduct = sequelize.define('UserProduct', {
  // 主键ID，自增
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  // 用户ID
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID（关联users表）',
  },
  // 商品ID
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID（关联products表）',
  },
}, {
  tableName: 'user_products',
  comment: '店员负责商品关联表 — 多对多关联店员与其负责的商品',
  indexes: [
    { unique: true, fields: ['user_id', 'product_id'] },
  ],
});

module.exports = UserProduct;
