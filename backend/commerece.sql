-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               5.7.40 - MySQL Community Server (GPL)
-- Server OS:                    Win64
-- HeidiSQL Version:             12.3.0.6589
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for commece
CREATE DATABASE IF NOT EXISTS `commece` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `commece`;

-- Dumping structure for table commece.balance_records
CREATE TABLE IF NOT EXISTS `balance_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `type` varchar(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance_before` decimal(10,2) NOT NULL,
  `balance_after` decimal(10,2) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `remark` varchar(500) DEFAULT '',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4;

-- Dumping data for table commece.balance_records: ~40 rows (approximately)
REPLACE INTO `balance_records` (`id`, `customer_id`, `type`, `amount`, `balance_before`, `balance_after`, `order_id`, `remark`, `created_at`) VALUES
	(1, 1, 'increase', 10.00, 0.00, 10.00, NULL, '预付', '2026-03-28 17:22:31'),
	(2, 1, 'order_deduct', 9.00, 10.00, 1.00, 1, '订单 #1 余额抵扣(更新)', '2026-03-28 17:22:47'),
	(3, 1, 'order_deduct', 1.00, 1.00, 0.00, 2, '订单 #2 余额抵扣', '2026-03-28 17:24:07'),
	(4, 1, 'order_refund', 9.00, 0.00, 9.00, 1, '订单 #1 删除退回余额', '2026-03-28 17:24:35'),
	(5, 1, 'order_refund', 1.00, 9.00, 10.00, 2, '订单 #2 更新退回余额', '2026-03-28 17:24:47'),
	(6, 1, 'order_deduct', 10.00, 10.00, 0.00, 2, '订单 #2 余额抵扣(更新)', '2026-03-28 17:24:47'),
	(7, 1, 'increase', 10.00, 0.00, 10.00, NULL, '管理员充值', '2026-03-28 17:25:06'),
	(8, 1, 'order_refund', 10.00, 10.00, 20.00, 2, '订单 #2 更新退回余额', '2026-03-28 17:25:21'),
	(9, 1, 'order_deduct', 20.00, 20.00, 0.00, 2, '订单 #2 余额抵扣(更新)', '2026-03-28 17:25:21'),
	(10, 1, 'order_refund', 20.00, 0.00, 20.00, 2, '订单 #2 更新退回余额', '2026-03-28 17:27:14'),
	(11, 1, 'order_deduct', 20.00, 20.00, 0.00, 2, '订单 #2 余额抵扣(更新)', '2026-03-28 17:27:14'),
	(12, 1, 'order_refund', 20.00, 0.00, 20.00, 2, '订单 #2 更新退回余额', '2026-03-28 17:27:48'),
	(13, 1, 'order_deduct', 20.00, 20.00, 0.00, 2, '订单 #2 余额抵扣(更新)', '2026-03-28 17:27:48'),
	(14, 1, 'order_refund', 20.00, 0.00, 20.00, 2, '订单 #2 更新退回余额', '2026-03-28 17:28:03'),
	(15, 1, 'order_deduct', 20.00, 20.00, 0.00, 2, '订单 #2 余额抵扣(更新)', '2026-03-28 17:28:03'),
	(16, 1, 'order_refund', 20.00, 0.00, 20.00, 2, '订单 #2 更新退回余额', '2026-03-28 17:30:35'),
	(17, 1, 'order_deduct', 20.00, 20.00, 0.00, 2, '订单 #2 余额抵扣(更新)', '2026-03-28 17:30:35'),
	(18, 1, 'order_refund', 20.00, 0.00, 20.00, 2, '订单 #2 取消完成退回余额', '2026-03-28 17:37:19'),
	(19, 1, 'order_deduct', 20.00, 20.00, 0.00, 2, '订单 #2 完成结算余额抵扣', '2026-03-28 17:37:27'),
	(20, 2, 'increase', 20.00, 0.00, 20.00, NULL, '管理员充值', '2026-03-28 17:41:44'),
	(21, 2, 'order_deduct', 20.00, 20.00, 0.00, 3, '订单 #3 完成结算余额抵扣', '2026-03-28 17:41:49'),
	(22, 2, 'order_refund', 20.00, 0.00, 20.00, 3, '订单 #3 取消完成退回余额', '2026-03-28 17:41:55'),
	(23, 2, 'order_deduct', 20.00, 20.00, 0.00, 3, '订单 #3 余额抵扣(更新)', '2026-03-28 17:42:04'),
	(24, 2, 'order_refund', 20.00, 0.00, 20.00, 3, '订单 #3 取消完成退回余额', '2026-03-28 17:42:20'),
	(25, 2, 'order_deduct', 20.00, 20.00, 0.00, 3, '订单 #3 完成结算余额抵扣', '2026-03-28 17:44:20'),
	(26, 2, 'order_refund', 20.00, 0.00, 20.00, 3, '订单 #3 取消完成退回余额', '2026-03-28 17:44:21'),
	(27, 2, 'order_deduct', 20.00, 20.00, 0.00, 3, '订单 #3 余额抵扣(更新)', '2026-03-28 17:45:15'),
	(28, 2, 'increase', 100.00, 0.00, 100.00, NULL, '管理员充值', '2026-03-28 17:46:08'),
	(29, 2, 'order_deduct', 80.00, 100.00, 20.00, 3, '订单 #3 完成结算余额抵扣', '2026-03-28 17:46:11'),
	(30, 2, 'increase', 100.00, 20.00, 120.00, NULL, '管理员充值', '2026-03-28 17:47:32'),
	(31, 2, 'decrease', 120.00, 120.00, 0.00, NULL, '管理员扣减', '2026-03-28 17:47:37'),
	(32, 1, 'increase', 100.00, 0.00, 100.00, NULL, '管理员充值', '2026-03-28 17:48:02'),
	(33, 1, 'order_deduct', 50.00, 100.00, 50.00, 4, '订单 #4 余额抵扣', '2026-03-28 17:49:36'),
	(34, 1, 'order_refund', 50.00, 50.00, 100.00, 4, '订单 #4 更新退回余额', '2026-03-28 17:51:32'),
	(35, 1, 'order_deduct', 100.00, 100.00, 0.00, 4, '订单 #4 余额抵扣(更新)', '2026-03-28 17:51:32'),
	(36, 1, 'order_refund', 100.00, 0.00, 100.00, 4, '订单 #4 更新退回余额', '2026-03-28 17:52:21'),
	(37, 1, 'order_deduct', 50.00, 100.00, 50.00, 4, '订单 #4 余额抵扣(更新)', '2026-03-28 17:52:21'),
	(38, 1, 'order_refund', 50.00, 50.00, 100.00, 4, '订单 #4 更新退回余额', '2026-03-28 17:52:50'),
	(39, 1, 'order_deduct', 50.00, 100.00, 50.00, 4, '订单 #4 余额抵扣(更新)', '2026-03-28 17:52:50'),
	(40, 1, 'decrease', 50.00, 50.00, 0.00, NULL, '管理员扣减', '2026-03-28 17:54:05');

-- Dumping structure for table commece.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `parent_id` (`parent_id`) USING BTREE,
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Dumping data for table commece.categories: ~0 rows (approximately)

-- Dumping structure for table commece.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level_id` int(11) DEFAULT NULL COMMENT '客户等级ID',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_level_id` (`level_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Dumping data for table commece.customers: ~2 rows (approximately)
REPLACE INTO `customers` (`id`, `name`, `level_id`, `phone`, `address`, `level`, `created_at`, `balance`) VALUES
	(1, '开封市燃风超市（湖滨店）', 1, '', '', 'normal', '2026-03-28 08:43:03', 0.00),
	(2, '123', 1, '213', '', 'normal', '2026-03-28 09:02:47', 0.00);

-- Dumping structure for table commece.customer_levels
CREATE TABLE IF NOT EXISTS `customer_levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '等级名称',
  `description` text COMMENT '等级描述',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='客户等级表';

-- Dumping data for table commece.customer_levels: ~2 rows (approximately)
REPLACE INTO `customer_levels` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
	(1, '普通客户', '', '2026-03-28 16:42:43', '2026-03-28 16:42:43'),
	(2, 'vip', '', '2026-03-28 17:39:29', '2026-03-28 17:39:29');

-- Dumping structure for table commece.qr_codes
CREATE TABLE IF NOT EXISTS `qr_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL DEFAULT '',
  `url` varchar(500) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

-- Dumping data for table commece.qr_codes: ~1 rows (approximately)
REPLACE INTO `qr_codes` (`id`, `user_id`, `name`, `url`, `enabled`, `sort_order`, `created_at`) VALUES
	(2, 1, '收款', '/storage/images/20260328/c9bfab9fe95c962979bb9b0d20bc3c42.jpg', 1, 0, '2026-03-28 17:12:04');

-- Dumping structure for table commece.sales_orders
CREATE TABLE IF NOT EXISTS `sales_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `order_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '应收总计',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '优惠金额',
  `actual_amount` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '实收金额',
  `prepaid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `cost_total` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '成本合计',
  `profit` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '利润',
  `description` text COMMENT '订单备注',
  `image` varchar(500) DEFAULT '' COMMENT '订单图片',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

-- Dumping data for table commece.sales_orders: ~4 rows (approximately)
REPLACE INTO `sales_orders` (`id`, `customer_id`, `order_date`, `total_amount`, `discount_amount`, `actual_amount`, `prepaid_amount`, `status`, `cost_total`, `profit`, `description`, `image`, `created_at`, `updated_at`) VALUES
	(2, 1, '2026-03-28 17:24:07', 20.00, 0.00, 20.00, 20.00, 'completed', 0.00, 20.00, '', '', '2026-03-28 17:24:07', '2026-03-28 17:37:27'),
	(3, 2, '2026-03-28 17:41:21', 100.00, 0.00, 100.00, 100.00, 'completed', 0.00, 100.00, '', '', '2026-03-28 17:41:21', '2026-03-28 17:46:11'),
	(4, 1, '2026-03-28 17:49:36', 50.00, 0.00, 50.00, 50.00, 'completed', 15.00, 35.00, '', '', '2026-03-28 17:49:36', '2026-03-28 17:52:50'),
	(5, 1, '2026-03-28 17:57:26', 12.00, 0.00, 12.00, 0.00, 'pending', 2.00, 10.00, '', '', '2026-03-28 17:57:26', NULL);

-- Dumping structure for table commece.sales_order_items
CREATE TABLE IF NOT EXISTS `sales_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '' COMMENT '项目名称',
  `unit` varchar(20) NOT NULL DEFAULT '平方米' COMMENT '单位',
  `width` decimal(10,4) NOT NULL DEFAULT '0.0000',
  `height` decimal(10,4) NOT NULL DEFAULT '0.0000',
  `quantity` int(11) NOT NULL DEFAULT '1' COMMENT '数量',
  `unit_price` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '单价',
  `customer_price` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '客户价',
  `cost_details` text COMMENT '成本明细JSON',
  `cost_price` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '成本价合计',
  `materials` text COMMENT '耗材JSON',
  `content` varchar(500) NOT NULL DEFAULT '',
  `area` decimal(10,4) NOT NULL DEFAULT '0.0000' COMMENT '面积',
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '计算金额',
  `remark` text COMMENT '备注',
  `image` varchar(500) DEFAULT '' COMMENT '图样',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4;

-- Dumping data for table commece.sales_order_items: ~5 rows (approximately)
REPLACE INTO `sales_order_items` (`id`, `order_id`, `name`, `unit`, `width`, `height`, `quantity`, `unit_price`, `customer_price`, `cost_details`, `cost_price`, `materials`, `content`, `area`, `amount`, `remark`, `image`, `created_at`) VALUES
	(19, 2, '', '平方米', 1.0000, 1.0000, 2, 10.00, 0.00, '[]', 0.00, '[]', '', 1.0000, 20.00, '', '', '2026-03-28 17:30:35'),
	(20, 2, '', '平方米', 0.0000, 0.0000, 1, 0.00, 0.00, '[]', 0.00, '[]', '', 0.0000, 0.00, '', '', '2026-03-28 17:30:35'),
	(23, 3, 'ceshi', '个', 0.0000, 0.0000, 20, 5.00, 0.00, '[]', 0.00, '[]', '', 0.0000, 100.00, '', '', '2026-03-28 17:45:15'),
	(27, 4, '', '个', 12.0000, 12.0000, 1, 50.00, 0.00, '[{"name":"彩白彩","amount":"15"}]', 15.00, '[]', '', 144.0000, 50.00, '', '', '2026-03-28 17:52:50'),
	(28, 5, 'KT板', '块', 0.0000, 0.0000, 1, 12.00, 0.00, '[{"name":"KT板","amount":"2"}]', 2.00, '[]', '', 0.0000, 12.00, '', '', '2026-03-28 17:57:26');

-- Dumping structure for table commece.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL DEFAULT '' COMMENT '鐢ㄦ埛鍚',
  `password` varchar(255) NOT NULL DEFAULT '' COMMENT '瀵嗙爜',
  `nickname` varchar(50) NOT NULL DEFAULT '' COMMENT '鏄电О',
  `role` enum('admin','user') NOT NULL DEFAULT 'user' COMMENT '瑙掕壊',
  `permissions` text COMMENT '鏉冮檺JSON',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '鐘舵? 1鍚?敤 0绂佺敤',
  `token` varchar(64) NOT NULL DEFAULT '' COMMENT '鐧诲綍token',
  `last_login` datetime DEFAULT NULL COMMENT '鏈?悗鐧诲綍鏃堕棿',
  `created_at` datetime DEFAULT NULL COMMENT '鍒涘缓鏃堕棿',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `token` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COMMENT='鐢ㄦ埛琛';

-- Dumping data for table commece.users: ~2 rows (approximately)
REPLACE INTO `users` (`id`, `username`, `password`, `nickname`, `role`, `permissions`, `status`, `token`, `last_login`, `created_at`) VALUES
	(1, 'admin', '$2y$10$jyop9IpniwxDgzb8YcBZsO1zGZVN4dVGpimZTepiA7lVlBTbvLEYa', 'admin', 'admin', '{"products":true,"customers":true,"suppliers":true,"sales":true,"purchase":true,"stats":true}', 1, '48acdacb2f88859dd17c9822680decfdc7b6f73780b8f888964493734317d202', '2026-03-28 17:58:59', '2026-03-17 15:27:26'),
	(2, 'ceshi', '$2y$10$hAtt1caoDW7RGzEZx0H5kO/OKpwiCUVC8Vn5naIhPmivu.6HdPMIu', 'ceshi', 'user', '{"products":true,"customers":true,"suppliers":true,"sales":true,"purchase":true,"stats":true}', 1, '', '2026-03-17 15:28:26', '2026-03-17 15:27:55');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
