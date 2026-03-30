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
        if (!in_array($period, ['today', 'week', 'month', 'year', 'all', 'custom'])) {
            $period = 'all';
        }

        $startDate = null;
        $endDate = null;
        if ($period === 'custom') {
            $startDate = $this->request->get('start', '');
            $endDate = $this->request->get('end', '');
        } else {
            $startDate = $this->getDateCondition($period);
        }

        // 基础统计
        $customerCount = Db::name('customers')->count();

        // 订单统计
        $orderQuery = Db::name('sales_orders');
        if ($startDate) {
            $orderQuery = $orderQuery->where('order_date', '>=', $startDate . ' 00:00:00');
        }
        if ($endDate) {
            $orderQuery = $orderQuery->where('order_date', '<=', $endDate . ' 23:59:59');
        }
        $orderCount = (clone $orderQuery)->count();
        $totalSales = (clone $orderQuery)->sum('total_amount') ?: 0;
        $totalCost = (clone $orderQuery)->sum('cost_total') ?: 0;
        $totalProfit = (clone $orderQuery)->sum('profit') ?: 0;
        $totalPrepaid = (clone $orderQuery)->sum('prepaid_amount') ?: 0;
        $completedCount = (clone $orderQuery)->where('status', 'completed')->count();
        $pendingCount = (clone $orderQuery)->where('status', '<>', 'completed')->count();

        // 客户排行（按消费总额）
        $customerRankQuery = Db::name('sales_orders')
            ->alias('o')
            ->leftJoin('customers c', 'o.customer_id = c.id')
            ->field('o.customer_id, c.name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_sales')
            ->group('o.customer_id');
        if ($startDate) {
            $customerRankQuery = $customerRankQuery->where('o.order_date', '>=', $startDate . ' 00:00:00');
        }
        if ($endDate) {
            $customerRankQuery = $customerRankQuery->where('o.order_date', '<=', $endDate . ' 23:59:59');
        }
        $customerRank = $customerRankQuery
            ->order('total_sales', 'desc')
            ->select()
            ->toArray();

        // 订单列表（已完成 + 进行中）
        $orderListBase = Db::name('sales_orders')
            ->alias('o')
            ->leftJoin('customers c', 'o.customer_id = c.id')
            ->field('o.id, c.name as customer_name, o.total_amount, o.discount_amount, o.cost_total, o.profit, o.prepaid_amount, o.status, o.order_date');
        if ($startDate) {
            $orderListBase = $orderListBase->where('o.order_date', '>=', $startDate . ' 00:00:00');
        }
        if ($endDate) {
            $orderListBase = $orderListBase->where('o.order_date', '<=', $endDate . ' 23:59:59');
        }
        $completedOrders = (clone $orderListBase)->where('o.status', 'completed')->order('o.order_date', 'desc')->select()->toArray();
        $pendingOrders = (clone $orderListBase)->where('o.status', '<>', 'completed')->order('o.order_date', 'desc')->select()->toArray();

        // 商品排行（按销售额，从 sales_order_items）
        $productRankQuery = Db::name('sales_order_items')
            ->alias('i')
            ->leftJoin('sales_orders o', 'i.order_id = o.id')
            ->field('i.name, SUM(i.quantity) as total_qty, SUM(i.amount) as total_sales')
            ->where('i.name', '<>', '')
            ->group('i.name');
        if ($startDate) {
            $productRankQuery = $productRankQuery->where('o.order_date', '>=', $startDate . ' 00:00:00');
        }
        if ($endDate) {
            $productRankQuery = $productRankQuery->where('o.order_date', '<=', $endDate . ' 23:59:59');
        }
        $productRank = $productRankQuery
            ->order('total_sales', 'desc')
            ->select()
            ->toArray();

        return json([
            'code' => 200,
            'data' => [
                'counts' => [
                    'customers'  => $customerCount,
                    'orders'     => $orderCount,
                    'completed'  => $completedCount,
                    'pending'    => $pendingCount,
                ],
                'sales' => [
                    'total'   => round($totalSales, 2),
                    'cost'    => round($totalCost, 2),
                    'profit'  => round($totalProfit, 2),
                    'prepaid' => round($totalPrepaid, 2),
                ],
                'customerRank' => $customerRank,
                'productRank'  => $productRank,
                'completedOrders' => $completedOrders,
                'pendingOrders' => $pendingOrders,
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
