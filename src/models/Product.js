// 商品信息表 — 存储所有可销售的商品信息
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  // 主键ID，自增
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  // 商品条码，唯一标识一种商品
  product_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '商品条码（唯一值）',
  },
  // 商品名称
  product_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商品名称',
  },
  // 商品状态：1启用 0禁用
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用（关联时只能关联启用状态的商品）',
  },
  // 负责人（文本描述）
  person_in_charge: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '负责人（文本）',
  },
}, {
  tableName: 'ssr_products',
  comment: '商品信息表 — 存储所有可销售的商品信息',
});

module.exports = Product;
