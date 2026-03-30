<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;

/**
 * 销售单控制器（新版 - 项目明细模式）
 */
class SalesOrder extends BaseController
{
    /**
     * 销售单列表
     */
    public function index()
    {
        $orders = Db::name('sales_orders')
            ->alias('o')
            ->leftJoin('customers c', 'o.customer_id = c.id')
            ->field('o.*, c.name as customer_name, c.phone as customer_phone')
            ->order('o.id', 'desc')
            ->select()
            ->toArray();

        foreach ($orders as &$order) {
            $order['customer'] = [
                'id' => $order['customer_id'],
                'name' => $order['customer_name'] ?? '-',
                'phone' => $order['customer_phone'] ?? '',
            ];
        }

        return json(['code' => 200, 'data' => $orders]);
    }

    /**
     * 创建销售单
     */
    public function create()
    {
        $data = $this->request->post();

        Db::startTrans();
        try {
            $customerId = $data['customer_id'];
            $actualAmount = round(floatval($data['actual_amount'] ?? 0), 2);

            // 查询客户余额，自动抵扣
            $customer = Db::name('customers')->where('id', $customerId)->lock(true)->find();
            $balance = round(floatval($customer['balance'] ?? 0), 2);
            $deduct = min($balance, max($actualAmount, 0));

            // 创建订单主表
            $orderId = Db::name('sales_orders')->insertGetId([
                'customer_id'     => $customerId,
                'order_date'      => date('Y-m-d H:i:s'),
                'total_amount'    => $data['total_amount'] ?? 0,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'actual_amount'   => $actualAmount,
                'cost_total'      => $data['cost_total'] ?? 0,
                'profit'          => $data['profit'] ?? 0,
                'prepaid_amount'  => $deduct,
                'status'          => ($deduct >= $actualAmount && $actualAmount > 0) ? 'completed' : 'pending',
                'description'     => $data['description'] ?? '',
                'image'           => $data['image'] ?? '',
                'created_at'      => date('Y-m-d H:i:s'),
            ]);

            // 扣除余额并记录
            if ($deduct > 0) {
                $newBalance = round($balance - $deduct, 2);
                Db::name('customers')->where('id', $customerId)->update(['balance' => $newBalance]);
                Db::name('balance_records')->insert([
                    'customer_id'    => $customerId,
                    'type'           => 'order_deduct',
                    'amount'         => $deduct,
                    'balance_before' => $balance,
                    'balance_after'  => $newBalance,
                    'order_id'       => $orderId,
                    'remark'         => '订单 #' . $orderId . ' 创建自动抵扣',
                    'created_at'     => date('Y-m-d H:i:s'),
                ]);
            }

            // 创建订单明细
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    Db::name('sales_order_items')->insert([
                        'order_id'       => $orderId,
                        'item_date'      => !empty($item['item_date']) ? $item['item_date'] : null,
                        'name'           => $item['name'] ?? '',
                        'unit'           => $item['unit'] ?? '平方米',
                        'width'          => $item['width'] ?? 0,
                        'height'         => $item['height'] ?? 0,
                        'quantity'       => $item['quantity'] ?? 1,
                        'unit_price'     => $item['unit_price'] ?? 0,
                        'customer_price' => $item['customer_price'] ?? 0,
                        'cost_details'   => $item['cost_details'] ?? '[]',
                        'cost_price'     => $item['cost_price'] ?? 0,
                        'materials'      => $item['materials'] ?? '[]',
                        'area'           => $item['area'] ?? 0,
                        'amount'         => $item['amount'] ?? 0,
                        'content'        => $item['content'] ?? '',
                        'remark'         => $item['remark'] ?? '',
                        'image'          => $item['image'] ?? '',
                        'created_at'     => date('Y-m-d H:i:s'),
                    ]);
                }
            }

            Db::commit();
            $msg = $deduct > 0 ? '创建成功，余额抵扣 ¥' . number_format($deduct, 2) : '创建成功';
            return json(['code' => 200, 'message' => $msg, 'data' => [
                'order_id' => $orderId,
            ]]);

        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '创建失败：' . $e->getMessage()]);
        }
    }

    /**
     * 订单详情
     */
    public function detail()
    {
        $id = $this->request->param('id');

        $order = Db::name('sales_orders')
            ->alias('o')
            ->leftJoin('customers c', 'o.customer_id = c.id')
            ->field('o.*, c.name as cname, c.phone as cphone, c.address as caddress, c.balance as customer_balance')
            ->where('o.id', $id)
            ->find();

        if (!$order) {
            return json(['code' => 404, 'message' => '订单不存在']);
        }

        $order['customer'] = [
            'id' => $order['customer_id'],
            'name' => $order['cname'] ?? '-',
            'phone' => $order['cphone'] ?? '',
            'address' => $order['caddress'] ?? '',
            'balance' => $order['customer_balance'] ?? 0,
        ];
        unset($order['cname'], $order['cphone'], $order['caddress'], $order['customer_balance']);

        $items = Db::name('sales_order_items')
            ->where('order_id', $id)
            ->order('id', 'asc')
            ->select()
            ->toArray();

        foreach ($items as &$item) {
            if (is_string($item['cost_details'])) {
                $item['cost_details'] = json_decode($item['cost_details'], true) ?: [];
            }
            if (is_string($item['materials'])) {
                $item['materials'] = json_decode($item['materials'], true) ?: [];
            }
        }

        $order['items'] = $items;

        return json(['code' => 200, 'data' => $order]);
    }

    /**
     * 更新销售单
     */
    public function update()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();

        Db::startTrans();
        try {
            $order = Db::name('sales_orders')->where('id', $id)->find();
            if (!$order) {
                return json(['code' => 404, 'message' => '订单不存在']);
            }

            $customerId = $data['customer_id'];
            $newActual = round(floatval($data['actual_amount'] ?? 0), 2);
            $oldPrepaid = round(floatval($order['prepaid_amount'] ?? 0), 2);
            $oldCustomerId = $order['customer_id'];
            $oldStatus = $order['status'];

            $now = date('Y-m-d H:i:s');
            $deduct = $oldPrepaid; // 默认保留原抵扣
            $newStatus = $oldStatus; // 默认保留原状态

            if ($oldStatus === 'completed') {
                // 已完成订单：只更新内容，不动余额，不改状态
                $deduct = $oldPrepaid;
                $newStatus = 'completed';
            } else {
                // 未完成订单：退回旧抵扣，重新按新金额扣余额
                if ($oldPrepaid > 0) {
                    $refundCust = Db::name('customers')->where('id', $oldCustomerId)->lock(true)->find();
                    $refundBal = round(floatval($refundCust['balance'] ?? 0), 2);
                    $refundNewBal = round($refundBal + $oldPrepaid, 2);
                    Db::name('customers')->where('id', $oldCustomerId)->update(['balance' => $refundNewBal]);
                    Db::name('balance_records')->insert([
                        'customer_id'    => $oldCustomerId,
                        'type'           => 'order_refund',
                        'amount'         => $oldPrepaid,
                        'balance_before' => $refundBal,
                        'balance_after'  => $refundNewBal,
                        'order_id'       => $id,
                        'remark'         => '订单 #' . $id . ' 编辑退回余额',
                        'created_at'     => $now,
                    ]);
                }

                $customer = Db::name('customers')->where('id', $customerId)->lock(true)->find();
                $balance = round(floatval($customer['balance'] ?? 0), 2);
                $deduct = min($balance, max($newActual, 0));

                if ($deduct > 0) {
                    $newBalance = round($balance - $deduct, 2);
                    Db::name('customers')->where('id', $customerId)->update(['balance' => $newBalance]);
                    Db::name('balance_records')->insert([
                        'customer_id'    => $customerId,
                        'type'           => 'order_deduct',
                        'amount'         => $deduct,
                        'balance_before' => $balance,
                        'balance_after'  => $newBalance,
                        'order_id'       => $id,
                        'remark'         => '订单 #' . $id . ' 编辑重新抵扣',
                        'created_at'     => $now,
                    ]);
                }

                $newStatus = ($deduct >= $newActual && $newActual > 0) ? 'completed' : 'pending';
            }

            // 更新订单主表
            Db::name('sales_orders')->where('id', $id)->update([
                'customer_id'     => $customerId,
                'total_amount'    => $data['total_amount'] ?? 0,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'actual_amount'   => $newActual,
                'cost_total'      => $data['cost_total'] ?? 0,
                'profit'          => $data['profit'] ?? 0,
                'prepaid_amount'  => $deduct,
                'status'          => $newStatus,
                'description'     => $data['description'] ?? '',
                'image'           => $data['image'] ?? '',
                'updated_at'      => $now,
            ]);

            // 删除旧明细
            Db::name('sales_order_items')->where('order_id', $id)->delete();

            // 创建新明细
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    Db::name('sales_order_items')->insert([
                        'order_id'       => $id,
                        'item_date'      => !empty($item['item_date']) ? $item['item_date'] : null,
                        'name'           => $item['name'] ?? '',
                        'unit'           => $item['unit'] ?? '平方米',
                        'width'          => $item['width'] ?? 0,
                        'height'         => $item['height'] ?? 0,
                        'quantity'       => $item['quantity'] ?? 1,
                        'unit_price'     => $item['unit_price'] ?? 0,
                        'customer_price' => $item['customer_price'] ?? 0,
                        'cost_details'   => $item['cost_details'] ?? '[]',
                        'cost_price'     => $item['cost_price'] ?? 0,
                        'materials'      => $item['materials'] ?? '[]',
                        'area'           => $item['area'] ?? 0,
                        'amount'         => $item['amount'] ?? 0,
                        'content'        => $item['content'] ?? '',
                        'remark'         => $item['remark'] ?? '',
                        'image'          => $item['image'] ?? '',
                        'created_at'     => date('Y-m-d H:i:s'),
                    ]);
                }
            }

            Db::commit();
            $msg = '更新成功';
            if ($deduct > 0) $msg .= '，余额抵扣 ¥' . number_format($deduct, 2);
            return json(['code' => 200, 'message' => $msg, 'data' => [
                'order_id' => $id,
            ]]);

        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '更新失败：' . $e->getMessage()]);
        }
    }

    /**
     * 删除销售单 - 退还余额
     */
    public function delete()
    {
        $id = $this->request->param('id');

        Db::startTrans();
        try {
            $order = Db::name('sales_orders')->where('id', $id)->find();
            if (!$order) {
                return json(['code' => 404, 'message' => '订单不存在']);
            }

            $prepaid = round(floatval($order['prepaid_amount'] ?? 0), 2);
            $customerId = $order['customer_id'];

            // 退还余额
            if ($prepaid > 0) {
                $customer = Db::name('customers')->where('id', $customerId)->lock(true)->find();
                $balance = round(floatval($customer['balance'] ?? 0), 2);
                $newBalance = round($balance + $prepaid, 2);
                Db::name('customers')->where('id', $customerId)->update(['balance' => $newBalance]);
                Db::name('balance_records')->insert([
                    'customer_id'    => $customerId,
                    'type'           => 'order_refund',
                    'amount'         => $prepaid,
                    'balance_before' => $balance,
                    'balance_after'  => $newBalance,
                    'order_id'       => $id,
                    'remark'         => '订单 #' . $id . ' 删除退回余额',
                    'created_at'     => date('Y-m-d H:i:s'),
                ]);
            }

            // 删除相关余额记录中的订单引用（保留记录但标注已删除）
            // 不删除记录，保持完整审计轨迹

            Db::name('sales_order_items')->where('order_id', $id)->delete();
            Db::name('sales_orders')->where('id', $id)->delete();

            Db::commit();
            return json(['code' => 200, 'message' => '删除成功']);

        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }

    /**
     * 更新订单状态（完成/取消完成）
     * 完成：优先从余额扣款
     * 取消完成：退回已扣余额
     */
    public function updateStatus()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();
        $newStatus = $data['status'] ?? '';

        Db::startTrans();
        try {
            $order = Db::name('sales_orders')->where('id', $id)->find();
            if (!$order) {
                Db::rollback();
                return json(['code' => 404, 'message' => '订单不存在']);
            }

            $customerId = $order['customer_id'];
            $actualAmount = round(floatval($order['actual_amount'] ?? 0), 2);
            $oldPrepaid = round(floatval($order['prepaid_amount'] ?? 0), 2);
            $now = date('Y-m-d H:i:s');

            if ($newStatus === 'completed') {
                // 点击完成 = 收了全款现金，如果之前有余额抵扣则退回
                $message = '订单已完成';
                if ($oldPrepaid > 0) {
                    $customer = Db::name('customers')->where('id', $customerId)->lock(true)->find();
                    $balance = round(floatval($customer['balance'] ?? 0), 2);
                    $newBalance = round($balance + $oldPrepaid, 2);

                    Db::name('customers')->where('id', $customerId)->update(['balance' => $newBalance]);
                    Db::name('balance_records')->insert([
                        'customer_id'    => $customerId,
                        'type'           => 'order_refund',
                        'amount'         => $oldPrepaid,
                        'balance_before' => $balance,
                        'balance_after'  => $newBalance,
                        'order_id'       => $id,
                        'remark'         => '订单 #' . $id . ' 现金完成，退回余额抵扣',
                        'created_at'     => $now,
                    ]);
                    $message = '订单已完成，已退回余额 ¥' . number_format($oldPrepaid, 2);
                }

                Db::name('sales_orders')->where('id', $id)->update([
                    'prepaid_amount' => 0,
                    'status'         => 'completed',
                    'updated_at'     => $now,
                ]);
                Db::commit();
                return json(['code' => 200, 'message' => $message]);

            } elseif ($newStatus === 'pending') {
                // 取消完成：退回本订单所有已扣余额
                if ($oldPrepaid > 0) {
                    $customer = Db::name('customers')->where('id', $customerId)->lock(true)->find();
                    $balance = round(floatval($customer['balance'] ?? 0), 2);
                    $newBalance = round($balance + $oldPrepaid, 2);

                    Db::name('customers')->where('id', $customerId)->update(['balance' => $newBalance]);
                    Db::name('balance_records')->insert([
                        'customer_id'    => $customerId,
                        'type'           => 'order_refund',
                        'amount'         => $oldPrepaid,
                        'balance_before' => $balance,
                        'balance_after'  => $newBalance,
                        'order_id'       => $id,
                        'remark'         => '订单 #' . $id . ' 取消完成退回余额',
                        'created_at'     => $now,
                    ]);

                    Db::name('sales_orders')->where('id', $id)->update([
                        'prepaid_amount' => 0,
                        'status'         => 'pending',
                        'updated_at'     => $now,
                    ]);
                } else {
                    Db::name('sales_orders')->where('id', $id)->update([
                        'status'     => 'pending',
                        'updated_at' => $now,
                    ]);
                }

                Db::commit();
                return json(['code' => 200, 'message' => $oldPrepaid > 0 ? '已取消完成，余额已退回 ¥' . number_format($oldPrepaid, 2) : '已取消完成']);

            } else {
                Db::rollback();
                return json(['code' => 400, 'message' => '无效的状态']);
            }

        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '操作失败：' . $e->getMessage()]);
        }
    }

    /**
     * 余额完成：用客户余额结算订单
     * 余额够 → 全额扣除，订单完成
     * 余额不够 → 部分扣除，剩余待付，订单仍为 pending
     */
    public function balanceComplete()
    {
        $id = $this->request->param('id');

        Db::startTrans();
        try {
            $order = Db::name('sales_orders')->where('id', $id)->find();
            if (!$order) {
                Db::rollback();
                return json(['code' => 404, 'message' => '订单不存在']);
            }

            $customerId = $order['customer_id'];
            $actualAmount = round(floatval($order['actual_amount'] ?? 0), 2);
            $oldPrepaid = round(floatval($order['prepaid_amount'] ?? 0), 2);
            $pending = round($actualAmount - $oldPrepaid, 2);
            $now = date('Y-m-d H:i:s');

            if ($pending <= 0) {
                // 已经全额抵扣，直接标完成
                Db::name('sales_orders')->where('id', $id)->update([
                    'status'     => 'completed',
                    'updated_at' => $now,
                ]);
                Db::commit();
                return json(['code' => 200, 'message' => '订单已完成（无需额外扣款）']);
            }

            $customer = Db::name('customers')->where('id', $customerId)->lock(true)->find();
            $balance = round(floatval($customer['balance'] ?? 0), 2);

            if ($balance <= 0) {
                Db::rollback();
                return json(['code' => 400, 'message' => '客户余额为 0，无法余额结算']);
            }

            $deduct = min($balance, $pending);
            $newBalance = round($balance - $deduct, 2);
            $newPrepaid = round($oldPrepaid + $deduct, 2);
            $remainPending = round($actualAmount - $newPrepaid, 2);

            Db::name('customers')->where('id', $customerId)->update(['balance' => $newBalance]);
            Db::name('balance_records')->insert([
                'customer_id'    => $customerId,
                'type'           => 'order_deduct',
                'amount'         => $deduct,
                'balance_before' => $balance,
                'balance_after'  => $newBalance,
                'order_id'       => $id,
                'remark'         => '订单 #' . $id . ' 余额结算扣除',
                'created_at'     => $now,
            ]);

            if ($remainPending <= 0) {
                // 余额足够，全额扣除，订单完成
                Db::name('sales_orders')->where('id', $id)->update([
                    'prepaid_amount' => $newPrepaid,
                    'status'         => 'completed',
                    'updated_at'     => $now,
                ]);
                Db::commit();
                return json(['code' => 200, 'message' => '已完成，余额扣除 ¥' . number_format($deduct, 2)]);
            } else {
                // 余额不足，部分扣除，仍为 pending
                Db::name('sales_orders')->where('id', $id)->update([
                    'prepaid_amount' => $newPrepaid,
                    'status'         => 'pending',
                    'updated_at'     => $now,
                ]);
                Db::commit();
                return json(['code' => 200, 'message' => '余额扣除 ¥' . number_format($deduct, 2) . '，剩余待付 ¥' . number_format($remainPending, 2)]);
            }

        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '操作失败：' . $e->getMessage()]);
        }
    }
}
