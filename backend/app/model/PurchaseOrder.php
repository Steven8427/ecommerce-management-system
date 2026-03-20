<?php
namespace app\model;

use think\Model;

/**
 * 进货单模型
 */
class PurchaseOrder extends Model
{
    protected $name = 'purchase_orders';
    
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    
    // 关联供应商
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
    
    // 关联订单明细
    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class, 'order_id');
    }
    
    // 自动计算总价
    public function calculateTotal()
    {
        // 获取所有订单明细
        $items = $this->items()->select();
        $subtotal = 0;
        
        foreach ($items as $item) {
            $subtotal += $item->quantity * $item->unit_price;
        }
        
        $total = $subtotal - $this->discount + $this->shipping_fee;
        
        $this->subtotal = $subtotal;
        $this->total_amount = $total;
        $this->save();
        
        return $total;
    }
}
