// 门店信息表 — 存储所有门店的基础信息
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Store = sequelize.define('Store', {
  // 主键ID，自增
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  // 门店编码，唯一标识一家门店
  store_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '门店编码（唯一值）',
  },
  // 门店名称
  store_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '门店名称',
  },
  // 主要联系人姓名
  contact_person: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '联系人',
  },
  // 主要联系人电话
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '联系电话',
  },
  // 备用联系人姓名
  contact_person2: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '联系人2',
  },
  // 备用联系人电话
  contact_phone2: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '联系电话2',
  },
  // 门店地址
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '门店地址',
  },
  // 门店状态：1启用 0禁用
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用',
  },
}, {
  tableName: 'stores',
  comment: '门店信息表 — 存储所有门店的基础信息',
});

module.exports = Store;
