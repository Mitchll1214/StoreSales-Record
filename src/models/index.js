// 模型关联定义 & 数据库同步入口
const sequelize = require('../config/database');
const Store = require('./Store');
const Product = require('./Product');
const User = require('./User');
const StoreProduct = require('./StoreProduct');
const UserProduct = require('./UserProduct');
const SalesRecord = require('./SalesRecord');
const OperationLog = require('./OperationLog');

// ========== 模型关联 ==========

// Store ↔ Product（门店在售商品，多对多通过 StoreProduct）
Store.belongsToMany(Product, {
  through: StoreProduct,
  foreignKey: 'store_code',
  otherKey: 'product_id',
  as: 'products',
});
Product.belongsToMany(Store, {
  through: StoreProduct,
  foreignKey: 'product_id',
  otherKey: 'store_code',
  as: 'stores',
});

// User ↔ Product（店员负责商品，多对多通过 UserProduct）
User.belongsToMany(Product, {
  through: UserProduct,
  foreignKey: 'user_id',
  otherKey: 'product_id',
  as: 'responsibleProducts',
});
Product.belongsToMany(User, {
  through: UserProduct,
  foreignKey: 'product_id',
  otherKey: 'user_id',
  as: 'responsibleUsers',
});

// User 直接外键关联 Store（通过 store_code）
Store.hasMany(User, { foreignKey: 'store_code', sourceKey: 'store_code', as: 'users' });
User.belongsTo(Store, { foreignKey: 'store_code', targetKey: 'store_code', as: 'store' });

// SalesRecord 关联 Product
Product.hasMany(SalesRecord, { foreignKey: 'product_id', as: 'salesRecords' });
SalesRecord.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// SalesRecord 关联 Store
Store.hasMany(SalesRecord, { foreignKey: 'store_code', sourceKey: 'store_code', as: 'salesRecords' });
SalesRecord.belongsTo(Store, { foreignKey: 'store_code', targetKey: 'store_code', as: 'store' });

// SalesRecord 关联 User（通过 sales_person 中的手机号）
User.hasMany(SalesRecord, { foreignKey: 'store_code', sourceKey: 'store_code', constraints: false });

// 手动迁移：为已有表添加缺失的列
async function migrateSchema() {
  const dialect = sequelize.getDialect();
  let colNames = [];

  if (dialect === 'sqlite') {
    const [userCols] = await sequelize.query("PRAGMA table_info('users')");
    colNames = userCols.map(c => c.name);
  } else {
    // MySQL: 从 information_schema 查列信息
    const dbName = sequelize.config.database;
    const [userCols] = await sequelize.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${dbName}' AND TABLE_NAME='users'`
    );
    colNames = userCols.map(c => c.COLUMN_NAME);
  }

  if (!colNames.includes('payee_name')) {
    await sequelize.query(`ALTER TABLE users ADD COLUMN payee_name VARCHAR(50)`);
    console.log('[DB] 已添加 users.payee_name 列');
  }
  if (!colNames.includes('bank_name')) {
    await sequelize.query(`ALTER TABLE users ADD COLUMN bank_name VARCHAR(50)`);
    console.log('[DB] 已添加 users.bank_name 列');
  }
}

// 同步数据库（带重试，等待 MySQL 完全就绪）
async function syncDatabase(maxRetries = 30, retryDelayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('[DB] 数据库连接成功');

      // 先建新表（operation_logs 等）
      await sequelize.sync({ alter: false });

      // 再手动迁移已有表的新列
      await migrateSchema();

      console.log('[DB] 数据表同步完成');
      return;
    } catch (error) {
      console.error(`[DB] 连接失败 (第${attempt}/${maxRetries}次): ${error.message}`);
      if (attempt >= maxRetries) {
        console.error('[DB] 已达最大重试次数，退出');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
}

module.exports = {
  sequelize,
  Store,
  Product,
  User,
  StoreProduct,
  UserProduct,
  SalesRecord,
  OperationLog,
  syncDatabase,
};
