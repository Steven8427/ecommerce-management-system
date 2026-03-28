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

        // 格式化为前端期望的结构
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
            // 创建订单主表
            $orderId = Db::name('sales_orders')->insertGetId([
                'customer_id'     => $data['customer_id'],
                'order_date'      => date('Y-m-d H:i:s'),
                'total_amount'    => $data['total_amount'] ?? 0,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'actual_amount'   => $data['actual_amount'] ?? 0,
                'cost_total'      => $data['cost_total'] ?? 0,
                'profit'          => $data['profit'] ?? 0,
                'prepaid_amount'  => $data['prepaid_amount'] ?? 0,
                'status'          => $data['status'] ?? 'pending',
                'description'     => $data['description'] ?? '',
                'image'           => $data['image'] ?? '',
                'created_at'      => date('Y-m-d H:i:s'),
            ]);

            // 创建订单明细
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    Db::name('sales_order_items')->insert([
                        'order_id'       => $orderId,
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
            return json(['code' => 200, 'message' => '创建成功', 'data' => ['order_id' => $orderId]]);

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
            ->field('o.*, c.name as cname, c.phone as cphone, c.address as caddress')
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
        ];
        unset($order['cname'], $order['cphone'], $order['caddress']);

        $items = Db::name('sales_order_items')
            ->where('order_id', $id)
            ->order('id', 'asc')
            ->select()
            ->toArray();

        // JSON decode cost_details and materials
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

            // 更新订单主表
            Db::name('sales_orders')->where('id', $id)->update([
                'customer_id'     => $data['customer_id'],
                'total_amount'    => $data['total_amount'] ?? 0,
                'discount_amount' => $data['discount_amount'] ?? 0,
                'actual_amount'   => $data['actual_amount'] ?? 0,
                'cost_total'      => $data['cost_total'] ?? 0,
                'profit'          => $data['profit'] ?? 0,
                'prepaid_amount'  => $data['prepaid_amount'] ?? 0,
                'status'          => $data['status'] ?? 'pending',
                'description'     => $data['description'] ?? '',
                'image'           => $data['image'] ?? '',
                'updated_at'      => date('Y-m-d H:i:s'),
            ]);

            // 删除旧明细
            Db::name('sales_order_items')->where('order_id', $id)->delete();

            // 创建新明细
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    Db::name('sales_order_items')->insert([
                        'order_id'       => $id,
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
            return json(['code' => 200, 'message' => '更新成功', 'data' => ['order_id' => $id]]);

        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '更新失败：' . $e->getMessage()]);
        }
    }

    /**
     * 删除销售单
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

            // 删除明细
            Db::name('sales_order_items')->where('order_id', $id)->delete();

            // 删除订单
            Db::name('sales_orders')->where('id', $id)->delete();

            Db::commit();
            return json(['code' => 200, 'message' => '删除成功']);

        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }

    /**
     * 更新订单状态（完成/预付）
     */
    public function updateStatus()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();

        $order = Db::name('sales_orders')->where('id', $id)->find();
        if (!$order) {
            return json(['code' => 404, 'message' => '订单不存在']);
        }

        $update = ['updated_at' => date('Y-m-d H:i:s')];

        if (isset($data['status'])) {
            $update['status'] = $data['status'];
        }
        if (isset($data['prepaid_amount'])) {
            $update['prepaid_amount'] = $data['prepaid_amount'];
        }

        Db::name('sales_orders')->where('id', $id)->update($update);

        return json(['code' => 200, 'message' => '状态更新成功']);
    }
}
