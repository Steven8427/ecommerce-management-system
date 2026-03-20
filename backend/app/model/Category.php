<?php
namespace app\model;

use think\Model;

/**
 * 商品分类模型
 */
class Category extends Model
{
    protected $name = 'categories';
    
    protected $autoWriteTimestamp = 'datetime';
    protected $createTime = 'created_at';
    protected $updateTime = false;
    
    // 关联商品
    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }
    
    // 关联父分类
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }
    
    // 关联子分类
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }
}
