<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;

/**
 * 数据统计控制器
 */
class Stats extends BaseController
{
    /**
     * 一次性返回所有统计数据（概览 + 排行榜）
     */
    public function overview()
    {
      try {
        $period = $this->request->get('period', 'today');
        $dateCondition = $this->getDateCondition($period);
        $where = $dateCondition ? " WHERE order_date >= '{$dateCondition}'" : '';

        // 先检测 sales_orders 表是否有 cost_total / profit 列
        $salesCols = array_column(Db::query("SHOW COLUMNS FROM sales_orders"), 'Field');
        $hasCost   = in_array('cost_total', $salesCols);
        $hasProfit = in_array('profit', $salesCols);

        $costField   = $hasCost   ? 'COALESCE(SUM(cost_total), 0)' : '0';
        $profitField = $hasProfit ? 'COALESCE(SUM(profit), 0)' : '0';

        // 销售统计
        $salesSql = "SELECT COUNT(*) as order_count,
            COALESCE(SUM(total_amount), 0) as total_sales,
            {$costField} as total_cost,
            {$profitField} as total_profit,
            COALESCE(SUM(actual_amount), 0) as total_received
            FROM sales_orders{$where}";
        $salesRows = Db::query($salesSql);
        $salesData = $salesRows[0] ?? ['order_count'=>0,'total_sales'=>0,'total_cost'=>0,'total_profit'=>0,'total_received'=>0];

        // 采购统计
        $purchaseSql = "SELECT COUNT(*) as order_count,
            COALESCE(SUM(total_amount), 0) as total_amount,
            COALESCE(SUM(actual_amount), 0) as total_paid
            FROM purchase_orders{$where}";
        $purchaseRows = Db::query($purchaseSql);
        $purchaseData = $purchaseRows[0] ?? ['order_count'=>0,'total_amount'=>0,'total_paid'=>0];

        // 基础统计（不受时间筛选）
        $productCount  = Db::name('products')->count();
        $customerCount = Db::name('customers')->count();
        $supplierCount = Db::name('suppliers')->count();

        // 客户排行
        $owhere = $dateCondition ? " AND o.order_date >= '{$dateCondition}'" : '';
        $profitCol = $hasProfit ? 'COALESCE(SUM(o.profit), 0)' : '0';
        $crSql = "SELECT c.id, c.name, COUNT(o.id) as order_count,
            COALESCE(SUM(o.total_amount), 0) as total_sales,
            {$profitCol} as total_profit
            FROM sales_orders o LEFT JOIN customers c ON o.customer_id = c.id
            WHERE 1=1{$owhere}
            GROUP BY c.id, c.name ORDER BY total_sales DESC LIMIT 10";
        $customerRank = Db::query($crSql);

        // 商品排行
        $prSql = "SELECT p.id, p.name, SUM(i.quantity) as total_qty,
            COALESCE(SUM(i.quantity * i.unit_price), 0) as total_sales
            FROM sales_order_items i
            LEFT JOIN sales_orders o ON i.order_id = o.id
            LEFT JOIN products p ON i.product_id = p.id
            WHERE 1=1{$owhere}
            GROUP BY p.id, p.name ORDER BY total_sales DESC LIMIT 10";
        $productRank = Db::query($prSql);

        // 制作厂家排行
        $srSql = "SELECT s.id, s.name, COUNT(o.id) as order_count,
            COALESCE(SUM(o.total_amount), 0) as total_amount
            FROM purchase_orders o LEFT JOIN suppliers s ON o.supplier_id = s.id
            WHERE 1=1{$owhere}
            GROUP BY s.id, s.name ORDER BY total_amount DESC LIMIT 10";
        $supplierRank = Db::query($srSql);

        return json([
            'code' => 200,
            'data' => [
                'sales' => [
                    'order_count'    => (int)($salesData['order_count'] ?? 0),
                    'total_sales'    => round($salesData['total_sales'] ?? 0, 2),
                    'total_cost'     => round($salesData['total_cost'] ?? 0, 2),
                    'total_profit'   => round($salesData['total_profit'] ?? 0, 2),
                    'total_received' => round($salesData['total_received'] ?? 0, 2),
                ],
                'purchase' => [
                    'order_count'  => (int)($purchaseData['order_count'] ?? 0),
                    'total_amount' => round($purchaseData['total_amount'] ?? 0, 2),
                    'total_paid'   => round($purchaseData['total_paid'] ?? 0, 2),
                ],
                'counts' => [
                    'products'  => $productCount,
                    'customers' => $customerCount,
                    'suppliers' => $supplierCount,
                ],
                'customerRank' => $customerRank ?: [],
                'productRank'  => $productRank ?: [],
                'supplierRank' => $supplierRank ?: [],
                'period' => $period,
            ]
        ]);
      } catch (\Exception $e) {
          return json(['code' => 500, 'message' => $e->getMessage()]);
      }
    }

    /**
     * 根据周期返回日期条件
     */
    private function getDateCondition($period)
    {
        switch ($period) {
            case 'today':
                return date('Y-m-d 00:00:00');
            case 'week':
                return date('Y-m-d 00:00:00', strtotime('-7 days'));
            case 'month':
                return date('Y-m-01 00:00:00');
            case 'year':
                return date('Y-01-01 00:00:00');
            case 'all':
            default:
                return null;
        }
    }
}
