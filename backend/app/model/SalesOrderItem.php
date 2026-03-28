<?php
namespace app\model;

use think\Model;

/**
 * 销售单明细模型
 */
class SalesOrderItem extends Model
{
    protected $name = 'sales_order_items';

    protected $autoWriteTimestamp = false;

    // JSON字段自动转换
    protected $json = ['cost_details', 'materials'];

    // 关联销售单
    public function order()
    {
        return $this->belongsTo(SalesOrder::class, 'order_id');
    }
}
