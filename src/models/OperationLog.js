// 操作日志表 — 记录用户的关键操作
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OperationLog = sequelize.define('OperationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  user_phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '操作人手机号',
  },
  user_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作人姓名',
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '操作内容',
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作时IP地址',
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '操作时间',
  },
}, {
  tableName: 'ssr_operation_logs',
  comment: '操作日志表 — 记录用户的关键操作',
  timestamps: false,
});

module.exports = OperationLog;
