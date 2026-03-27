<?php
namespace app\controller;

use app\BaseController;
use app\model\SalesOrder as SalesOrderModel;
use app\model\SalesOrderItem;
use think\facade\Db;

/**
 * 销售单控制器
 */
class SalesOrder extends BaseController
{
    /**
     * 销售单列表
     */
    public function index()
    {
        $orders = SalesOrderModel::with('customer')->order('id', 'desc')->select();
        return json(['code' => 200, 'data' => $orders]);
    }
    
    /**
     * 创建销售单
     */
    public function create()
    {
        $data = $this->request->post();
        
        // 开启事务
        Db::startTrans();
        try {
            // 1. 检查库存是否充足
            foreach ($data['items'] as $item) {
                $product = \app\model\Product::find($item['product_id']);
                if (!$product) {
                    throw new \Exception("商品ID {$item['product_id']} 不存在");
                }
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("商品 {$product->name} 库存不足，当前库存：{$product->stock}，需要：{$item['quantity']}");
                }
            }
            
            // 2. 创建订单主表
            $order = SalesOrderModel::create([
                'customer_id' => $data['customer_id'],
                'order_date' => date('Y-m-d H:i:s'),
                'status' => 'pending',
                'discount' => $data['discount'] ?? 0,
                'shipping_fee' => $data['shipping_fee'] ?? 0,
                'actual_amount' => $data['actual_amount'] ?? 0,
                'description' => $data['description'] ?? '',
                'notes' => $data['notes'] ?? '',
                'image' => $data['image'] ?? ''
            ]);

            // 3. 创建订单明细并扣减库存
            // 获取客户名称用于价格历史
            $customer = \app\model\Customer::find($data['customer_id']);
            foreach ($data['items'] as $item) {
                SalesOrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'notes' => $item['notes'] ?? ''
                ]);

                // 记录价格历史
                Db::name('price_history')->insert([
                    'product_id' => $item['product_id'],
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'customer_id' => $data['customer_id'],
                    'customer_name' => $customer ? $customer->name : '',
                    'order_id' => $order->id,
                    'order_type' => 'sales',
                    'created_at' => date('Y-m-d H:i:s'),
                ]);

                // 扣减库存
                $product = \app\model\Product::find($item['product_id']);
                $product->stock = $product->stock - $item['quantity'];
                $product->save();
            }

            // 4. 计算总价
            $order->calculateTotal();

            // 5. 扣减客户余额
            $deductAmount = floatval($data['actual_amount'] ?? 0);
            if ($deductAmount <= 0) {
                $deductAmount = floatval($order->total_amount ?? 0);
            }
            if ($deductAmount > 0 && $customer) {
                $balanceBefore = floatval($customer->balance ?? 0);
                $balanceAfter = $balanceBefore - $deductAmount;
                $customer->balance = $balanceAfter;
                $customer->save();

                // 获取操作者
                $token = $this->request->header('Authorization');
                $token = $token ? str_replace('Bearer ', '', $token) : '';
                $operator = $token ? Db::name('users')->where('token', $token)->find() : null;

                Db::name('balance_records')->insert([
                    'customer_id' => $data['customer_id'],
                    'type' => 'order_deduct',
                    'amount' => -$deductAmount,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'reason' => '客户清单 #' . $order->id . ' 扣款',
                    'order_id' => $order->id,
                    'operator_id' => $operator ? $operator['id'] : 0,
                    'operator_name' => $operator ? ($operator['nickname'] ?: $operator['username']) : '',
                    'created_at' => date('Y-m-d H:i:s'),
                ]);
            }

            Db::commit();
            return json(['code' => 200, 'message' => '创建成功', 'data' => ['order_id' => $order->id]]);
            
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
        $order = SalesOrderModel::with(['customer', 'items.product'])->find($id);
        
        return json(['code' => 200, 'data' => $order]);
    }
    
    /**
     * 更新销售单
     */
    public function update()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();
        
        // 开启事务
        Db::startTrans();
        try {
            // 1. 查找订单
            $order = SalesOrderModel::find($id);
            if (!$order) {
                return json(['code' => 404, 'message' => '订单不存在']);
            }
            
            // 2. 恢复旧订单的库存
            $oldItems = SalesOrderItem::where('order_id', $id)->select();
            foreach ($oldItems as $oldItem) {
                $product = \app\model\Product::find($oldItem->product_id);
                if ($product) {
                    $product->stock = $product->stock + $oldItem->quantity;
                    $product->save();
                }
            }
            
            // 3. 检查新订单的库存是否充足
            foreach ($data['items'] as $item) {
                $product = \app\model\Product::find($item['product_id']);
                if (!$product) {
                    throw new \Exception("商品ID {$item['product_id']} 不存在");
                }
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("商品 {$product->name} 库存不足，当前库存：{$product->stock}，需要：{$item['quantity']}");
                }
            }
            
            // 4. 更新订单主表
            $order->save([
                'customer_id' => $data['customer_id'],
                'discount' => $data['discount'] ?? 0,
                'shipping_fee' => $data['shipping_fee'] ?? 0,
                'actual_amount' => $data['actual_amount'] ?? 0,
                'description' => $data['description'] ?? '',
                'notes' => $data['notes'] ?? '',
                'image' => $data['image'] ?? ''
            ]);

            // 5. 删除旧的订单明细
            SalesOrderItem::where('order_id', $id)->delete();
            
            // 6. 创建新的订单明细并扣减库存
            $customer = \app\model\Customer::find($data['customer_id']);
            foreach ($data['items'] as $item) {
                SalesOrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'notes' => $item['notes'] ?? ''
                ]);

                // 记录价格历史
                Db::name('price_history')->insert([
                    'product_id' => $item['product_id'],
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'customer_id' => $data['customer_id'],
                    'customer_name' => $customer ? $customer->name : '',
                    'order_id' => $order->id,
                    'order_type' => 'sales',
                    'created_at' => date('Y-m-d H:i:s'),
                ]);

                // 扣减库存
                $product = \app\model\Product::find($item['product_id']);
                $product->stock = $product->stock - $item['quantity'];
                $product->save();
            }
            
            // 7. 重新计算总价
            $order->calculateTotal();
            
            Db::commit();
            return json(['code' => 200, 'message' => '更新成功', 'data' => ['order_id' => $order->id]]);
            
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
        
        // 开启事务
        Db::startTrans();
        try {
            // 1. 查找订单
            $order = SalesOrderModel::find($id);
            if (!$order) {
                return json(['code' => 404, 'message' => '订单不存在']);
            }
            
            // 2. 恢复库存
            $items = SalesOrderItem::where('order_id', $id)->select();
            foreach ($items as $item) {
                $product = \app\model\Product::find($item->product_id);
                if ($product) {
                    $product->stock = $product->stock + $item->quantity;
                    $product->save();
                }
            }
            
            // 3. 删除订单明细
            SalesOrderItem::where('order_id', $id)->delete();
            
            // 4. 删除订单主表
            $order->delete();
            
            Db::commit();
            return json(['code' => 200, 'message' => '删除成功']);
            
        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }

    /**
     * 获取商品历史价格（去重，按时间倒序）
     */
    public function historyPrices($id)
    {
        $customerId = $this->request->get('customer_id');

        $query = Db::name('price_history')
            ->where('product_id', $id);

        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        $prices = $query
            ->field('unit_price, quantity, customer_name, order_id, order_type, created_at as order_date')
            ->order('created_at', 'desc')
            ->limit(100)
            ->select()
            ->toArray();

        // 按价格去重，保留最近的记录
        $seen = [];
        $unique = [];
        foreach ($prices as $p) {
            $key = strval($p['unit_price']);
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $unique[] = $p;
            }
        }

        return json(['code' => 200, 'data' => $unique]);
    }
}
