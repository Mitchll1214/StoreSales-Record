// 用户收藏表 — 记录用户收藏的快捷入口
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserFavorite = sequelize.define('UserFavorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID',
  },
  page_key: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '页面标识（如 users, sales-entry 等）',
  },
}, {
  tableName: 'ssr_user_favorites',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['user_id', 'page_key'] },
  ],
});

module.exports = UserFavorite;
