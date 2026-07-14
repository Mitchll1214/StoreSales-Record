// Sequelize 数据库连接配置 — 默认 SQLite，可切换 MySQL
// 判断逻辑：环境变量中设置了 DB_HOST 则使用 MySQL，否则使用本地 SQLite
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const { Sequelize } = require('sequelize');

const DB_DIALECT = process.env.DB_DIALECT || (process.env.DB_HOST ? 'mysql' : 'sqlite');

const commonDefine = {
  timestamps: true,
  underscored: true, // 字段名使用下划线风格
};

let sequelize;

if (DB_DIALECT === 'mysql') {
  // ===== MySQL 模式（需配置 DB_HOST / DB_NAME / DB_USER / DB_PASSWORD）=====
  sequelize = new Sequelize(
    process.env.DB_NAME || 'store_sales',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || 'root123',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      dialect: 'mysql',
      logging: false,
      timezone: '+08:00',
      dialectOptions: { timezone: '+08:00' },
      define: {
        ...commonDefine,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
  console.log('[DB] 使用 MySQL 数据库');
} else {
  // ===== SQLite 模式（默认，零配置）=====
  const dbDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'store_sales.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    timezone: '+08:00',
    define: commonDefine,
  });
  console.log(`[DB] 使用 SQLite 数据库: ${dbPath}`);
}

module.exports = sequelize;
