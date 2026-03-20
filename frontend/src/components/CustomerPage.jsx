import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import { useToast } from './Toast';

// ── 客户管理页面（含客户等级管理）─────────────────────────────────────────

function CustomerPage() {
  const showToast = useToast();
  const [tab, setTab] = useState('customers'); // 'customers' | 'levels'

  // ── 客户状态 ──
  const [customers, setCustomers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // null | { type, target, data? }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null | { target, id }

  // ── 客户表单 ──
  const [custForm, setCustForm] = useState({ name: '', phone: '', email: '', address: '', level_id: '' });
  // ── 等级表单 ──
  const [levelForm, setLevelForm] = useState({ name: '', description: '' });

  // ── 数据加载 ──
  useEffect(() => { fetchCustomers(); fetchLevels(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/customer/list');
      setCustomers(res.data || res || []);
    } catch (err) {
      showToast('error', '加载失败', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const res = await apiGet('/customer/levels');
      setLevels(res.data || res || []);
    } catch (err) {
      showToast('error', '加载失败', err.message);
    }
  };

  // ── 查找等级名称 ──
  const getLevelName = (levelId) => {
    const level = levels.find(l => l.id === levelId);
    return level ? level.name : '-';
  };

  // ── 打开弹窗 ──
  const openAddCustomer = () => {
    setCustForm({ name: '', phone: '', email: '', address: '', level_id: '' });
    setModal({ type: 'add', target: 'customer' });
  };

  const openEditCustomer = (c) => {
    setCustForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', level_id: c.level_id || '' });
    setModal({ type: 'edit', target: 'customer', data: c });
  };

  const openAddLevel = () => {
    setLevelForm({ name: '', description: '' });
    setModal({ type: 'add', target: 'level' });
  };

  const openEditLevel = (l) => {
    setLevelForm({ name: l.name, description: l.description || '' });
    setModal({ type: 'edit', target: 'level', data: l });
  };

  const closeModal = () => setModal(null);

  // ── 保存客户 ──
  const saveCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...custForm, level_id: custForm.level_id ? Number(custForm.level_id) : null };
      if (modal.type === 'add') {
        await apiPost('/customer/add', payload);
        showToast('success', '添加成功', '客户已添加');
      } else {
        await apiPut(`/customer/update/${modal.data.id}`, payload);
        showToast('success', '编辑成功', '客户已更新');
      }
      closeModal();
      await fetchCustomers();
    } catch (err) {
      showToast('error', '操作失败', err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── 保存等级 ──
  const saveLevel = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === 'add') {
        await apiPost('/customer/level/add', levelForm);
        showToast('success', '添加成功', '客户等级已添加');
      } else {
        await apiPut(`/customer/level/update/${modal.data.id}`, levelForm);
        showToast('success', '编辑成功', '客户等级已更新');
      }
      closeModal();
      await fetchLevels();
    } catch (err) {
      showToast('error', '操作失败', err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── 删除 ──
  const handleDelete = async () => {
    try {
      if (deleteConfirm.target === 'customer') {
        await apiDelete(`/customer/delete/${deleteConfirm.id}`);
        showToast('success', '删除成功', '客户已删除');
        await fetchCustomers();
      } else {
        await apiDelete(`/customer/level/delete/${deleteConfirm.id}`);
        showToast('success', '删除成功', '客户等级已删除');
        await fetchLevels();
      }
    } catch (err) {
      showToast('error', '删除失败', err.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ── 渲染 ──
  return (
    <div className="page-container">

      {/* ── 页头 ── */}
      <div className="page-header">
        <h2>👥 客户管理</h2>
        {tab === 'customers' && (
          <button className="btn btn-primary" onClick={openAddCustomer}>+ 添加客户</button>
        )}
        {tab === 'levels' && (
          <button className="btn btn-primary" onClick={openAddLevel}>+ 添加等级</button>
        )}
      </div>

      {/* ── 选项卡 ── */}
      <div className="tabs">
        <button
          className={tab === 'customers' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('customers')}
        >
          客户列表 ({customers.length})
        </button>
        <button
          className={tab === 'levels' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setTab('levels')}
        >
          等级管理 ({levels.length})
        </button>
      </div>

      {/* ── Tab 1: 客户列表 ── */}
      {tab === 'customers' && (
        <>
          {loading && <div className="loading">加载中...</div>}
          {!loading && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>客户名称</th>
                  <th>电话</th>
                  <th>邮箱</th>
                  <th>地址</th>
                  <th>等级</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-text">暂无客户数据</div>
                      </div>
                    </td>
                  </tr>
                )}
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.address || '-'}</td>
                    <td>{getLevelName(c.level_id)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn" style={{ padding: '5px 14px', fontSize: 13 }} onClick={() => openEditCustomer(c)}>编辑</button>
                        <button className="btn btn-danger" style={{ padding: '5px 14px', fontSize: 13 }} onClick={() => setDeleteConfirm({ target: 'customer', id: c.id })}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ── Tab 2: 客户等级列表 ── */}
      {tab === 'levels' && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>等级名称</th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {levels.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div className="empty-state-text">暂无等级数据</div>
                  </div>
                </td>
              </tr>
            )}
            {levels.map(l => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.name}</td>
                <td>{l.description || '-'}</td>
                <td>
                  <div className="action-btns">
                    <button className="btn" style={{ padding: '5px 14px', fontSize: 13 }} onClick={() => openEditLevel(l)}>编辑</button>
                    <button className="btn btn-danger" style={{ padding: '5px 14px', fontSize: 13 }} onClick={() => setDeleteConfirm({ target: 'level', id: l.id })}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── 弹窗：添加/编辑客户 ── */}
      {modal && modal.target === 'customer' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.type === 'add' ? '添加客户' : `编辑客户 #${modal.data.id}`}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={saveCustomer}>
              <div className="form-group">
                <label>客户名称 <span style={{ color: '#e74c3c' }}>*</span></label>
                <input
                  value={custForm.name}
                  onChange={e => setCustForm({ ...custForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>客户等级</label>
                <select
                  value={custForm.level_id}
                  onChange={e => setCustForm({ ...custForm, level_id: e.target.value })}
                >
                  <option value="">选择等级</option>
                  {levels.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>电话</label>
                <input
                  value={custForm.phone}
                  onChange={e => setCustForm({ ...custForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>邮箱</label>
                <input
                  type="email"
                  value={custForm.email}
                  onChange={e => setCustForm({ ...custForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>地址</label>
                <textarea
                  value={custForm.address}
                  onChange={e => setCustForm({ ...custForm, address: e.target.value })}
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── 弹窗：添加/编辑等级 ── */}
      {modal && modal.target === 'level' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.type === 'add' ? '添加客户等级' : `编辑客户等级 #${modal.data.id}`}</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={saveLevel}>
              <div className="form-group">
                <label>等级名称 <span style={{ color: '#e74c3c' }}>*</span></label>
                <input
                  value={levelForm.name}
                  onChange={e => setLevelForm({ ...levelForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={levelForm.description}
                  onChange={e => setLevelForm({ ...levelForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── 删除确认 ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#e74c3c' }}>确认删除</h3>
              <button className="close-btn" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                确定要删除这条记录吗？
              </div>
              <div style={{ fontSize: 14, color: '#999' }}>
                此操作不可撤销，删除后数据将无法恢复。
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px', display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setDeleteConfirm(null)}>取消</button>
              <button className="btn btn-danger" onClick={handleDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerPage;
