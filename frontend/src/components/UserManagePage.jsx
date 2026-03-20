import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '../api';
import { useToast } from './Toast';

const MODULE_LIST = [
  { key: 'products', label: '📦 商品模块' },
  { key: 'customers', label: '👥 客户管理' },
  { key: 'suppliers', label: '🏭 制作厂家管理' },
  { key: 'sales', label: '💰 客户清单' },
  { key: 'purchase', label: '📥 合作制作厂家' },
  { key: 'stats', label: '📊 数据统计' },
];

export default function UserManagePage() {
  const showToast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPerms, setEditingPerms] = useState(null); // user id being edited
  const [permData, setPermData] = useState({});
  const [resetPwUser, setResetPwUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = useCallback(() => {
    setLoading(true);
    apiGet('/auth/users')
      .then(res => {
        if (res.code === 200) setUsers(res.data || []);
        else showToast('error', '加载失败', res.message);
      })
      .catch(err => showToast('error', '加载失败', err.message))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Add user
  const AddUserModal = () => {
    const [form, setForm] = useState({ username: '', password: '', nickname: '' });
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
      if (!form.username || !form.password) {
        showToast('warning', '提示', '用户名和密码不能为空');
        return;
      }
      setSaving(true);
      try {
        const res = await apiPost('/auth/register', form);
        if (res.code === 200) {
          showToast('success', '创建成功');
          setShowAddModal(false);
          fetchUsers();
        } else {
          showToast('error', '创建失败', res.message);
        }
      } catch (err) {
        showToast('error', '创建失败', err.message);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
        <div className="modal-content" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
          <h3 style={{ marginBottom: 20 }}>添加新用户</h3>
          <div className="form-group">
            <label>用户名 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="text" placeholder="输入用户名" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label>密码 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="password" placeholder="输入密码（至少6位）" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label>昵称</label>
            <input type="text" placeholder="输入昵称（可选）" value={form.nickname}
              onChange={e => setForm({ ...form, nickname: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn" onClick={() => setShowAddModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? '创建中...' : '创建用户'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Toggle permission
  const togglePerm = (key) => {
    setPermData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePerms = async (userId) => {
    try {
      const res = await apiPost('/auth/update-permissions', { user_id: userId, permissions: permData });
      if (res.code === 200) {
        showToast('success', '权限已更新');
        setEditingPerms(null);
        fetchUsers();
      } else {
        showToast('error', '更新失败', res.message);
      }
    } catch (err) {
      showToast('error', '更新失败', err.message);
    }
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const label = newRole === 'admin' ? '管理员' : '普通用户';
    if (!window.confirm(`确定要将该用户设为「${label}」？`)) return;
    try {
      const res = await apiPost('/auth/update-role', { user_id: userId, role: newRole });
      if (res.code === 200) {
        showToast('success', res.message);
        fetchUsers();
      } else {
        showToast('error', '操作失败', res.message);
      }
    } catch (err) {
      showToast('error', '操作失败', err.message);
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    const action = currentStatus === 1 ? '禁用' : '启用';
    if (!window.confirm(`确定要${action}该用户？`)) return;
    try {
      const res = await apiPost('/auth/update-status', { user_id: userId, status: currentStatus === 1 ? 0 : 1 });
      if (res.code === 200) {
        showToast('success', res.message);
        fetchUsers();
      } else {
        showToast('error', '操作失败', res.message);
      }
    } catch (err) {
      showToast('error', '操作失败', err.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('确定要删除该用户？此操作不可恢复！')) return;
    try {
      const res = await apiDelete(`/auth/user/${userId}`);
      if (res.code === 200) {
        showToast('success', '用户已删除');
        fetchUsers();
      } else {
        showToast('error', '删除失败', res.message);
      }
    } catch (err) {
      showToast('error', '删除失败', err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast('warning', '提示', '密码长度至少6位');
      return;
    }
    try {
      const res = await apiPost('/auth/reset-password', { user_id: resetPwUser.id, new_password: newPassword });
      if (res.code === 200) {
        showToast('success', '密码已重置');
        setResetPwUser(null);
        setNewPassword('');
      } else {
        showToast('error', '重置失败', res.message);
      }
    } catch (err) {
      showToast('error', '重置失败', err.message);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>👤 用户权限管理</h2>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ 添加用户</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>昵称</th>
            <th>角色</th>
            <th>权限模块</th>
            <th>状态</th>
            <th>最后登录</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => {
            const isEditing = editingPerms === user.id;
            const perms = isEditing ? permData : (user.permissions || {});
            return (
              <tr key={user.id} style={{ opacity: user.status === 0 ? 0.5 : 1 }}>
                <td>{user.id}</td>
                <td style={{ fontWeight: 600 }}>{user.username}</td>
                <td>{user.nickname || '-'}</td>
                <td>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: user.role === 'admin' ? '#eef2ff' : '#f7fafc',
                    color: user.role === 'admin' ? '#4f46e5' : '#718096',
                  }}>
                    {user.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </td>
                <td style={{ maxWidth: 260 }}>
                  {user.role === 'admin' ? (
                    <span style={{ fontSize: 12, color: 'var(--success)' }}>全部权限</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {MODULE_LIST.map(m => {
                        const hasP = !!perms[m.key];
                        return (
                          <span
                            key={m.key}
                            onClick={isEditing ? () => togglePerm(m.key) : undefined}
                            style={{
                              padding: '2px 8px', borderRadius: 4, fontSize: 11,
                              cursor: isEditing ? 'pointer' : 'default',
                              background: hasP ? '#dcfce7' : '#f1f5f9',
                              color: hasP ? '#166534' : '#94a3b8',
                              border: isEditing ? '1px dashed ' + (hasP ? '#16a34a' : '#cbd5e1') : '1px solid transparent',
                              transition: 'all 0.15s',
                              userSelect: 'none',
                            }}
                          >
                            {hasP ? '✓' : '✗'} {m.label.split(' ')[1]}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 12,
                    background: user.status === 1 ? '#dcfce7' : '#fee2e2',
                    color: user.status === 1 ? '#166534' : '#991b1b',
                  }}>
                    {user.status === 1 ? '正常' : '禁用'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-light)' }}>{user.last_login || '-'}</td>
                <td>
                  {(() => {
                    // Get current logged-in user
                    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
                    const isSelf = user.id === currentUser.id;
                    if (isSelf) return <span style={{ fontSize: 12, color: 'var(--text-light)' }}>当前账号</span>;
                    return (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {isEditing ? (
                        <>
                          <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => savePerms(user.id)}>保存</button>
                          <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => setEditingPerms(null)}>取消</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn"
                            style={{
                              padding: '4px 10px', fontSize: 12,
                              background: user.role === 'admin' ? '#fef3c7' : '#eef2ff',
                              color: user.role === 'admin' ? '#92400e' : '#4f46e5',
                              borderColor: user.role === 'admin' ? '#fbbf24' : '#818cf8',
                            }}
                            onClick={() => toggleRole(user.id, user.role)}
                          >
                            {user.role === 'admin' ? '降为普通用户' : '升为管理员'}
                          </button>
                          {user.role !== 'admin' && (
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => { setEditingPerms(user.id); setPermData(user.permissions || {}); }}>
                              权限
                            </button>
                          )}
                          <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => setResetPwUser(user)}>
                            重置密码
                          </button>
                          <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => toggleStatus(user.id, user.status)}>
                            {user.status === 1 ? '禁用' : '启用'}
                          </button>
                          {user.role !== 'admin' && (
                            <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => deleteUser(user.id)}>删除</button>
                          )}
                        </>
                      )}
                    </div>
                    );
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showAddModal && <AddUserModal />}

      {resetPwUser && (
        <div className="modal-overlay" onClick={() => { setResetPwUser(null); setNewPassword(''); }}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => { setResetPwUser(null); setNewPassword(''); }}>&times;</button>
            <h3 style={{ marginBottom: 16 }}>重置密码</h3>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
              为用户 <strong>{resetPwUser.username}</strong> 设置新密码
            </p>
            <div className="form-group">
              <label>新密码 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="password" placeholder="输入新密码（至少6位）"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn" onClick={() => { setResetPwUser(null); setNewPassword(''); }}>取消</button>
              <button className="btn btn-primary" onClick={handleResetPassword}>确认重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
