<?php
namespace app\model;

use think\Model;

/**
 * 商品模型
 */
class Product extends Model
{
    protected $name = 'products';
    
    // 自动时间戳
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    
    // 关联分类 - 字段名是 category 不是 category_id
    public function categoryInfo()
    {
        return $this->belongsTo(Category::class, 'category', 'id');
    }
    
    // 获取商品列表（带分类）
    public static function getListWithCategory()
    {
        return self::with(['categoryInfo'])->select();
    }
    
    // 追加分类名称到JSON
    protected $append = ['category_name'];
    
    public function getCategoryNameAttr($value, $data)
    {
        // 数据库字段是 category 不是 category_id
        if (isset($data['category']) && $data['category']) {
            $category = Category::find($data['category']);
            return $category ? $category->name : '';
        }
        return '';
    }
}
