-- 为商品表添加成本价格字段
ALTER TABLE `products` ADD COLUMN `cost_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '成本价格' AFTER `name`;

-- 更新说明：
-- price 字段现在表示客户价格（销售价格）
-- cost_price 字段表示成本价格（进货价格）
