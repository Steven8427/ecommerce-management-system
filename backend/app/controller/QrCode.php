<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;

class QrCode extends BaseController
{
    public function __construct(\think\App $app)
    {
        parent::__construct($app);
        // 自动建表
        try {
            $tables = Db::query("SHOW TABLES LIKE 'qr_codes'");
            if (empty($tables)) {
                Db::execute("CREATE TABLE qr_codes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    name VARCHAR(100) NOT NULL DEFAULT '',
                    url VARCHAR(500) NOT NULL,
                    enabled TINYINT(1) NOT NULL DEFAULT 1,
                    sort_order INT NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            }
        } catch (\Exception $e) {}
    }

    // 获取当前用户的QR码列表
    public function list()
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return json(['code' => 401, 'message' => '未登录']);
        }

        $list = Db::name('qr_codes')
            ->where('user_id', $user['id'])
            ->order('sort_order', 'asc')
            ->order('id', 'asc')
            ->select()
            ->toArray();

        return json(['code' => 200, 'data' => $list]);
    }

    // 添加QR码
    public function add()
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return json(['code' => 401, 'message' => '未登录']);
        }

        $data = $this->request->post();
        if (empty($data['url'])) {
            return json(['code' => 400, 'message' => '请上传二维码图片']);
        }

        $id = Db::name('qr_codes')->insertGetId([
            'user_id' => $user['id'],
            'name' => $data['name'] ?? '',
            'url' => $data['url'],
            'enabled' => $data['enabled'] ?? 1,
            'sort_order' => $data['sort_order'] ?? 0,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        return json(['code' => 200, 'message' => '添加成功', 'data' => ['id' => $id]]);
    }

    // 更新QR码（名称、启用状态等）
    public function update()
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return json(['code' => 401, 'message' => '未登录']);
        }

        $id = $this->request->param('id');
        $qr = Db::name('qr_codes')->where('id', $id)->where('user_id', $user['id'])->find();
        if (!$qr) {
            return json(['code' => 404, 'message' => 'QR码不存在']);
        }

        $data = $this->request->post();
        $update = [];
        if (isset($data['name'])) $update['name'] = $data['name'];
        if (isset($data['enabled'])) $update['enabled'] = $data['enabled'] ? 1 : 0;
        if (isset($data['url'])) $update['url'] = $data['url'];

        if (!empty($update)) {
            Db::name('qr_codes')->where('id', $id)->update($update);
        }

        return json(['code' => 200, 'message' => '更新成功']);
    }

    // 删除QR码
    public function delete()
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return json(['code' => 401, 'message' => '未登录']);
        }

        $id = $this->request->param('id');
        $qr = Db::name('qr_codes')->where('id', $id)->where('user_id', $user['id'])->find();
        if (!$qr) {
            return json(['code' => 404, 'message' => 'QR码不存在']);
        }

        Db::name('qr_codes')->where('id', $id)->delete();
        return json(['code' => 200, 'message' => '删除成功']);
    }

    private function getAuthUser()
    {
        $token = $this->request->header('Authorization');
        if (!$token) return null;
        $token = str_replace('Bearer ', '', $token);
        return Db::name('users')->where('token', $token)->where('status', 1)->find();
    }
}
