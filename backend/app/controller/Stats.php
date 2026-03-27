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
        // 只允许白名单值，防止SQL注入
        if (!in_array($period, ['today', 'week', 'month', 'year', 'all'])) {
            $period = 'all';
        }
        $dateCondition = $this->getDateCondition($period);

        // 先检测 sales_orders 表是否有 cost_total / profit 列
        $salesCols = array_column(Db::query("SHOW COLUMNS FROM sales_orders"), 'Field');
        $hasCost   = in_array('cost_total', $salesCols);
        $hasProfit = in_array('profit', $salesCols);

        $costField   = $hasCost   ? 'COALESCE(SUM(cost_total), 0)' : '0';
        $profitField = $hasProfit ? 'COALESCE(SUM(profit), 0)' : '0';

        // 销售统计（参数化查询）
        $salesQuery = Db::name('sales_orders');
        if ($dateCondition) $salesQuery->where('order_date', '>=', $dateCondition);
        $salesData = $salesQuery->field("COUNT(*) as order_count, COALESCE(SUM(total_amount),0) as total_sales, {$costField} as total_cost, {$profitField} as total_profit, COALESCE(SUM(actual_amount),0) as total_received")->find();
        if (!$salesData) $salesData = ['order_count'=>0,'total_sales'=>0,'total_cost'=>0,'total_profit'=>0,'total_received'=>0];

        // 采购统计
        $purchaseQuery = Db::name('purchase_orders');
        if ($dateCondition) $purchaseQuery->where('order_date', '>=', $dateCondition);
        $purchaseData = $purchaseQuery->field("COUNT(*) as order_count, COALESCE(SUM(total_amount),0) as total_amount, COALESCE(SUM(actual_amount),0) as total_paid")->find();
        if (!$purchaseData) $purchaseData = ['order_count'=>0,'total_amount'=>0,'total_paid'=>0];

        // 基础统计（不受时间筛选）
        $productCount  = Db::name('products')->count();
        $customerCount = Db::name('customers')->count();
        $supplierCount = Db::name('suppliers')->count();

        // 客户排行（参数化查询）
        $profitCol = $hasProfit ? 'COALESCE(SUM(o.profit), 0)' : '0';
        $crQuery = Db::name('sales_orders')->alias('o')
            ->leftJoin('customers c', 'o.customer_id = c.id')
            ->field("c.id, c.name, COUNT(o.id) as order_count, COALESCE(SUM(o.total_amount),0) as total_sales, {$profitCol} as total_profit")
            ->group('c.id, c.name')->order('total_sales', 'desc')->limit(10);
        if ($dateCondition) $crQuery->where('o.order_date', '>=', $dateCondition);
        $customerRank = $crQuery->select()->toArray();

        // 商品排行
        $prQuery = Db::name('sales_order_items')->alias('i')
            ->leftJoin('sales_orders o', 'i.order_id = o.id')
            ->leftJoin('products p', 'i.product_id = p.id')
            ->field("p.id, p.name, SUM(i.quantity) as total_qty, COALESCE(SUM(i.quantity * i.unit_price),0) as total_sales")
            ->group('p.id, p.name')->order('total_sales', 'desc')->limit(10);
        if ($dateCondition) $prQuery->where('o.order_date', '>=', $dateCondition);
        $productRank = $prQuery->select()->toArray();

        // 制作厂家排行
        $srQuery = Db::name('purchase_orders')->alias('o')
            ->leftJoin('suppliers s', 'o.supplier_id = s.id')
            ->field("s.id, s.name, COUNT(o.id) as order_count, COALESCE(SUM(o.total_amount),0) as total_amount")
            ->group('s.id, s.name')->order('total_amount', 'desc')->limit(10);
        if ($dateCondition) $srQuery->where('o.order_date', '>=', $dateCondition);
        $supplierRank = $srQuery->select()->toArray();

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
