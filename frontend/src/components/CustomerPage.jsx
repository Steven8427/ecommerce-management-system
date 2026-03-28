import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import { useToast } from './Toast';

const fmt = v => '¥' + parseFloat(v || 0).toFixed(2);

function CustomerPage({ onNavigateToOrder }) {
  const showToast = useToast();
  const [tab, setTab] = useState('customers');

  const [customers, setCustomers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [debtsMap, setDebtsMap] = useState({});
  const [expandedDebt, setExpandedDebt] = useState(null);

  const [custForm, setCustForm] = useState({ name: '', phone: '', address: '', level_id: '' });
  const [levelForm, setLevelForm] = useState({ name: '', description: '' });

  useEffect(() => { fetchCustomers(); fetchLevels(); fetchDebts(); // eslint-disable-next-line
  }, []);

  const containerRef = useRef(null);
  useEffect(() => {
    const fn = fetchCustomers;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { fn(); fetchDebts(); } },
      { threshold: 0.1 }
    );
    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
    // eslint-disable-next-line
  }, []);

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

  const fetchDebts = async () => {
    try {
      const res = await apiGet('/customer/debts');
      const list = res.data || [];
      const map = {};
      list.forEach(item => { map[item.customer_id] = item; });
      setDebtsMap(map);
    } catch (err) {
      // silently fail — debts are supplementary info
    }
  };

  const getLevelName = (levelId) => {
    const level = levels.find(l => l.id === levelId);
    return level ? level.name : '-';
  };

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

  return (
    <div className="page-container" ref={containerRef}>
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

      {/* 客户列表 */}
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
                  <th>待支付</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">暂无客户数据</div></div></td></tr>
                )}
                {customers.map(c => {
                  const debt = debtsMap[c.id];
                  const isExpanded = expandedDebt === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <tr style={debt ? { background: isExpanded ? 'var(--primary-bg, #eef2ff)' : undefined } : undefined}>
                        <td>{c.id}</td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.phone || '-'}</td>
                        <td>{c.address || '-'}</td>
                        <td>{getLevelName(c.level_id)}</td>
                        <td>
                          {debt ? (
                            <button
                              onClick={() => setExpandedDebt(isExpanded ? null : c.id)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '3px 10px', border: 'none', borderRadius: 20,
                                background: isExpanded ? 'var(--danger, #ef4444)' : '#fef2f2',
                                color: isExpanded ? '#fff' : '#dc2626',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              <span style={{ fontSize: 11 }}>⚠</span>
                              {fmt(debt.total_owed)}
                              <span style={{ fontSize: 10, opacity: 0.8 }}>({debt.orders.length}单)</span>
                              <span style={{ fontSize: 10, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--success, #10b981)', fontSize: 12, fontWeight: 500 }}>已结清</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEditCustomer(c)}>编辑</button>
                            <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDeleteConfirm({ target: 'customer', id: c.id })}>删除</button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && debt && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, background: '#fef2f2' }}>
                            <div style={{ padding: '12px 20px 16px' }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>📋</span> {c.name} 的待支付明细 — 共计 {fmt(debt.total_owed)}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {debt.orders.map(o => (
                                  <div key={o.order_id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', background: '#fff', borderRadius: 8,
                                    border: '1px solid #fecaca',
                                    fontSize: 13,
                                  }}>
                                    <span style={{ color: 'var(--text-lighter)', fontSize: 12, whiteSpace: 'nowrap' }}>#{o.order_id}</span>
                                    <span style={{ color: 'var(--text-light)', fontSize: 12, whiteSpace: 'nowrap' }}>{(o.order_date || '').slice(0, 10)}</span>
                                    <span style={{ flex: 1, color: 'var(--text)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {o.item_names || o.description || '-'}
                                    </span>
                                    <span style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                                      实收 {fmt(o.actual_amount)} - 已付 {fmt(o.prepaid_amount)}
                                    </span>
                                    <span style={{ fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right' }}>
                                      待付 {fmt(o.owed)}
                                    </span>
                                    <button
                                      onClick={() => onNavigateToOrder && onNavigateToOrder(o.order_id)}
                                      style={{
                                        padding: '3px 10px', border: '1px solid var(--primary, #4f46e5)',
                                        borderRadius: 5, background: 'transparent',
                                        color: 'var(--primary, #4f46e5)', fontSize: 11, fontWeight: 600,
                                        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                                      }}
                                      onMouseEnter={e => { e.target.style.background = 'var(--primary, #4f46e5)'; e.target.style.color = '#fff'; }}
                                      onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--primary, #4f46e5)'; }}
                                    >
                                      查看订单
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* 等级列表 */}
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

      {/* 弹窗：添加/编辑客户 */}
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

      {/* 弹窗：添加/编辑等级 */}
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

      {/* 删除确认 */}
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
