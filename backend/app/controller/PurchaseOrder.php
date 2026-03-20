<?php
namespace app\controller;

use app\BaseController;
use app\model\PurchaseOrder as PurchaseOrderModel;
use app\model\PurchaseOrderItem;
use think\facade\Db;

/**
 * 进货单控制器
 */
class PurchaseOrder extends BaseController
{
    /**
     * 进货单列表
     */
    public function index()
    {
        $orders = PurchaseOrderModel::with('supplier')->order('id', 'desc')->select();
        return json(['code' => 200, 'data' => $orders]);
    }
    
    /**
     * 创建进货单
     */
    public function create()
    {
        $data = $this->request->post();
        
        // 开启事务
        Db::startTrans();
        try {
            // 1. 创建订单主表
            $order = PurchaseOrderModel::create([
                'supplier_id' => $data['supplier_id'],
                'order_date' => date('Y-m-d H:i:s'),
                'status' => 'pending',
                'discount' => $data['discount'] ?? 0,
                'shipping_fee' => $data['shipping_fee'] ?? 0,
                'actual_amount' => $data['actual_amount'] ?? 0,
                'description' => $data['description'] ?? '',
                'notes' => $data['notes'] ?? '',
                'image' => $data['image'] ?? ''
            ]);
            
            // 2. 创建订单明细
            foreach ($data['items'] as $item) {
                PurchaseOrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'notes' => $item['notes'] ?? ''
                ]);
            }
            
            // 3. 计算总价
            $order->calculateTotal();
            
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
        $order = PurchaseOrderModel::with(['supplier', 'items.product'])->find($id);
        
        return json(['code' => 200, 'data' => $order]);
    }
    
    /**
     * 更新进货单
     */
    public function update()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();
        
        // 开启事务
        Db::startTrans();
        try {
            // 1. 查找订单
            $order = PurchaseOrderModel::find($id);
            if (!$order) {
                return json(['code' => 404, 'message' => '订单不存在']);
            }
            
            // 2. 更新订单主表
            $order->save([
                'supplier_id' => $data['supplier_id'],
                'discount' => $data['discount'] ?? 0,
                'shipping_fee' => $data['shipping_fee'] ?? 0,
                'actual_amount' => $data['actual_amount'] ?? 0,
                'description' => $data['description'] ?? '',
                'notes' => $data['notes'] ?? '',
            ]);
            
            // 3. 删除旧的订单明细
            PurchaseOrderItem::where('order_id', $id)->delete();
            
            // 4. 创建新的订单明细
            foreach ($data['items'] as $item) {
                PurchaseOrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'notes' => $item['notes'] ?? ''
                ]);
            }
            
            // 5. 重新计算总价
            $order->calculateTotal();
            
            Db::commit();
            return json(['code' => 200, 'message' => '更新成功', 'data' => ['order_id' => $order->id]]);
            
        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '更新失败：' . $e->getMessage()]);
        }
    }
    
    /**
     * 删除进货单
     */
    public function delete()
    {
        $id = $this->request->param('id');
        
        // 开启事务
        Db::startTrans();
        try {
            // 1. 查找订单
            $order = PurchaseOrderModel::find($id);
            if (!$order) {
                return json(['code' => 404, 'message' => '订单不存在']);
            }
            
            // 2. 删除订单明细
            PurchaseOrderItem::where('order_id', $id)->delete();
            
            // 3. 删除订单主表
            $order->delete();
            
            Db::commit();
            return json(['code' => 200, 'message' => '删除成功']);
            
        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }
}
