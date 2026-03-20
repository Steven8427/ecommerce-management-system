<?php
namespace app\model;

use think\Model;

/**
 * 客户模型
 */
class Customer extends Model
{
    protected $name = 'customers';
    
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    
    // 关联销售单
    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class, 'customer_id');
    }
    
    // 关联客户等级
    public function level()
    {
        return $this->belongsTo(CustomerLevel::class, 'level_id');
    }
}
