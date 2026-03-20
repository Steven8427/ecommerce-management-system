<?php
namespace app\model;

use think\Model;

/**
 * 销售单模型
 */
class SalesOrder extends Model
{
    protected $name = 'sales_orders';
    
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    
    // 关联客户
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
    
    // 关联订单明细
    public function items()
    {
        return $this->hasMany(SalesOrderItem::class, 'order_id');
    }
    
    // 自动计算总价
    public function calculateTotal()
    {
        // 获取所有订单明细
        $items = $this->items()->with('product')->select();
        $subtotal = 0;
        $costTotal = 0;
        
        foreach ($items as $item) {
            $subtotal += $item->quantity * $item->unit_price;
            // 计算成本总计
            if ($item->product && $item->product->cost_price) {
                $costTotal += $item->quantity * $item->product->cost_price;
            }
        }
        
        $total = $subtotal - $this->discount + $this->shipping_fee;
        $profit = $subtotal - $costTotal;
        
        $this->subtotal = $subtotal;
        $this->total_amount = $total;
        $this->cost_total = $costTotal;
        $this->profit = $profit;
        $this->save();
        
        return $total;
    }
    
    // 追加虚拟字段
    protected $append = ['cost_total_calculated', 'profit_calculated'];
    
    // 获取成本总计
    public function getCostTotalCalculatedAttr($value, $data)
    {
        if (isset($data['cost_total'])) {
            return $data['cost_total'];
        }
        
        $items = $this->items()->with('product')->select();
        $costTotal = 0;
        foreach ($items as $item) {
            if ($item->product && $item->product->cost_price) {
                $costTotal += $item->quantity * $item->product->cost_price;
            }
        }
        return $costTotal;
    }
    
    // 获取利润
    public function getProfitCalculatedAttr($value, $data)
    {
        if (isset($data['profit'])) {
            return $data['profit'];
        }
        
        $costTotal = $this->cost_total_calculated;
        $subtotal = $data['subtotal'] ?? 0;
        return $subtotal - $costTotal;
    }
}
