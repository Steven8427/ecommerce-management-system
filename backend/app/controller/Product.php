<?php
namespace app\controller;

use app\BaseController;
use app\model\Product as ProductModel;
use app\model\Category;

/**
 * 商品控制器
 */
class Product extends BaseController
{
    /**
     * 商品列表
     */
    public function index()
    {
        $products = ProductModel::getListWithCategory();
        return json(['code' => 200, 'data' => $products]);
    }
    
    /**
     * 添加商品
     */
    public function add()
    {
        $data = $this->request->post();
        
        $product = ProductModel::create($data);
        
        return json(['code' => 200, 'message' => '添加成功', 'data' => $product]);
    }
    
    /**
     * 更新商品
     */
    public function update()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();
        
        $product = ProductModel::find($id);
        $product->save($data);
        
        return json(['code' => 200, 'message' => '更新成功']);
    }
    
    /**
     * 删除商品
     */
    public function delete()
    {
        $id = $this->request->param('id');
        
        try {
            // 检查商品是否被销售单使用
            $salesCount = \app\model\SalesOrderItem::where('product_id', $id)->count();
            if ($salesCount > 0) {
                return json(['code' => 400, 'message' => '该商品已被 ' . $salesCount . ' 个销售单使用，无法删除']);
            }
            
            // 检查商品是否被进货单使用
            $purchaseCount = \app\model\PurchaseOrderItem::where('product_id', $id)->count();
            if ($purchaseCount > 0) {
                return json(['code' => 400, 'message' => '该商品已被 ' . $purchaseCount . ' 个进货单使用，无法删除']);
            }
            
            // 删除商品
            ProductModel::destroy($id);
            
            return json(['code' => 200, 'message' => '删除成功']);
            
        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }
    
    /**
     * 分类列表
     */
    public function categories()
    {
        $categories = Category::select();
        return json(['code' => 200, 'data' => $categories]);
    }
    
    /**
     * 添加分类
     */
    public function addCategory()
    {
        try {
            $data = $this->request->post();
            $saveData = [
                'name' => $data['name'] ?? '',
            ];
            if (!empty($data['parent_id'])) {
                $saveData['parent_id'] = intval($data['parent_id']);
            }
            $category = Category::create($saveData);
            return json(['code' => 200, 'message' => '添加成功', 'data' => $category]);
        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => '添加失败：' . $e->getMessage()]);
        }
    }
    
    /**
     * 删除分类
     */
    public function deleteCategory()
    {
        $id = $this->request->param('id');
        
        try {
            // 检查分类是否被商品使用
            $productCount = ProductModel::where('category', $id)->count();
            if ($productCount > 0) {
                return json(['code' => 400, 'message' => '该分类下有 ' . $productCount . ' 个商品，无法删除']);
            }
            
            // 检查是否有子分类
            $childCount = Category::where('parent_id', $id)->count();
            if ($childCount > 0) {
                return json(['code' => 400, 'message' => '该分类下有 ' . $childCount . ' 个子分类，无法删除']);
            }
            
            // 删除分类
            Category::destroy($id);
            
            return json(['code' => 200, 'message' => '删除成功']);
            
        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }
}
