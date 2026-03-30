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
  const [balanceModal, setBalanceModal] = useState(null); // { customer, type: 'increase'|'decrease'|'set' }
  const [balanceForm, setBalanceForm] = useState({ type: 'increase', amount: '', remark: '' });
  const [balanceRecords, setBalanceRecords] = useState(null); // { customer, records: [] }

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('id_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

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

  // 搜索 + 排序 + 分页
  const filtered = customers.filter(c => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(c.id).includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      getLevelName(c.level_id).toLowerCase().includes(q) ||
      (debtsMap[c.id] && '待支付'.includes(q)) ||
      (!debtsMap[c.id] && '已结清'.includes(q))
    );
  }).sort((a, b) => {
    const aDebt = debtsMap[a.id]?.total_owed || 0;
    const bDebt = debtsMap[b.id]?.total_owed || 0;
    const aBal = parseFloat(a.balance) || 0;
    const bBal = parseFloat(b.balance) || 0;
    switch (sortKey) {
      case 'id_desc': return (b.id || 0) - (a.id || 0);
      case 'id_asc': return (a.id || 0) - (b.id || 0);
      case 'name_asc': return (a.name || '').localeCompare(b.name || '');
      case 'name_desc': return (b.name || '').localeCompare(a.name || '');
      case 'balance_desc': return bBal - aBal || (b.id || 0) - (a.id || 0);
      case 'balance_asc': return aBal - bBal || (a.id || 0) - (b.id || 0);
      case 'debt_desc': return bDebt - aDebt || (b.id || 0) - (a.id || 0);
      case 'debt_asc': return aDebt - bDebt || (a.id || 0) - (b.id || 0);
      case 'has_debt': return (bDebt > 0 ? 1 : 0) - (aDebt > 0 ? 1 : 0) || (b.id || 0) - (a.id || 0);
      default: return 0;
    }
  });

  // Reset page on search/sort change
  useEffect(() => { setCurrentPage(1); }, [search, sortKey]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  // 余额操作
  const openBalanceModal = (customer) => {
    setBalanceForm({ type: 'increase', amount: '', remark: '' });
    setBalanceModal({ customer });
  };
  const handleBalanceSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiPost(`/customer/balance/${balanceModal.customer.id}`, balanceForm);
      if (res.code === 200) {
        showToast('success', '操作成功', `余额已更新为 ${fmt(res.data?.balance)}`);
        setBalanceModal(null);
        fetchCustomers();
      } else {
        showToast('error', '操作失败', res.message);
      }
    } catch (err) {
      showToast('error', '操作失败', err.message);
    } finally {
      setSaving(false);
    }
  };

  // 余额记录
  const openBalanceRecords = async (customer) => {
    try {
      const res = await apiGet(`/customer/balance-records/${customer.id}`);
      setBalanceRecords({ customer, records: res.data || [] });
    } catch (err) {
      showToast('error', '加载失败', err.message);
    }
  };

  const typeLabels = {
    increase: { text: '充值', color: '#10b981' },
    decrease: { text: '扣减', color: '#ef4444' },
    order_deduct: { text: '订单抵扣', color: '#f59e0b' },
    order_refund: { text: '订单退回', color: '#3b82f6' },
    set: { text: '设定余额', color: '#8b5cf6' },
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
          {/* 搜索 + 排序 */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
              <input
                type="text"
                placeholder="搜索客户名/电话/地址/等级..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none' }}
              />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lighter)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
            </div>
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="id_desc">ID 新→旧</option>
              <option value="id_asc">ID 旧→新</option>
              <option value="name_asc">名称 A→Z</option>
              <option value="name_desc">名称 Z→A</option>
              <option value="balance_desc">余额 高→低</option>
              <option value="balance_asc">余额 低→高</option>
              <option value="debt_desc">待付 高→低</option>
              <option value="debt_asc">待付 低→高</option>
              <option value="has_debt">有待付优先</option>
            </select>
          </div>

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
                  <th>待支付</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 && (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">{search ? '🔍' : '👥'}</div><div className="empty-state-text">{search ? `未找到 "${search}" 相关客户` : '暂无客户数据'}</div></div></td></tr>
                )}
                {paged.map(c => {
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
                          <span
                            style={{ fontWeight: 600, color: parseFloat(c.balance) > 0 ? 'var(--primary)' : 'var(--text-lighter)', cursor: 'pointer', fontSize: 13 }}
                            onClick={() => openBalanceRecords(c)}
                            title="点击查看余额记录"
                          >
                            {fmt(c.balance || 0)}
                          </span>
                        </td>
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
                            (c.order_count || 0) > 0
                              ? <span style={{ color: 'var(--success, #10b981)', fontSize: 12, fontWeight: 500 }}>已结清</span>
                              : <span style={{ color: 'var(--text-lighter)', fontSize: 12 }}>-</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap' }}>
                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => openBalanceModal(c)}>充值</button>
                            <button className="btn" style={{ padding: '4px 8px', fontSize: 11, borderColor: '#8b5cf6', color: '#8b5cf6' }} onClick={() => openBalanceRecords(c)}>记录</button>
                            <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => openEditCustomer(c)}>编辑</button>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setDeleteConfirm({ target: 'customer', id: c.id })}>删除</button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && debt && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, background: '#fef2f2' }}>
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
                                      实收 {fmt(o.actual_amount)} - 已抵扣 {fmt(o.prepaid_amount)}
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

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '16px 0', flexWrap: 'wrap' }}>
              <button className="btn" style={{ padding: '4px 12px', fontSize: 12 }} disabled={currentPage <= 1} onClick={() => setCurrentPage(1)}>首页</button>
              <button className="btn" style={{ padding: '4px 12px', fontSize: 12 }} disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? <span key={`e${i}`} style={{ color: 'var(--text-lighter)', fontSize: 12 }}>...</span> :
                  <button key={p} className="btn" style={{ padding: '4px 10px', fontSize: 12, fontWeight: p === currentPage ? 700 : 400, background: p === currentPage ? 'var(--primary)' : undefined, color: p === currentPage ? '#fff' : undefined }} onClick={() => setCurrentPage(p)}>{p}</button>
                )}
              <button className="btn" style={{ padding: '4px 12px', fontSize: 12 }} disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>下一页</button>
              <button className="btn" style={{ padding: '4px 12px', fontSize: 12 }} disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>末页</button>
              <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 8 }}>共 {filtered.length} 条</span>
              <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 4 }}>跳至</span>
              <input
                type="number" min={1} max={totalPages}
                style={{ width: 48, padding: '3px 6px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center', outline: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) { setCurrentPage(v); e.target.value = ''; } } }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>页</span>
            </div>
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

      {/* 余额操作弹窗 */}
      {balanceModal && (
        <div className="modal-overlay" onClick={() => setBalanceModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 余额操作 — {balanceModal.customer.name}</h3>
              <button className="close-btn" onClick={() => setBalanceModal(null)}>×</button>
            </div>
            <div style={{ padding: '0 24px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>当前余额：</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{fmt(balanceModal.customer.balance || 0)}</span>
            </div>
            <form onSubmit={handleBalanceSubmit} style={{ padding: '0 24px 24px' }}>
              <div className="form-group">
                <label>操作类型</label>
                <select value={balanceForm.type} onChange={e => setBalanceForm({ ...balanceForm, type: e.target.value })}>
                  <option value="increase">充值（增加余额）</option>
                  <option value="decrease">扣减（减少余额）</option>
                  <option value="set">直接设定余额</option>
                </select>
              </div>
              <div className="form-group">
                <label>{balanceForm.type === 'set' ? '设定余额为' : '金额'} <span style={{ color: '#e74c3c' }}>*</span></label>
                <input
                  type="number" step="0.01" min="0" required
                  placeholder={balanceForm.type === 'set' ? '输入新余额' : '输入金额'}
                  value={balanceForm.amount}
                  onChange={e => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>备注</label>
                <input
                  type="text"
                  placeholder="可选，例如：客户预存款"
                  value={balanceForm.remark}
                  onChange={e => setBalanceForm({ ...balanceForm, remark: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                {saving ? '处理中...' : '确认'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 余额记录弹窗 */}
      {balanceRecords && (
        <div className="modal-overlay" onClick={() => setBalanceRecords(null)}>
          <div className="modal-content" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📜 余额记录 — {balanceRecords.customer.name}</h3>
              <button className="close-btn" onClick={() => setBalanceRecords(null)}>×</button>
            </div>
            <div style={{ padding: '0 24px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>当前余额：</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{fmt(balanceRecords.customer.balance || 0)}</span>
            </div>
            <div style={{ padding: '0 24px 24px', maxHeight: 420, overflowY: 'auto' }}>
              {balanceRecords.records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-light)' }}>暂无余额记录</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {balanceRecords.records.map(r => {
                    const tl = typeLabels[r.type] || { text: r.type, color: '#666' };
                    const isPositive = ['increase', 'order_refund'].includes(r.type) || (r.type === 'set' && r.balance_after > r.balance_before);
                    return (
                      <div key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        background: 'var(--bg)', borderRadius: 8, fontSize: 13,
                      }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: tl.color + '18', color: tl.color, whiteSpace: 'nowrap',
                        }}>{tl.text}</span>
                        <span style={{ fontWeight: 700, color: isPositive ? '#10b981' : '#ef4444', minWidth: 70, whiteSpace: 'nowrap' }}>
                          {isPositive ? '+' : '-'}{fmt(r.amount)}
                        </span>
                        <span style={{ flex: 1, color: 'var(--text-light)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.remark || '-'}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-lighter)', whiteSpace: 'nowrap' }}>
                          余额 {fmt(r.balance_after)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-lighter)', whiteSpace: 'nowrap' }}>
                          {(r.created_at || '').slice(0, 16)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerPage;
