-- ============================================================
-- 压力测试 & 边缘测试数据 (v2 - 含余额系统 + 商品日期)
-- 使用前请确认数据库为 commece，且已有至少一个用户
-- 新增字段：customers.balance, sales_order_items.item_date, balance_records
-- ============================================================

SET NAMES utf8mb4;

-- ---------- 1. 客户等级 ----------
INSERT INTO customer_levels (name, description, created_at, updated_at) VALUES
('VIP钻石', '年消费10万以上', NOW(), NOW()),
('金牌客户', '年消费5-10万', NOW(), NOW()),
('银牌客户', '年消费1-5万', NOW(), NOW()),
('普通散客', '零散客户', NOW(), NOW());

-- ---------- 2. 耗材分类 ----------
INSERT INTO categories (name, parent_id, created_at) VALUES
('喷绘布', NULL, NOW()),
('写真纸', NULL, NOW()),
('灯箱片', NULL, NOW()),
('车贴', NULL, NOW()),
('KT板', NULL, NOW()),
('亚克力', NULL, NOW()),
('不锈钢', NULL, NOW()),
('PVC板', NULL, NOW());

-- ---------- 3. 客户（50个，含余额 + 边缘数据） ----------
INSERT INTO customers (name, phone, address, level_id, balance, created_at) VALUES
-- 正常客户（有各种余额）
('张三广告公司', '13800001001', '上海市浦东新区张江高科技园区100号', 1, 5000.00, '2025-01-15 09:00:00'),
('李四装饰工程', '13800001002', '北京市朝阳区建国路88号', 2, 1200.50, '2025-01-20 10:30:00'),
('王五传媒有限公司', '13800001003', '广州市天河区体育西路200号', 1, 30000.00, '2025-02-01 08:00:00'),
('赵六标识制作', '13800001004', '深圳市南山区科技园南路50号', 3, 0.00, '2025-02-10 14:00:00'),
('钱七文化传播', '13800001005', '杭州市西湖区文三路999号', 2, 500.00, '2025-03-01 09:00:00'),
('孙八印刷厂', '13800001006', '成都市武侯区人民南路四段1号', 3, 88.88, '2025-03-15 11:00:00'),
('周九地产集团', '13800001007', '重庆市渝中区解放碑步行街1号', 1, 100000.00, '2025-04-01 08:30:00'),
('吴十科技公司', '13800001008', '南京市鼓楼区中山北路100号', 4, 0.01, '2025-04-10 10:00:00'),
('郑十一建材', '13800001009', '武汉市江汉区解放大道688号', 3, 2500.00, '2025-05-01 09:30:00'),
('冯十二商贸', '13800001010', '西安市雁塔区高新路10号', 4, 0.00, '2025-05-15 13:00:00'),
('陈美琳设计工作室', '13800001011', '长沙市芙蓉区五一大道300号', 2, 750.00, '2025-06-01 08:00:00'),
('黄大明广告', '13800001012', '福州市鼓楼区八一七路50号', 3, 3000.00, '2025-06-10 09:00:00'),
('林小芳文创', '13800001013', '厦门市思明区中山路100号', 4, 150.00, '2025-06-20 10:00:00'),
('刘伟强工程', '13800001014', '合肥市蜀山区长江西路200号', 2, 8000.00, '2025-07-01 08:00:00'),
('杨秀英装饰', '13800001015', '济南市历下区经十路88号', 3, 0.00, '2025-07-10 09:30:00'),
('朱国强建筑', '13800001016', '青岛市市南区香港中路100号', 1, 15000.00, '2025-07-20 11:00:00'),
('何丽娟策划', '13800001017', '大连市中山区人民路50号', 4, 200.00, '2025-08-01 08:00:00'),
('吕志明贸易', '13800001018', '沈阳市和平区中华路200号', 3, 0.00, '2025-08-10 09:00:00'),
('马晓峰传媒', '13800001019', '哈尔滨市南岗区中山路300号', 2, 6000.00, '2025-08-20 10:30:00'),
('高建华实业', '13800001020', '长春市朝阳区人民大街1号', 1, 25000.00, '2025-09-01 08:00:00'),
-- 批量客户 21-40（混合余额）
('测试客户A21', '13900002001', '测试地址A21', 4, 100.00, '2025-09-05 08:00:00'),
('测试客户A22', '13900002002', '测试地址A22', 3, 0.00, '2025-09-06 08:00:00'),
('测试客户A23', '13900002003', '测试地址A23', 2, 999.99, '2025-09-07 08:00:00'),
('测试客户A24', '13900002004', '测试地址A24', 1, 50000.00, '2025-09-08 08:00:00'),
('测试客户A25', '13900002005', '测试地址A25', 4, 0.00, '2025-09-09 08:00:00'),
('测试客户A26', '13900002006', '测试地址A26', 3, 300.00, '2025-09-10 08:00:00'),
('测试客户A27', '13900002007', '测试地址A27', 2, 0.00, '2025-09-11 08:00:00'),
('测试客户A28', '13900002008', '测试地址A28', 1, 7777.77, '2025-09-12 08:00:00'),
('测试客户A29', '13900002009', '测试地址A29', 4, 0.00, '2025-09-13 08:00:00'),
('测试客户A30', '13900002010', '测试地址A30', 3, 1500.00, '2025-09-14 08:00:00'),
('测试客户A31', '13900002011', '测试地址A31', 2, 0.00, '2025-09-15 08:00:00'),
('测试客户A32', '13900002012', '测试地址A32', 1, 20000.00, '2025-09-16 08:00:00'),
('测试客户A33', '13900002013', '测试地址A33', 4, 0.50, '2025-09-17 08:00:00'),
('测试客户A34', '13900002014', '测试地址A34', 3, 0.00, '2025-09-18 08:00:00'),
('测试客户A35', '13900002015', '测试地址A35', 2, 4500.00, '2025-09-19 08:00:00'),
('测试客户A36', '13900002016', '测试地址A36', 1, 0.00, '2025-09-20 08:00:00'),
('测试客户A37', '13900002017', '测试地址A37', 4, 60.00, '2025-09-21 08:00:00'),
('测试客户A38', '13900002018', '测试地址A38', 3, 0.00, '2025-09-22 08:00:00'),
('测试客户A39', '13900002019', '测试地址A39', 2, 12000.00, '2025-09-23 08:00:00'),
('测试客户A40', '13900002020', '测试地址A40', 1, 0.00, '2025-09-24 08:00:00'),
-- 边缘测试客户
('超长名称的客户——这是一个非常非常非常长的客户名称用来测试显示是否正常截断', '13800009001', '这是一个超级超级超级长的地址用来测试数据库和前端展示是否能正常处理非常长的文本内容，包括是否会溢出或被截断', 1, 99999.99, '2025-10-01 00:00:00'),
('空信息客户', '', '', NULL, 0.00, '2025-10-02 00:00:00'),
('特殊字符<script>alert(1)</script>', '13800009003', '地址含"引号"和\'单引号\'', 2, 100.00, '2025-10-03 00:00:00'),
('Emoji客户🎉🎊', '13800009004', '地址🏠📍上海市', 3, 0.00, '2025-10-04 00:00:00'),
('   前后有空格   ', '13800009005', '   带空格地址   ', 4, 0.00, '2025-10-05 00:00:00'),
('数字客户123456', '00000000000', '0号地址', 1, 0.01, '2025-10-06 00:00:00'),
('A', '1', 'B', 2, 0.00, '2025-10-07 00:00:00'),
('零消费老客户', '13800009008', '从不下单的客户', 3, 10000.00, '2026-01-01 00:00:00'),
('大单客户-专测高金额', '13800009009', '测试大金额订单', 1, 50000.00, '2026-01-15 00:00:00'),
('频繁下单客户', '13800009010', '测试大量订单', 2, 3000.00, '2026-02-01 00:00:00');

-- ---------- 4. 获取新插入客户的起始ID ----------
SET @cust_start = (SELECT MIN(id) FROM customers WHERE name = '张三广告公司');

-- ---------- 5. 余额记录（为有余额的客户生成充值记录） ----------
INSERT INTO balance_records (customer_id, type, amount, balance_before, balance_after, order_id, remark, created_at)
SELECT id, 'increase', balance, 0, balance, NULL, '初始充值', created_at
FROM customers WHERE balance > 0 AND id >= @cust_start;

-- 为部分客户生成多次充值/扣减记录
INSERT INTO balance_records (customer_id, type, amount, balance_before, balance_after, order_id, remark, created_at) VALUES
(@cust_start, 'increase', 2000.00, 0.00, 2000.00, NULL, '首次充值', '2025-01-16 10:00:00'),
(@cust_start, 'increase', 3000.00, 2000.00, 5000.00, NULL, '二次充值', '2025-02-01 14:00:00'),
(@cust_start, 'decrease', 500.00, 5500.00, 5000.00, NULL, '退款调整', '2025-03-10 09:00:00'),
(@cust_start + 1, 'increase', 500.00, 0.00, 500.00, NULL, '充值', '2025-02-01 10:00:00'),
(@cust_start + 1, 'increase', 700.50, 500.00, 1200.50, NULL, '追加充值', '2025-03-15 11:00:00'),
(@cust_start + 2, 'set', 30000.00, 0.00, 30000.00, NULL, '初始设定余额', '2025-02-01 08:00:00'),
(@cust_start + 6, 'increase', 100000.00, 0.00, 100000.00, NULL, '大额充值-年度合同', '2025-04-01 09:00:00'),
(@cust_start + 13, 'increase', 5000.00, 0.00, 5000.00, NULL, '充值', '2025-07-02 08:00:00'),
(@cust_start + 13, 'increase', 3000.00, 5000.00, 8000.00, NULL, '追加充值', '2025-08-01 08:00:00'),
(@cust_start + 19, 'increase', 10000.00, 0.00, 10000.00, NULL, '充值', '2025-09-02 08:00:00'),
(@cust_start + 19, 'increase', 15000.00, 10000.00, 25000.00, NULL, '追加充值', '2025-10-01 08:00:00');

-- ---------- 6. 销售订单（200单，含各种边缘场景 + item_date） ----------
DELIMITER //
CREATE PROCEDURE generate_test_orders()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE cust_id INT;
    DECLARE order_total DECIMAL(10,2);
    DECLARE order_cost DECIMAL(10,2);
    DECLARE order_discount DECIMAL(10,2);
    DECLARE order_actual DECIMAL(10,2);
    DECLARE order_prepaid DECIMAL(10,2);
    DECLARE order_profit DECIMAL(10,2);
    DECLARE order_status VARCHAR(20);
    DECLARE order_date DATETIME;
    DECLARE order_desc VARCHAR(500);
    DECLARE item_count INT;
    DECLARE j INT;
    DECLARE item_name VARCHAR(100);
    DECLARE item_width DECIMAL(10,2);
    DECLARE item_height DECIMAL(10,2);
    DECLARE item_qty INT;
    DECLARE item_price DECIMAL(10,2);
    DECLARE item_cost DECIMAL(10,2);
    DECLARE item_area DECIMAL(10,2);
    DECLARE item_amount DECIMAL(10,2);
    DECLARE item_unit VARCHAR(20);
    DECLARE item_date_val DATETIME;
    DECLARE new_order_id INT;

    -- 商品名称列表
    DECLARE names_pool VARCHAR(2000) DEFAULT '门头招牌,LED发光字,喷绘广告,写真海报,展架画面,灯箱广告,车身贴,横幅条幅,易拉宝,X展架,亚克力字,不锈钢字,铝塑板门头,吸塑灯箱,户外大牌,室内写真,名片印刷,宣传单页,折页手册,标识导视牌,楼顶大字,围挡广告,地贴,橱窗贴,玻璃贴膜,背景墙,形象墙,文化墙设计,党建文化墙,企业LOGO墙';

    WHILE i < 200 DO
        -- 随机客户ID
        SET cust_id = @cust_start + FLOOR(RAND() * 50);

        -- 随机日期：2025-01 到 2026-03
        SET order_date = DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 450) DAY);
        SET order_date = DATE_ADD(order_date, INTERVAL FLOOR(RAND() * 86400) SECOND);

        -- 随机项目数 1-8
        SET item_count = 1 + FLOOR(RAND() * 8);

        SET order_total = 0;
        SET order_cost = 0;

        -- 边缘场景分配
        IF i < 5 THEN
            -- 大金额订单
            SET order_total = 50000 + RAND() * 50000;
            SET order_cost = order_total * (0.3 + RAND() * 0.3);
            SET item_count = 5 + FLOOR(RAND() * 5);
        ELSEIF i >= 5 AND i < 10 THEN
            -- 微小金额订单
            SET order_total = 0.01 + RAND() * 5;
            SET order_cost = order_total * 0.5;
            SET item_count = 1;
        ELSEIF i >= 10 AND i < 15 THEN
            -- 零利润订单（成本=总额）
            SET order_total = 100 + RAND() * 500;
            SET order_cost = order_total;
            SET item_count = 2;
        ELSEIF i >= 15 AND i < 20 THEN
            -- 亏损订单（成本>总额）
            SET order_total = 100 + RAND() * 300;
            SET order_cost = order_total * 1.3;
            SET item_count = 3;
        ELSEIF i >= 20 AND i < 30 THEN
            -- 全额预付已完成
            SET order_total = 200 + RAND() * 2000;
            SET order_cost = order_total * 0.4;
            SET item_count = 2 + FLOOR(RAND() * 3);
        ELSEIF i >= 30 AND i < 50 THEN
            -- 部分预付待支付
            SET order_total = 500 + RAND() * 5000;
            SET order_cost = order_total * (0.3 + RAND() * 0.3);
            SET item_count = 2 + FLOOR(RAND() * 4);
        ELSE
            -- 正常随机订单
            SET order_total = 100 + RAND() * 10000;
            SET order_cost = order_total * (0.2 + RAND() * 0.5);
            SET item_count = 1 + FLOOR(RAND() * 6);
        END IF;

        -- 折扣
        IF RAND() < 0.3 THEN
            SET order_discount = ROUND(order_total * (RAND() * 0.15), 2);
        ELSE
            SET order_discount = 0;
        END IF;

        SET order_actual = ROUND(order_total - order_discount, 2);
        SET order_cost = ROUND(order_cost, 2);
        SET order_profit = ROUND(order_actual - order_cost, 2);
        SET order_total = ROUND(order_total, 2);

        -- 预付和状态
        IF i >= 20 AND i < 30 THEN
            SET order_prepaid = order_actual;
            SET order_status = 'completed';
        ELSEIF i >= 30 AND i < 50 THEN
            SET order_prepaid = ROUND(order_actual * (0.1 + RAND() * 0.5), 2);
            SET order_status = 'pending';
        ELSEIF RAND() < 0.6 THEN
            SET order_prepaid = order_actual;
            SET order_status = 'completed';
        ELSEIF RAND() < 0.5 THEN
            SET order_prepaid = ROUND(order_actual * RAND() * 0.8, 2);
            SET order_status = 'pending';
        ELSE
            SET order_prepaid = 0;
            SET order_status = 'pending';
        END IF;

        SET order_desc = ELT(1 + FLOOR(RAND() * 8),
            '客户要求加急处理', '常规订单', '展会用，下周要',
            '老客户回单', '新店开业物料', '活动促销物料',
            '年度合同订单', '样品试制'
        );

        -- 插入订单
        INSERT INTO sales_orders (customer_id, order_date, total_amount, discount_amount, actual_amount,
            cost_total, profit, prepaid_amount, status, description, image, created_at, updated_at)
        VALUES (cust_id, order_date, order_total, order_discount, order_actual,
            order_cost, order_profit, order_prepaid, order_status, order_desc, '', order_date,
            IF(RAND() < 0.5, DATE_ADD(order_date, INTERVAL FLOOR(RAND()*7) DAY), order_date));

        SET new_order_id = LAST_INSERT_ID();

        -- 插入订单项目（含 item_date）
        SET j = 0;
        WHILE j < item_count DO
            SET item_name = SUBSTRING_INDEX(SUBSTRING_INDEX(names_pool, ',', 1 + FLOOR(RAND() * 30)), ',', -1);

            SET item_unit = ELT(1 + FLOOR(RAND() * 4), '平方米', '米', '块', '个');
            SET item_width = ROUND(0.5 + RAND() * 10, 2);
            SET item_height = IF(item_unit = '米', 0, ROUND(0.3 + RAND() * 5, 2));
            SET item_qty = 1 + FLOOR(RAND() * 20);

            IF item_unit = '平方米' THEN
                SET item_area = ROUND(item_width * item_height * item_qty, 2);
            ELSEIF item_unit = '米' THEN
                SET item_area = ROUND(item_width * item_qty, 2);
            ELSE
                SET item_area = item_qty;
            END IF;

            SET item_price = ROUND(order_total / item_count / IF(item_area > 0, item_area, 1) * (0.8 + RAND() * 0.4), 2);
            SET item_cost = ROUND(item_price * (0.3 + RAND() * 0.4), 2);
            SET item_amount = ROUND(item_area * item_price, 2);

            -- 商品日期：订单日期前后随机几天，部分为NULL测试边缘
            IF RAND() < 0.1 THEN
                SET item_date_val = NULL;
            ELSE
                SET item_date_val = DATE_ADD(order_date, INTERVAL FLOOR(RAND() * 7 - 2) DAY);
            END IF;

            INSERT INTO sales_order_items (order_id, item_date, name, unit, width, height, quantity,
                unit_price, customer_price, cost_price, area, amount,
                cost_details, materials, content, remark, image, created_at)
            VALUES (new_order_id, item_date_val, item_name, item_unit, item_width, item_height, item_qty,
                item_price, item_price, item_cost, item_area, item_amount,
                '[]', '[]',
                ELT(1 + FLOOR(RAND() * 5), '红底白字', '蓝底金字', '白底黑字', '渐变色彩印', '全彩喷绘'),
                IF(RAND() < 0.3, ELT(1 + FLOOR(RAND() * 3), '需要覆膜', '安装费另算', '含设计费'), ''),
                '', order_date);

            SET j = j + 1;
        END WHILE;

        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- 执行生成
CALL generate_test_orders();

-- 清理
DROP PROCEDURE IF EXISTS generate_test_orders;

-- ---------- 7. 为有预付的订单生成余额扣除记录 ----------
INSERT INTO balance_records (customer_id, type, amount, balance_before, balance_after, order_id, remark, created_at)
SELECT o.customer_id, 'order_deduct', o.prepaid_amount,
       c.balance + o.prepaid_amount, c.balance,
       o.id, CONCAT('订单 #', o.id, ' 余额抵扣（测试数据）'), o.order_date
FROM sales_orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.prepaid_amount > 0 AND o.id >= (SELECT MIN(id) FROM sales_orders WHERE customer_id >= @cust_start)
ORDER BY RAND()
LIMIT 50;

-- ---------- 8. 验证数据 ----------
SELECT '客户等级' AS `表`, COUNT(*) AS `数量` FROM customer_levels
UNION ALL
SELECT '耗材分类', COUNT(*) FROM categories
UNION ALL
SELECT '客户', COUNT(*) FROM customers
UNION ALL
SELECT '销售订单', COUNT(*) FROM sales_orders
UNION ALL
SELECT '订单项目', COUNT(*) FROM sales_order_items
UNION ALL
SELECT '余额记录', COUNT(*) FROM balance_records;

-- 边缘数据统计
SELECT '--- 边缘场景统计 ---' AS '';
SELECT '大金额订单(>5万)' AS `场景`, COUNT(*) AS `数量` FROM sales_orders WHERE actual_amount > 50000
UNION ALL
SELECT '微小订单(<5元)', COUNT(*) FROM sales_orders WHERE actual_amount < 5
UNION ALL
SELECT '亏损订单(利润<0)', COUNT(*) FROM sales_orders WHERE profit < 0
UNION ALL
SELECT '零利润订单', COUNT(*) FROM sales_orders WHERE profit = 0
UNION ALL
SELECT '全额预付已完成', COUNT(*) FROM sales_orders WHERE prepaid_amount >= actual_amount AND status = 'completed'
UNION ALL
SELECT '待支付(有欠款)', COUNT(*) FROM sales_orders WHERE prepaid_amount < actual_amount AND status = 'pending'
UNION ALL
SELECT '零预付订单', COUNT(*) FROM sales_orders WHERE prepaid_amount = 0;

SELECT '--- 余额统计 ---' AS '';
SELECT '有余额客户' AS `场景`, COUNT(*) AS `数量` FROM customers WHERE balance > 0
UNION ALL
SELECT '零余额客户', COUNT(*) FROM customers WHERE balance = 0
UNION ALL
SELECT '高余额(>1万)', COUNT(*) FROM customers WHERE balance > 10000
UNION ALL
SELECT '余额记录总数', COUNT(*) FROM balance_records;

SELECT '--- 商品日期统计 ---' AS '';
SELECT '有日期项目' AS `场景`, COUNT(*) AS `数量` FROM sales_order_items WHERE item_date IS NOT NULL
UNION ALL
SELECT '无日期项目', COUNT(*) FROM sales_order_items WHERE item_date IS NULL
UNION ALL
SELECT '米单位项目', COUNT(*) FROM sales_order_items WHERE unit = '米'
UNION ALL
SELECT '平方米单位', COUNT(*) FROM sales_order_items WHERE unit = '平方米'
UNION ALL
SELECT '块单位项目', COUNT(*) FROM sales_order_items WHERE unit = '块'
UNION ALL
SELECT '个单位项目', COUNT(*) FROM sales_order_items WHERE unit = '个';
