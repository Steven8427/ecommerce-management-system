-- 为销售单表添加成本总计和利润字段
ALTER TABLE `sales_orders` ADD COLUMN `cost_total` DECIMAL(10,2) DEFAULT 0.00 COMMENT '成本总计' AFTER `subtotal`;
ALTER TABLE `sales_orders` ADD COLUMN `profit` DECIMAL(10,2) DEFAULT 0.00 COMMENT '利润' AFTER `cost_total`;

-- 说明：
-- cost_total: 订单中所有商品的成本总计
-- profit: 利润 = subtotal - cost_total
