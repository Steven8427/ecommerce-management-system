<?php
namespace app\model;

use think\Model;

/**
 * 进货单明细模型
 */
class PurchaseOrderItem extends Model
{
    protected $name = 'purchase_order_items';
    
    protected $autoWriteTimestamp = false;
    
    // 关联进货单
    public function order()
    {
        return $this->belongsTo(PurchaseOrder::class, 'order_id');
    }
    
    // 关联商品
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
