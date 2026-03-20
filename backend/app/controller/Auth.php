<?php
namespace app\controller;

use app\BaseController;
use think\facade\Db;

class Auth extends BaseController
{
    // 登录
    public function login()
    {
        $data = $this->request->post();
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            return json(['code' => 400, 'message' => '用户名和密码不能为空']);
        }

        $user = Db::name('users')->where('username', $username)->find();
        if (!$user) {
            return json(['code' => 400, 'message' => '用户名或密码错误']);
        }

        if (!password_verify($password, $user['password'])) {
            return json(['code' => 400, 'message' => '用户名或密码错误']);
        }

        if ($user['status'] != 1) {
            return json(['code' => 403, 'message' => '账号已被禁用']);
        }

        // Generate simple token
        $token = md5($user['id'] . time() . uniqid());
        Db::name('users')->where('id', $user['id'])->update([
            'token' => $token,
            'last_login' => date('Y-m-d H:i:s'),
        ]);

        return json([
            'code' => 200,
            'message' => '登录成功',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'nickname' => $user['nickname'] ?: $user['username'],
                    'role' => $user['role'],
                    'permissions' => json_decode($user['permissions'] ?: '{}', true),
                ],
            ],
        ]);
    }

    // 注册（仅admin可用，或首次无用户时可注册）
    public function register()
    {
        $data = $this->request->post();
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        $nickname = $data['nickname'] ?? '';

        if (empty($username) || empty($password)) {
            return json(['code' => 400, 'message' => '用户名和密码不能为空']);
        }

        if (strlen($password) < 6) {
            return json(['code' => 400, 'message' => '密码长度至少6位']);
        }

        // Check if username exists
        $exists = Db::name('users')->where('username', $username)->find();
        if ($exists) {
            return json(['code' => 400, 'message' => '用户名已存在']);
        }

        // If no users exist yet, first user is admin
        $userCount = Db::name('users')->count();
        $role = $userCount === 0 ? 'admin' : 'user';

        // If not first user, check if current request has admin token
        if ($userCount > 0) {
            $token = $this->request->header('Authorization', '');
            $token = str_replace('Bearer ', '', $token);
            if ($token) {
                $currentUser = Db::name('users')->where('token', $token)->find();
                if (!$currentUser || $currentUser['role'] !== 'admin') {
                    return json(['code' => 403, 'message' => '只有管理员可以创建新账号']);
                }
            } else {
                return json(['code' => 403, 'message' => '只有管理员可以创建新账号']);
            }
        }

        // Default permissions - admin gets all, users get none
        $defaultPerms = [
            'products' => $role === 'admin',
            'customers' => $role === 'admin',
            'suppliers' => $role === 'admin',
            'sales' => $role === 'admin',
            'purchase' => $role === 'admin',
            'stats' => $role === 'admin',
        ];

        $id = Db::name('users')->insertGetId([
            'username' => $username,
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'nickname' => $nickname ?: $username,
            'role' => $role,
            'permissions' => json_encode($defaultPerms),
            'status' => 1,
            'token' => '',
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        return json([
            'code' => 200,
            'message' => $role === 'admin' ? '管理员账号创建成功' : '账号创建成功',
            'data' => ['id' => $id, 'role' => $role],
        ]);
    }

    // 获取当前用户信息
    public function info()
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return json(['code' => 401, 'message' => '未登录或登录已过期']);
        }

        return json([
            'code' => 200,
            'data' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'nickname' => $user['nickname'],
                'role' => $user['role'],
                'permissions' => json_decode($user['permissions'] ?: '{}', true),
            ],
        ]);
    }

    // 退出登录
    public function logout()
    {
        $user = $this->getAuthUser();
        if ($user) {
            Db::name('users')->where('id', $user['id'])->update(['token' => '']);
        }
        return json(['code' => 200, 'message' => '已退出登录']);
    }

    // 获取用户列表（仅admin）
    public function userList()
    {
        $user = $this->getAuthUser();
        if (!$user || $user['role'] !== 'admin') {
            return json(['code' => 403, 'message' => '权限不足']);
        }

        $users = Db::name('users')
            ->field('id, username, nickname, role, permissions, status, last_login, created_at')
            ->order('id', 'asc')
            ->select()
            ->toArray();

        foreach ($users as &$u) {
            $u['permissions'] = json_decode($u['permissions'] ?: '{}', true);
        }

        return json(['code' => 200, 'data' => $users]);
    }

    // 更新用户权限（仅admin）
    public function updatePermissions()
    {
        $currentUser = $this->getAuthUser();
        if (!$currentUser || $currentUser['role'] !== 'admin') {
            return json(['code' => 403, 'message' => '权限不足']);
        }

        $data = $this->request->post();
        $userId = $data['user_id'] ?? 0;
        $permissions = $data['permissions'] ?? [];

        $targetUser = Db::name('users')->where('id', $userId)->find();
        if (!$targetUser) {
            return json(['code' => 404, 'message' => '用户不存在']);
        }

        if ($targetUser['role'] === 'admin') {
            return json(['code' => 400, 'message' => '不能修改管理员权限']);
        }

        Db::name('users')->where('id', $userId)->update([
            'permissions' => json_encode($permissions),
        ]);

        return json(['code' => 200, 'message' => '权限更新成功']);
    }

    // 更新用户角色（仅admin）
    public function updateRole()
    {
        $currentUser = $this->getAuthUser();
        if (!$currentUser || $currentUser['role'] !== 'admin') {
            return json(['code' => 403, 'message' => '权限不足']);
        }

        $data = $this->request->post();
        $userId = $data['user_id'] ?? 0;
        $role = $data['role'] ?? 'user';

        if (!in_array($role, ['admin', 'user'])) {
            return json(['code' => 400, 'message' => '无效的角色']);
        }

        $targetUser = Db::name('users')->where('id', $userId)->find();
        if (!$targetUser) {
            return json(['code' => 404, 'message' => '用户不存在']);
        }

        if ($targetUser['id'] == $currentUser['id']) {
            return json(['code' => 400, 'message' => '不能修改自己的角色']);
        }

        $updateData = ['role' => $role];

        // 如果升级为admin，自动给全部权限
        if ($role === 'admin') {
            $updateData['permissions'] = json_encode([
                'products' => true,
                'customers' => true,
                'suppliers' => true,
                'sales' => true,
                'purchase' => true,
                'stats' => true,
            ]);
        }

        Db::name('users')->where('id', $userId)->update($updateData);

        return json(['code' => 200, 'message' => $role === 'admin' ? '已设为管理员' : '已设为普通用户']);
    }

    // 更新用户状态（仅admin）
    public function updateStatus()
    {
        $currentUser = $this->getAuthUser();
        if (!$currentUser || $currentUser['role'] !== 'admin') {
            return json(['code' => 403, 'message' => '权限不足']);
        }

        $data = $this->request->post();
        $userId = $data['user_id'] ?? 0;
        $status = $data['status'] ?? 1;

        $targetUser = Db::name('users')->where('id', $userId)->find();
        if (!$targetUser) {
            return json(['code' => 404, 'message' => '用户不存在']);
        }

        if ($targetUser['id'] === $currentUser['id']) {
            return json(['code' => 400, 'message' => '不能禁用自己的账号']);
        }

        Db::name('users')->where('id', $userId)->update(['status' => $status]);

        // If disabled, clear token
        if ($status == 0) {
            Db::name('users')->where('id', $userId)->update(['token' => '']);
        }

        return json(['code' => 200, 'message' => $status == 1 ? '已启用' : '已禁用']);
    }

    // 删除用户（仅admin）
    public function deleteUser($id)
    {
        $currentUser = $this->getAuthUser();
        if (!$currentUser || $currentUser['role'] !== 'admin') {
            return json(['code' => 403, 'message' => '权限不足']);
        }

        $targetUser = Db::name('users')->where('id', $id)->find();
        if (!$targetUser) {
            return json(['code' => 404, 'message' => '用户不存在']);
        }

        if ($targetUser['role'] === 'admin') {
            return json(['code' => 400, 'message' => '不能删除管理员账号']);
        }

        Db::name('users')->where('id', $id)->delete();
        return json(['code' => 200, 'message' => '用户已删除']);
    }

    // 修改密码
    public function changePassword()
    {
        $currentUser = $this->getAuthUser();
        if (!$currentUser) {
            return json(['code' => 401, 'message' => '未登录']);
        }

        $data = $this->request->post();
        $oldPassword = $data['old_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';

        if (empty($oldPassword) || empty($newPassword)) {
            return json(['code' => 400, 'message' => '请输入旧密码和新密码']);
        }

        if (strlen($newPassword) < 6) {
            return json(['code' => 400, 'message' => '新密码长度至少6位']);
        }

        // Verify old password
        $user = Db::name('users')->where('id', $currentUser['id'])->find();
        if (!password_verify($oldPassword, $user['password'])) {
            return json(['code' => 400, 'message' => '旧密码错误']);
        }

        Db::name('users')->where('id', $currentUser['id'])->update([
            'password' => password_hash($newPassword, PASSWORD_DEFAULT),
        ]);

        return json(['code' => 200, 'message' => '密码修改成功']);
    }

    // Admin reset password for user
    public function resetPassword()
    {
        $currentUser = $this->getAuthUser();
        if (!$currentUser || $currentUser['role'] !== 'admin') {
            return json(['code' => 403, 'message' => '权限不足']);
        }

        $data = $this->request->post();
        $userId = $data['user_id'] ?? 0;
        $newPassword = $data['new_password'] ?? '';

        if (empty($newPassword) || strlen($newPassword) < 6) {
            return json(['code' => 400, 'message' => '新密码长度至少6位']);
        }

        $targetUser = Db::name('users')->where('id', $userId)->find();
        if (!$targetUser) {
            return json(['code' => 404, 'message' => '用户不存在']);
        }

        Db::name('users')->where('id', $userId)->update([
            'password' => password_hash($newPassword, PASSWORD_DEFAULT),
        ]);

        return json(['code' => 200, 'message' => '密码已重置']);
    }

    // Check if system has any users (for initial setup)
    public function checkSetup()
    {
        $count = Db::name('users')->count();
        return json(['code' => 200, 'data' => ['has_users' => $count > 0]]);
    }

    // Helper: get authenticated user from token
    private function getAuthUser()
    {
        $token = $this->request->header('Authorization', '');
        $token = str_replace('Bearer ', '', $token);
        if (empty($token)) return null;

        $user = Db::name('users')->where('token', $token)->where('status', 1)->find();
        return $user;
    }
}
