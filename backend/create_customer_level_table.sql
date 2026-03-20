-- 创建客户等级表
CREATE TABLE IF NOT EXISTS `customer_levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '等级名称',
  `description` text COMMENT '等级描述',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户等级表';

-- 为客户表添加等级字段
ALTER TABLE `customers` ADD COLUMN `level_id` int(11) DEFAULT NULL COMMENT '客户等级ID' AFTER `name`;
ALTER TABLE `customers` ADD INDEX `idx_level_id` (`level_id`);

-- 插入默认等级
INSERT INTO `customer_levels` (`name`, `description`, `created_at`, `updated_at`) VALUES
('普通客户', '默认等级', NOW(), NOW()),
('VIP客户', '重要客户', NOW(), NOW()),
('金牌客户', '优质客户', NOW(), NOW()),
('钻石客户', '顶级客户', NOW(), NOW());
