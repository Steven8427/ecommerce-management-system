<?php
namespace app\controller;

use app\BaseController;
use app\model\Supplier as SupplierModel;

/**
 * 供应商控制器
 */
class Supplier extends BaseController
{
    /**
     * 供应商列表
     */
    public function index()
    {
        $suppliers = SupplierModel::select();
        return json(['code' => 200, 'data' => $suppliers]);
    }
    
    /**
     * 添加供应商
     */
    public function add()
    {
        $data = $this->request->post();
        $supplier = SupplierModel::create($data);
        
        return json(['code' => 200, 'message' => '添加成功', 'data' => $supplier]);
    }
    
    /**
     * 更新供应商
     */
    public function update()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();
        
        $supplier = SupplierModel::find($id);
        $supplier->save($data);
        
        return json(['code' => 200, 'message' => '更新成功']);
    }
    
    /**
     * 删除供应商
     */
    public function delete()
    {
        $id = $this->request->param('id');
        
        try {
            // 检查供应商是否有进货单
            $orderCount = \app\model\PurchaseOrder::where('supplier_id', $id)->count();
            if ($orderCount > 0) {
                return json(['code' => 400, 'message' => '该供应商有 ' . $orderCount . ' 个进货单，无法删除']);
            }
            
            SupplierModel::destroy($id);
            
            return json(['code' => 200, 'message' => '删除成功']);
            
        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }
}
