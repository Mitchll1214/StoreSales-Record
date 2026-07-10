// 排班表 — 按日期+门店维度，为门店分配人员
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  // 主键ID，自增
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  // 排班日期
  schedule_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '排班日期',
  },
  // 门店编码
  store_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '门店编码（关联ssr_stores表）',
  },
  // 人员ID
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '人员ID（关联ssr_users表）',
  },
}, {
  tableName: 'ssr_schedules',
  comment: '排班表 — 按日期+门店维度，为门店分配人员',
  indexes: [
    { unique: true, fields: ['schedule_date', 'store_code', 'user_id'] },
    { fields: ['schedule_date', 'store_code'] },
    { fields: ['user_id'] },
  ],
});

module.exports = Schedule;
