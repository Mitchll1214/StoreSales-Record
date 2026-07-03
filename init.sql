-- ============================================
-- 门店商品销售统计系统 — 数据库初始化脚本
-- 使用外部 MySQL 时，请先在 MySQL 中创建数据库，然后执行此脚本建表
-- ============================================

-- 门店信息表：存储所有门店的基础信息
CREATE TABLE IF NOT EXISTS `ssr_stores` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `store_code` VARCHAR(50) NOT NULL COMMENT '门店编码（唯一值）',
  `store_name` VARCHAR(100) NOT NULL COMMENT '门店名称',
  `contact_person` VARCHAR(50) NULL COMMENT '联系人',
  `contact_phone` VARCHAR(20) NULL COMMENT '联系电话',
  `contact_person2` VARCHAR(50) NULL COMMENT '联系人2',
  `contact_phone2` VARCHAR(20) NULL COMMENT '联系电话2',
  `address` VARCHAR(255) NULL COMMENT '门店地址',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_store_code` (`store_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门店信息表 — 存储所有门店的基础信息';

-- 商品信息表：存储所有可销售的商品信息
CREATE TABLE IF NOT EXISTS `ssr_products` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `product_code` VARCHAR(50) NOT NULL COMMENT '商品条码（唯一值）',
  `product_name` VARCHAR(100) NOT NULL COMMENT '商品名称',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用（关联时只能关联启用状态的商品）',
  `person_in_charge` VARCHAR(100) NULL COMMENT '负责人（文本）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_product_code` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品信息表 — 存储所有可销售的商品信息';

-- 用户表：存储系统用户（店员/管理员）信息
CREATE TABLE IF NOT EXISTS `ssr_users` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号（登录账号）',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt哈希存储）',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `gender` VARCHAR(4) NULL COMMENT '性别：男/女',
  `role` VARCHAR(20) NOT NULL COMMENT '角色：clerk店员 / admin管理员',
  `store_code` VARCHAR(50) NOT NULL COMMENT '负责门店编码（关联stores表）',
  `bank_card` VARCHAR(50) NULL COMMENT '收款银行卡号',
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '账号状态：pending待激活 / active启用 / disabled禁用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_phone` (`phone`),
  INDEX `idx_store_code` (`store_code`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表 — 存储系统用户（店员/管理员）信息';

-- 门店在售商品关联表：多对多关联门店与商品
CREATE TABLE IF NOT EXISTS `ssr_store_products` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `store_code` VARCHAR(50) NOT NULL COMMENT '门店编码',
  `product_id` INT NOT NULL COMMENT '商品ID（关联products表）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_store_product` (`store_code`, `product_id`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门店在售商品关联表 — 多对多关联门店与商品';

-- 店员负责商品关联表：多对多关联店员与其负责的商品
CREATE TABLE IF NOT EXISTS `ssr_user_products` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` INT NOT NULL COMMENT '用户ID（关联users表）',
  `product_id` INT NOT NULL COMMENT '商品ID（关联products表）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_user_product` (`user_id`, `product_id`),
  INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店员负责商品关联表 — 多对多关联店员与其负责的商品';

-- 商品销售记录表：记录每笔商品销售明细
CREATE TABLE IF NOT EXISTS `ssr_sales_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `store_code` VARCHAR(50) NOT NULL COMMENT '销售门店编码',
  `product_id` INT NOT NULL COMMENT '销售商品ID',
  `product_name` VARCHAR(100) NOT NULL COMMENT '销售商品名称（冗余存储）',
  `quantity` INT NOT NULL COMMENT '销售数量（正整数）',
  `sale_date` DATETIME NOT NULL COMMENT '销售日期（日期+小时）',
  `recorded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间（存入数据库的服务器时间）',
  `sales_person` VARCHAR(100) NOT NULL COMMENT '销售人员（格式：手机号+人员姓名）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_store_code` (`store_code`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_sale_date` (`sale_date`),
  INDEX `idx_sales_person` (`sales_person`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品销售记录表 — 记录每笔商品销售明细';

-- ========== 默认管理员账号 & 示例门店 ==========
-- 由应用启动时通过 app.js 中的 seedDefaults() 动态创建
-- 密码使用 bcryptjs 实时哈希，确保兼容性
-- 默认账号: 13800000000 / 88888888
