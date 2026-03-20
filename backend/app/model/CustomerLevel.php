<?php
namespace app\model;

use think\Model;

/**
 * 客户等级模型
 */
class CustomerLevel extends Model
{
    protected $name = 'customer_levels';
    
    // 自动时间戳
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
}
