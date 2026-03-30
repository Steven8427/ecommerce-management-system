<?php
namespace app\controller;

use app\BaseController;
use app\model\Customer as CustomerModel;
use app\model\CustomerLevel;
use think\facade\Db;

/**
 * 客户控制器
 */
class Customer extends BaseController
{
    /**
     * 客户列表
     */
    public function index()
    {
        $customers = CustomerModel::with('level')->select()->toArray();
        // Attach order count per customer
        $counts = \think\facade\Db::name('sales_orders')
            ->field('customer_id, COUNT(*) as cnt')
            ->group('customer_id')
            ->select()->toArray();
        $countMap = [];
        foreach ($counts as $row) {
            $countMap[$row['customer_id']] = (int)$row['cnt'];
        }
        foreach ($customers as &$c) {
            $c['order_count'] = $countMap[$c['id']] ?? 0;
        }
        return json(['code' => 200, 'data' => $customers]);
    }
    
    /**
     * 添加客户
     */
    public function add()
    {
        $data = $this->request->post();
        $customer = CustomerModel::create($data);
        
        return json(['code' => 200, 'message' => '添加成功', 'data' => $customer]);
    }
    
    /**
     * 更新客户
     */
    public function update()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();
        
        $customer = CustomerModel::find($id);
        $customer->save($data);
        
        return json(['code' => 200, 'message' => '更新成功']);
    }
    
    /**
     * 删除客户
     */
    public function delete()
    {
        $id = $this->request->param('id');
        
        try {
            // 检查客户是否有销售单
            $orderCount = \app\model\SalesOrder::where('customer_id', $id)->count();
            if ($orderCount > 0) {
                return json(['code' => 400, 'message' => '该客户有 ' . $orderCount . ' 个销售单，无法删除']);
            }
            
            CustomerModel::destroy($id);
            
            return json(['code' => 200, 'message' => '删除成功']);
            
        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }
    
    /**
     * 客户欠款信息
     */
    public function debts()
    {
        try {
            $rows = \think\facade\Db::name('sales_orders')
                ->alias('o')
                ->leftJoin('customers c', 'o.customer_id = c.id')
                ->leftJoin('sales_order_items i', 'i.order_id = o.id')
                ->field('o.id, o.customer_id, c.name as customer_name, o.order_date, o.actual_amount, o.prepaid_amount, o.status, o.description, GROUP_CONCAT(DISTINCT i.name SEPARATOR "、") as item_names')
                ->whereRaw('(o.actual_amount - o.prepaid_amount) > 0')
                ->where('o.status', '<>', 'completed')
                ->group('o.id')
                ->order('o.customer_id, o.order_date desc')
                ->select()
                ->toArray();

            // Group by customer
            $grouped = [];
            foreach ($rows as $row) {
                $cid = $row['customer_id'];
                $owed = round($row['actual_amount'] - $row['prepaid_amount'], 2);
                if (!isset($grouped[$cid])) {
                    $grouped[$cid] = [
                        'customer_id' => $cid,
                        'total_owed' => 0,
                        'orders' => [],
                    ];
                }
                $grouped[$cid]['total_owed'] = round($grouped[$cid]['total_owed'] + $owed, 2);
                $grouped[$cid]['orders'][] = [
                    'order_id' => $row['id'],
                    'order_date' => $row['order_date'],
                    'actual_amount' => $row['actual_amount'],
                    'prepaid_amount' => $row['prepaid_amount'],
                    'owed' => $owed,
                    'status' => $row['status'],
                    'description' => $row['description'],
                    'item_names' => $row['item_names'] ?: '',
                ];
            }

            return json(['code' => 200, 'data' => array_values($grouped)]);
        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => $e->getMessage()]);
        }
    }

    /**
     * 余额操作（充值/扣减/设定）
     */
    public function balanceAdjust()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();
        $type = $data['type'] ?? '';
        $amount = round(floatval($data['amount'] ?? 0), 2);
        $remark = $data['remark'] ?? '';

        if (!in_array($type, ['increase', 'decrease', 'set'])) {
            return json(['code' => 400, 'message' => '无效的操作类型']);
        }
        if ($type !== 'set' && $amount <= 0) {
            return json(['code' => 400, 'message' => '金额必须大于0']);
        }

        Db::startTrans();
        try {
            $customer = Db::name('customers')->where('id', $id)->lock(true)->find();
            if (!$customer) {
                Db::rollback();
                return json(['code' => 404, 'message' => '客户不存在']);
            }

            $balanceBefore = round(floatval($customer['balance'] ?? 0), 2);

            if ($type === 'increase') {
                $balanceAfter = round($balanceBefore + $amount, 2);
                $recordType = 'increase';
            } elseif ($type === 'decrease') {
                $balanceAfter = round($balanceBefore - $amount, 2);
                if ($balanceAfter < 0) $balanceAfter = 0;
                $amount = round($balanceBefore - $balanceAfter, 2);
                $recordType = 'decrease';
            } else {
                $balanceAfter = round(floatval($data['amount'] ?? 0), 2);
                if ($balanceAfter < 0) $balanceAfter = 0;
                $recordType = 'set';
            }

            // 更新余额
            Db::name('customers')->where('id', $id)->update(['balance' => $balanceAfter]);

            // 记录变动
            Db::name('balance_records')->insert([
                'customer_id'    => $id,
                'type'           => $recordType,
                'amount'         => $type === 'set' ? abs($balanceAfter - $balanceBefore) : $amount,
                'balance_before' => $balanceBefore,
                'balance_after'  => $balanceAfter,
                'order_id'       => null,
                'remark'         => $remark ?: ($type === 'increase' ? '管理员充值' : ($type === 'decrease' ? '管理员扣减' : '管理员设定余额')),
                'created_at'     => date('Y-m-d H:i:s'),
            ]);

            Db::commit();
            return json(['code' => 200, 'message' => '操作成功', 'data' => ['balance' => $balanceAfter]]);

        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '操作失败：' . $e->getMessage()]);
        }
    }

    /**
     * 余额变动记录
     */
    public function balanceRecords()
    {
        $id = $this->request->param('id');
        try {
            $records = Db::name('balance_records')
                ->alias('r')
                ->leftJoin('sales_orders o', 'r.order_id = o.id')
                ->field('r.*, o.total_amount as order_total')
                ->where('r.customer_id', $id)
                ->order('r.id', 'desc')
                ->select()
                ->toArray();
            return json(['code' => 200, 'data' => $records]);
        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => $e->getMessage()]);
        }
    }

    /**
     * 等级列表
     */
    public function levels()
    {
        $levels = CustomerLevel::select();
        return json(['code' => 200, 'data' => $levels]);
    }
    
    /**
     * 添加等级
     */
    public function addLevel()
    {
        $data = $this->request->post();
        $level = CustomerLevel::create($data);
        
        return json(['code' => 200, 'message' => '添加成功', 'data' => $level]);
    }
    
    /**
     * 更新等级
     */
    public function updateLevel()
    {
        $id = $this->request->param('id');
        $data = $this->request->post();
        
        $level = CustomerLevel::find($id);
        $level->save($data);
        
        return json(['code' => 200, 'message' => '更新成功']);
    }
    
    /**
     * 删除等级
     */
    public function deleteLevel()
    {
        $id = $this->request->param('id');
        
        try {
            // 检查是否有客户使用该等级
            $customerCount = CustomerModel::where('level_id', $id)->count();
            if ($customerCount > 0) {
                return json(['code' => 400, 'message' => '有 ' . $customerCount . ' 个客户使用该等级，无法删除']);
            }
            
            CustomerLevel::destroy($id);
            
            return json(['code' => 200, 'message' => '删除成功']);
            
        } catch (\Exception $e) {
            return json(['code' => 500, 'message' => '删除失败：' . $e->getMessage()]);
        }
    }
}
