// 库存上报表 — 按门店+商品+日期记录最新库存数
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryRecord = sequelize.define('InventoryRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  store_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '门店编码',
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID',
  },
  record_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '记录日期',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '库存数量',
  },
}, {
  tableName: 'ssr_inventory_records',
  comment: '库存上报表 — 门店+商品+日期为唯一维度',
  indexes: [
    { unique: true, fields: ['store_code', 'product_id', 'record_date'] },
    { fields: ['store_code', 'record_date'] },
    { fields: ['record_date'] },
  ],
});

module.exports = InventoryRecord;
