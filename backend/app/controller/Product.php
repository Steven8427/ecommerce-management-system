<?php
namespace app\controller;

use app\BaseController;
use app\model\Category;

/**
 * 耗材分类控制器（供销售单选材使用）
 */
class Product extends BaseController
{
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
            // 检查是否有子分类
            $childCount = Category::where('parent_id', $id)->count();
            if ($childCount > 0) {
                return json(['code' => 400, 'message' => '该分类下有 ' . $childCount . ' 个子分类，无法删除']);
            }

            Category::destroy($id);

            return json(['code' => 200, 'message' => '删除成功']);

        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }
}
