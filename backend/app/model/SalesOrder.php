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
    protected $updateTime = 'updated_at';

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
}
