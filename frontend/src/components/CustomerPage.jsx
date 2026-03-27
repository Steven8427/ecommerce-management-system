import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import { useToast } from './Toast';

const fmt = v => '¥' + parseFloat(v || 0).toFixed(2);

const TYPE_LABELS = {
  manual_add: { text: '手动增加', color: '#27ae60' },
  manual_sub: { text: '手动减少', color: '#e74c3c' },
  manual_set: { text: '直接设定', color: '#f39c12' },
  order_deduct: { text: '订单扣款', color: '#8e44ad' },
};

function CustomerPage() {
  const showToast = useToast();
  const [tab, setTab] = useState('customers');

  const [customers, setCustomers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // 表单
  const [custForm, setCustForm] = useState({ name: '', phone: '', address: '', level_id: '' });
  const [levelForm, setLevelForm] = useState({ name: '', description: '' });

  // 余额操作
  const [balanceModal, setBalanceModal] = useState(null); // { customer, type: 'add'|'sub'|'set' }
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [balanceSaving, setBalanceSaving] = useState(false);

  // 余额记录
  const [recordsModal, setRecordsModal] = useState(null); // customer obj
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

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

  const getLevelName = (levelId) => {
    const level = levels.find(l => l.id === levelId);
    return level ? level.name : '-';
  };

  // 弹窗操作
  const openAddCustomer = () => {
    setCustForm({ name: '', phone: '', address: '', level_id: '' });
    setModal({ type: 'add', target: 'customer' });
  };
  const openEditCustomer = (c) => {
    setCustForm({ name: c.name, phone: c.phone || '', address: c.address || '', level_id: c.level_id || '' });
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

  // 保存客户
  const saveCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...custForm, level_id: custForm.level_id ? Number(custForm.level_id) : null };
      if (modal.type === 'add') {
        await apiPost('/customer/add', payload);
        showToast('success', '添加成功');
      } else {
        await apiPut(`/customer/update/${modal.data.id}`, payload);
        showToast('success', '编辑成功');
      }
      closeModal();
      await fetchCustomers();
    } catch (err) {
      showToast('error', '操作失败', err.message);
    } finally {
      setSaving(false);
    }
  };

  // 保存等级
  const saveLevel = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.type === 'add') {
        await apiPost('/customer/level/add', levelForm);
        showToast('success', '添加成功');
      } else {
        await apiPut(`/customer/level/update/${modal.data.id}`, levelForm);
        showToast('success', '编辑成功');
      }
      closeModal();
      await fetchLevels();
    } catch (err) {
      showToast('error', '操作失败', err.message);
    } finally {
      setSaving(false);
    }
  };

  // 删除
  const handleDelete = async () => {
    try {
      if (deleteConfirm.target === 'customer') {
        await apiDelete(`/customer/delete/${deleteConfirm.id}`);
        showToast('success', '删除成功');
        await fetchCustomers();
      } else {
        await apiDelete(`/customer/level/delete/${deleteConfirm.id}`);
        showToast('success', '删除成功');
        await fetchLevels();
      }
    } catch (err) {
      showToast('error', '删除失败', err.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ── 余额操作 ──
  const openBalanceModal = (customer, type) => {
    setBalanceModal({ customer, type });
    setBalanceAmount('');
    setBalanceReason('');
  };

  const submitBalance = async () => {
    const amt = parseFloat(balanceAmount);
    if (isNaN(amt) || amt < 0) {
      showToast('warning', '请输入有效金额');
      return;
    }
    setBalanceSaving(true);
    try {
      const typeMap = { add: 'manual_add', sub: 'manual_sub', set: 'manual_set' };
      const res = await apiPost('/balance/adjust', {
        customer_id: balanceModal.customer.id,
        type: typeMap[balanceModal.type],
        amount: amt,
        reason: balanceReason,
      });
      if (res.code === 200) {
        showToast('success', '操作成功');
        setBalanceModal(null);
        await fetchCustomers();
      } else {
        showToast('error', '操作失败', res.message);
      }
    } catch (err) {
      showToast('error', '操作失败', err.message);
    } finally {
      setBalanceSaving(false);
    }
  };

  // ── 余额记录 ──
  const openRecords = async (customer) => {
    setRecordsModal(customer);
    setRecordsLoading(true);
    try {
      const res = await apiGet(`/balance/records?customer_id=${customer.id}`);
      setRecords(res.data || []);
    } catch (err) {
      showToast('error', '加载失败', err.message);
    } finally {
      setRecordsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>👥 客户管理</h2>
        {tab === 'customers' && (
          <button className="btn btn-primary" onClick={openAddCustomer}>+ 添加客户</button>
        )}
        {tab === 'levels' && (
          <button className="btn btn-primary" onClick={openAddLevel}>+ 添加等级</button>
        )}
      </div>

      <div className="tabs">
        <button className={tab === 'customers' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('customers')}>
          客户列表 ({customers.length})
        </button>
        <button className={tab === 'levels' ? 'tab-btn active' : 'tab-btn'} onClick={() => setTab('levels')}>
          等级管理 ({levels.length})
        </button>
      </div>

      {/* ── 客户列表 ── */}
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
                  <th>地址</th>
                  <th>等级</th>
                  <th>余额</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">暂无客户数据</div></div></td></tr>
                )}
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.address || '-'}</td>
                    <td>{getLevelName(c.level_id)}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: parseFloat(c.balance || 0) >= 0 ? '#27ae60' : '#e74c3c',
                      }}>
                        {fmt(c.balance)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEditCustomer(c)}>编辑</button>
                        <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openBalanceModal(c, 'add')}>+金额</button>
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openBalanceModal(c, 'sub')}>-金额</button>
                        <button className="btn" style={{ padding: '4px 10px', fontSize: 12, background: '#fef3c7', color: '#92400e', borderColor: '#fbbf24' }} onClick={() => openBalanceModal(c, 'set')}>设定</button>
                        <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openRecords(c)}>记录</button>
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDeleteConfirm({ target: 'customer', id: c.id })}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ── 等级列表 ── */}
      {tab === 'levels' && (
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>等级名称</th><th>描述</th><th>操作</th></tr>
          </thead>
          <tbody>
            {levels.length === 0 && (
              <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">暂无等级数据</div></div></td></tr>
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
                <input value={custForm.name} onChange={e => setCustForm({ ...custForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>客户等级</label>
                <select value={custForm.level_id} onChange={e => setCustForm({ ...custForm, level_id: e.target.value })}>
                  <option value="">选择等级</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>电话</label>
                <input value={custForm.phone} onChange={e => setCustForm({ ...custForm, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>地址</label>
                <textarea value={custForm.address} onChange={e => setCustForm({ ...custForm, address: e.target.value })} rows={3} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
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
                <input value={levelForm.name} onChange={e => setLevelForm({ ...levelForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea value={levelForm.description} onChange={e => setLevelForm({ ...levelForm, description: e.target.value })} rows={3} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── 弹窗：余额操作 ── */}
      {balanceModal && (
        <div className="modal-overlay" onClick={() => setBalanceModal(null)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {balanceModal.type === 'add' && '增加金额'}
                {balanceModal.type === 'sub' && '减少金额'}
                {balanceModal.type === 'set' && '设定金额'}
                {' — '}{balanceModal.customer.name}
              </h3>
              <button className="close-btn" onClick={() => setBalanceModal(null)}>×</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>当前余额</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: parseFloat(balanceModal.customer.balance || 0) >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {fmt(balanceModal.customer.balance)}
                </div>
              </div>
              <div className="form-group">
                <label>
                  {balanceModal.type === 'add' && '增加金额'}
                  {balanceModal.type === 'sub' && '减少金额'}
                  {balanceModal.type === 'set' && '设定为金额'}
                  <span style={{ color: '#e74c3c' }}> *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  placeholder="输入金额"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>原因/备注</label>
                <textarea
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                  rows={2}
                  placeholder="输入操作原因..."
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={balanceSaving}
                onClick={submitBalance}
              >
                {balanceSaving ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 弹窗：余额记录 ── */}
      {recordsModal && (
        <div className="modal-overlay" onClick={() => setRecordsModal(null)}>
          <div className="modal-content" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>金额记录 — {recordsModal.name}</h3>
              <button className="close-btn" onClick={() => setRecordsModal(null)}>×</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>当前余额</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: parseFloat(recordsModal.balance || 0) >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {fmt(recordsModal.balance)}
                </div>
              </div>
              {recordsLoading ? (
                <div className="loading">加载中...</div>
              ) : records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-light)' }}>暂无记录</div>
              ) : (
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>时间</th>
                        <th>类型</th>
                        <th>变动</th>
                        <th>变动前</th>
                        <th>变动后</th>
                        <th>原因</th>
                        <th>操作人</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => {
                        const t = TYPE_LABELS[r.type] || { text: r.type, color: '#999' };
                        return (
                          <tr key={r.id}>
                            <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{r.created_at}</td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: t.color + '18', color: t.color }}>
                                {t.text}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: parseFloat(r.amount) >= 0 ? '#27ae60' : '#e74c3c' }}>
                              {parseFloat(r.amount) >= 0 ? '+' : ''}{fmt(r.amount)}
                            </td>
                            <td style={{ fontSize: 12 }}>{fmt(r.balance_before)}</td>
                            <td style={{ fontWeight: 600 }}>{fmt(r.balance_after)}</td>
                            <td style={{ fontSize: 12, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason}>
                              {r.reason || '-'}
                            </td>
                            <td style={{ fontSize: 12 }}>{r.operator_name || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 8 }}>确定要删除这条记录吗？</div>
              <div style={{ fontSize: 14, color: '#999' }}>此操作不可撤销。</div>
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10, justifyContent: 'center' }}>
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
