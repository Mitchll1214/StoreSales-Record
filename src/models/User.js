// 用户表 — 存储系统用户（店员/管理员）信息
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  // 主键ID，自增
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  // 手机号，登录账号
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '手机号（登录账号）',
  },
  // 密码（bcrypt哈希存储）
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（bcrypt哈希存储）',
  },
  // 姓名
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '姓名',
  },
  // 性别：男/女
  gender: {
    type: DataTypes.STRING(4),
    allowNull: true,
    comment: '性别：男/女',
  },
  // 角色：clerk店员 / admin管理员
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '角色：clerk店员 / admin管理员',
  },
  // 负责门店编码（关联stores表）
  store_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '负责门店编码（关联stores表）',
  },
  // 收款银行卡号（仅店员可修改）
  bank_card: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '收款银行卡号',
  },
  // 账号状态：pending待激活 / active启用 / disabled禁用
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    comment: '账号状态：pending待激活 / active启用 / disabled禁用',
  },
}, {
  tableName: 'users',
  comment: '用户表 — 存储系统用户（店员/管理员）信息',
});

module.exports = User;
