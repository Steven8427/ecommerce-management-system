<?php
namespace app\model;

use think\Model;

/**
 * 供应商模型
 */
class Supplier extends Model
{
    protected $name = 'suppliers';
    
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    
    // 关联进货单
    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'supplier_id');
    }
}
