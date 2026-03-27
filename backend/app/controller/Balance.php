<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;

class Balance extends BaseController
{
    public function __construct(\think\App $app)
    {
        parent::__construct($app);
        // 自动创建 balance_records 表
        try {
            $tables = Db::query("SHOW TABLES LIKE 'balance_records'");
            if (empty($tables)) {
                Db::execute("CREATE TABLE balance_records (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    customer_id INT NOT NULL,
                    type ENUM('manual_add','manual_sub','manual_set','order_deduct') NOT NULL,
                    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                    balance_before DECIMAL(12,2) NOT NULL DEFAULT 0,
                    balance_after DECIMAL(12,2) NOT NULL DEFAULT 0,
                    reason VARCHAR(500) DEFAULT '',
                    order_id INT DEFAULT NULL,
                    operator_id INT DEFAULT NULL,
                    operator_name VARCHAR(100) DEFAULT '',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_customer (customer_id),
                    INDEX idx_order (order_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            }
        } catch (\Exception $e) {}

        // 自动给 customers 表加 balance 字段
        try {
            $cols = Db::query("SHOW COLUMNS FROM customers LIKE 'balance'");
            if (empty($cols)) {
                Db::execute("ALTER TABLE customers ADD COLUMN balance DECIMAL(12,2) NOT NULL DEFAULT 0");
            }
        } catch (\Exception $e) {}
    }

    // 获取客户余额记录
    public function records()
    {
        $customerId = $this->request->get('customer_id');
        if (!$customerId) {
            return json(['code' => 400, 'message' => '缺少customer_id']);
        }

        $records = Db::name('balance_records')
            ->where('customer_id', $customerId)
            ->order('id', 'desc')
            ->select()
            ->toArray();

        return json(['code' => 200, 'data' => $records]);
    }

    // 手动调整余额（增加/减少/设定）
    public function adjust()
    {
        $data = $this->request->post();
        $customerId = $data['customer_id'] ?? 0;
        $type = $data['type'] ?? ''; // manual_add, manual_sub, manual_set
        $amount = floatval($data['amount'] ?? 0);
        $reason = $data['reason'] ?? '';

        if (!in_array($type, ['manual_add', 'manual_sub', 'manual_set'])) {
            return json(['code' => 400, 'message' => '无效的操作类型']);
        }

        if ($amount < 0) {
            return json(['code' => 400, 'message' => '金额不能为负数']);
        }

        $customer = Db::name('customers')->where('id', $customerId)->find();
        if (!$customer) {
            return json(['code' => 404, 'message' => '客户不存在']);
        }

        $balanceBefore = floatval($customer['balance'] ?? 0);

        switch ($type) {
            case 'manual_add':
                $balanceAfter = $balanceBefore + $amount;
                break;
            case 'manual_sub':
                $balanceAfter = $balanceBefore - $amount;
                break;
            case 'manual_set':
                $balanceAfter = $amount;
                $amount = $amount - $balanceBefore; // 记录变动量
                break;
            default:
                return json(['code' => 400, 'message' => '无效操作']);
        }

        // 获取操作者信息
        $operator = $this->getAuthUser();

        Db::startTrans();
        try {
            // 更新客户余额
            Db::name('customers')->where('id', $customerId)->update(['balance' => $balanceAfter]);

            // 记录变动
            Db::name('balance_records')->insert([
                'customer_id' => $customerId,
                'type' => $type,
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reason' => $reason,
                'operator_id' => $operator ? $operator['id'] : 0,
                'operator_name' => $operator ? ($operator['nickname'] ?: $operator['username']) : '',
                'created_at' => date('Y-m-d H:i:s'),
            ]);

            Db::commit();
            return json(['code' => 200, 'message' => '操作成功', 'data' => ['balance' => $balanceAfter]]);
        } catch (\Exception $e) {
            Db::rollback();
            return json(['code' => 500, 'message' => '操作失败：' . $e->getMessage()]);
        }
    }

    private function getAuthUser()
    {
        $token = $this->request->header('Authorization');
        if (!$token) return null;
        $token = str_replace('Bearer ', '', $token);
        return Db::name('users')->where('token', $token)->find();
    }
}
