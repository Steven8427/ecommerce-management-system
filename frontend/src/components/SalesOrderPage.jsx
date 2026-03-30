import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiPost, apiDelete, apiUpload } from '../api';
import { useToast } from './Toast';

const fmt = v => '\u00a5' + parseFloat(v || 0).toFixed(2);

const DEFAULT_UNITS = ['平方米', '米', '块', '个'];

const createEmptyItem = () => ({
  _id: Date.now() + Math.random(),
  _isNew: true,
  item_date: (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); })(),
  name: '',
  unit: '',
  width: '',
  height: '',
  quantity: 1,
  unit_price: '',
  customer_price: '',
  cost_details: [],
  materials: [],
  content: '',
  remark: '',
  image: '',
});

const calcArea = (item) => {
  return (parseFloat(item.width) || 0) * (parseFloat(item.height) || 0);
};

const calcAmount = (item) => {
  const price = parseFloat(item.unit_price) || 0;
  const qty = parseInt(item.quantity) || 0;
  const w = parseFloat(item.width) || 0;
  const h = parseFloat(item.height) || 0;
  switch (item.unit) {
    case '平方米': return w * h * price * qty;
    case '米': return price * w * qty;
    case '块':
    case '个':
    default: return price * qty;
  }
};

const calcCostPrice = (item) => {
  return (item.cost_details || []).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
};

const getItemTotal = (item) => {
  const cp = parseFloat(item.customer_price);
  return cp > 0 ? cp : calcAmount(item);
};

// ============================================================================
// 客户搜索选择器
// ============================================================================
function CustomerSelector({ customers, value, onChange, onRefresh }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = customers.find(c => String(c.id) === String(value));
  const filtered = search.trim()
    ? customers.filter(c =>
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
      )
    : customers;

  return (
    <div className="form-group" ref={ref} style={{ position: 'relative' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>选择客户 <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span></span>
        <button
          type="button"
          onClick={() => { onRefresh(); }}
          style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', fontSize: 12, padding: 0 }}
        >
          🔄 刷新列表
        </button>
      </label>
      <div
        onClick={() => { setOpen(!open); if (!open) { setSearch(''); onRefresh(); } }}
        style={{
          padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', background: 'var(--white)', fontSize: 14,
          color: selected ? 'var(--text)' : 'var(--text-lighter)',
        }}
      >
        {selected ? `${selected.name}${selected.phone ? ' - ' + selected.phone : ''}` : '请选择客户'}
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)', maxHeight: 280, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索客户名称/电话..."
              style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 4 }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ overflow: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-light)', fontSize: 13 }}>
                无匹配客户
              </div>
            ) : (
              filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => { onChange(String(c.id)); setOpen(false); }}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                    background: String(c.id) === String(value) ? 'var(--bg)' : 'transparent',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = String(c.id) === String(value) ? 'var(--bg)' : 'transparent'}
                >
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{c.phone || ''}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// QR Code Management Modal
// ============================================================================
function QRCodeManagerModal({ onClose, onUpdate }) {
  const showToast = useToast();
  const [qrcodes, setQrcodes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  useEffect(() => {
    apiGet('/qrcode/list').then(res => {
      if (res.code === 200) setQrcodes(res.data || []);
    }).catch(() => {});
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!newName.trim()) {
      showToast('warning', '提示', '请先输入二维码名称');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const uploadRes = await apiUpload('/upload/image', file);
      if (uploadRes.code === 200 && uploadRes.data?.url) {
        const res = await apiPost('/qrcode/add', { name: newName.trim(), url: uploadRes.data.url });
        if (res.code === 200) {
          const listRes = await apiGet('/qrcode/list');
          const updated = listRes.data || [];
          setQrcodes(updated);
          onUpdate(updated);
          setNewName('');
          showToast('success', '添加成功');
        } else {
          showToast('error', '添加失败', res.message);
        }
      } else {
        showToast('error', '上传失败', uploadRes.message || '未知错误');
      }
    } catch (err) {
      showToast('error', '上传失败', err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const toggleEnabled = async (id, currentEnabled) => {
    try {
      await apiPost(`/qrcode/update/${id}`, { enabled: !currentEnabled });
      const updated = qrcodes.map(q => q.id === id ? { ...q, enabled: q.enabled ? 0 : 1 } : q);
      setQrcodes(updated);
      onUpdate(updated);
    } catch {}
  };

  const removeQR = async (id) => {
    if (!window.confirm('确定删除此二维码？')) return;
    try {
      await apiDelete(`/qrcode/delete/${id}`);
      const updated = qrcodes.filter(q => q.id !== id);
      setQrcodes(updated);
      onUpdate(updated);
      showToast('success', '已删除');
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h3 style={{ marginBottom: 20 }}>💳 收款二维码管理</h3>
        <div style={{
          background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20,
          border: '2px dashed var(--border)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>添加新二维码</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="二维码名称（如：微信收款、支付宝）"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }}
            />
            <label
              className="btn btn-primary"
              style={{ cursor: uploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? '上传中...' : '+ 上传二维码'}
              <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        {qrcodes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
            <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.4 }}>💳</div>
            <div>暂无收款二维码，请添加</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {qrcodes.map(qr => (
              <div key={qr.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                background: qr.enabled ? 'var(--white)' : '#f9fafb',
                opacity: qr.enabled ? 1 : 0.6,
              }}>
                <img src={qr.url} alt={qr.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{qr.name}</div>
                  <div style={{ fontSize: 12, color: Number(qr.enabled) ? 'var(--success)' : 'var(--text-light)', marginTop: 2 }}>
                    {Number(qr.enabled) ? '✓ 已启用（打印时显示）' : '已禁用（打印时不显示）'}
                  </div>
                </div>
                <button className={`btn ${Number(qr.enabled) ? '' : 'btn-primary'}`} style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => toggleEnabled(qr.id, Number(qr.enabled))}>
                  {Number(qr.enabled) ? '禁用' : '启用'}
                </button>
                <button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => removeQR(qr.id)}>删除</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 耗材选择器 (Material Picker)
// ============================================================================
function MaterialPicker({ categories, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (name) => {
    if (selected.includes(name)) {
      onChange(selected.filter(m => m !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', minHeight: 30 }}>
        {selected.map(m => (
          <span key={m} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', background: '#e0f2fe', color: '#0369a1',
            borderRadius: 12, fontSize: 12, fontWeight: 500,
          }}>
            {m}
            <span onClick={() => toggle(m)} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>&times;</span>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            padding: '2px 10px', border: '1px dashed var(--border)', borderRadius: 12,
            background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--text-light)',
          }}
        >
          + 选择
        </button>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50,
          background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: 'var(--shadow-md)', padding: 8, marginTop: 4, minWidth: 200, maxHeight: 200, overflow: 'auto',
        }}>
          {categories.length === 0 ? (
            <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-light)', fontSize: 13 }}>暂无分类</div>
          ) : categories.map(cat => (
            <label key={cat.id || cat.name} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              cursor: 'pointer', borderRadius: 4, fontSize: 13,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <input
                type="checkbox"
                checked={selected.includes(cat.name)}
                onChange={() => toggle(cat.name)}
              />
              {cat.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 成本明细编辑器 (Cost Breakdown Editor)
// ============================================================================
function CostBreakdownEditor({ details, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const total = (details || []).reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);

  const addDetail = () => {
    onChange([...(details || []), { name: '', amount: '' }]);
    setExpanded(true);
  };

  const updateDetail = (idx, field, value) => {
    const updated = [...(details || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const removeDetail = (idx) => {
    onChange((details || []).filter((_, i) => i !== idx));
  };

  const detailSummary = (details || []).filter(d => d.name).map(d => `${d.name} ${parseFloat(d.amount) || 0}¥`).join('、');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-light)' }}>成本价:</span>
        <span style={{ fontWeight: 600, color: '#d97706' }}>{fmt(total)}</span>
        {!expanded && detailSummary && (
          <span style={{ fontSize: 11, color: '#b0b8c4' }}>{detailSummary}</span>
        )}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '1px 8px', border: '1px solid var(--border)', borderRadius: 4,
            background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--text-light)',
          }}
        >
          {expanded ? '收起' : '展开明细'}
        </button>
        {!expanded && (
          <button
            type="button"
            onClick={addDetail}
            style={{
              padding: '1px 8px', border: '1px dashed var(--border)', borderRadius: 4,
              background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--primary)',
            }}
          >
            + 添加
          </button>
        )}
      </div>
      {expanded && (
        <div style={{ marginTop: 8, padding: 10, background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a', maxWidth: 360 }}>
          {(details || []).map((d, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <input
                type="text"
                placeholder="名称"
                value={d.name}
                onChange={e => updateDetail(idx, 'name', e.target.value)}
                style={{ width: 120, padding: '4px 8px', border: '1px solid #fde68a', borderRadius: 4, fontSize: 13, background: '#fff' }}
              />
              <input
                type="number"
                step="0.01"
                placeholder="金额"
                value={d.amount}
                onChange={e => updateDetail(idx, 'amount', e.target.value)}
                style={{ width: 80, padding: '4px 8px', border: '1px solid #fde68a', borderRadius: 4, fontSize: 13, background: '#fff' }}
              />
              <button
                type="button"
                onClick={() => removeDetail(idx)}
                style={{ padding: '2px 6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)', fontSize: 16 }}
              >
                &times;
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button
              type="button"
              onClick={addDetail}
              style={{
                flex: 1, padding: '4px 0', border: '1px dashed #fbbf24', borderRadius: 4,
                background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#d97706',
              }}
            >
              + 添加明细
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{
                padding: '4px 14px', border: '1px solid #fbbf24', borderRadius: 4,
                background: '#fbbf24', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 600,
              }}
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 耗材分类管理弹窗 (Category Manager Modal)
// ============================================================================
function CategoryManagerModal({ categories, onRefresh, onClose }) {
  const showToast = useToast();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) { showToast('warning', '提示', '请输入分类名称'); return; }
    setAdding(true);
    try {
      const res = await apiPost('/product/category/add', { name });
      if (res.code === 200 || res.id || res.data) {
        showToast('success', '添加成功');
        setNewName('');
        onRefresh();
      } else {
        showToast('error', '添加失败', res.message || '未知错误');
      }
    } catch (err) {
      showToast('error', '添加失败', err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`确定删除分类「${name}」吗？`)) return;
    try {
      const res = await apiDelete(`/product/category/delete/${id}`);
      if (res.code === 200) {
        showToast('success', '已删除');
        onRefresh();
      } else {
        showToast('error', '删除失败', res.message || '未知错误');
      }
    } catch (err) {
      showToast('error', '删除失败', err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h3 style={{ marginBottom: 20 }}>🏷️ 耗材分类管理</h3>

        {/* Add new */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 20, padding: 14,
          background: 'var(--bg)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)',
        }}>
          <input
            type="text"
            placeholder="输入新分类名称..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }}
          />
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? '添加中...' : '+ 添加'}
          </button>
        </div>

        {/* List */}
        {categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
            <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.4 }}>🏷️</div>
            <div>暂无耗材分类，请添加</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {categories.map(cat => (
              <div key={cat.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', background: '#f0f9ff', border: '1px solid #bae6fd',
                borderRadius: 20, fontSize: 14,
              }}>
                <span style={{ color: '#0369a1', fontWeight: 500 }}>{cat.name}</span>
                <span
                  onClick={() => handleDelete(cat.id, cat.name)}
                  style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 18, fontWeight: 700, lineHeight: 1 }}
                  onMouseEnter={e => e.target.style.color = '#ef4444'}
                  onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >
                  &times;
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 单位输入组合框 (Unit ComboBox)
// ============================================================================
function UnitComboBox({ value, onChange, style }) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setInputVal(value || ''); }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = DEFAULT_UNITS.filter(u =>
    !inputVal || u.includes(inputVal)
  );

  const handleInput = (e) => {
    const v = e.target.value;
    setInputVal(v);
    setOpen(true);
    // If exact match with a preset, apply it immediately
    const match = DEFAULT_UNITS.find(u => u === v);
    if (match) {
      onChange(match);
    } else {
      onChange(v);
    }
  };

  const handleSelect = (u) => {
    setInputVal(u);
    onChange(u);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={inputVal}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        placeholder="单位"
        style={{
          padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4,
          fontSize: 13, background: 'var(--white)', width: '100%', minWidth: 80,
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 6,
          boxShadow: 'var(--shadow-md)', marginTop: 2, overflow: 'hidden',
        }}>
          {filtered.map(u => (
            <div
              key={u}
              onClick={() => handleSelect(u)}
              style={{
                padding: '6px 10px', cursor: 'pointer', fontSize: 13,
                background: u === value ? 'var(--bg)' : 'transparent',
                fontWeight: u === value ? 600 : 400,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = u === value ? 'var(--bg)' : 'transparent'}
            >
              {u}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 项目卡片 (Item Card) - 支持查看/编辑两种模式
// ============================================================================
function ItemCard({ item, index, categories, onUpdate, onRemove, onImageUpload, defaultEditing }) {
  const [editing, setEditing] = useState(defaultEditing);
  const [showCostPopover, setShowCostPopover] = useState(false);
  const costPopRef = useRef(null);
  const area = calcArea(item);
  const amount = calcAmount(item);
  const total = getItemTotal(item);
  const costPrice = calcCostPrice(item);

  useEffect(() => {
    if (!showCostPopover) return;
    const handleClick = (e) => {
      if (costPopRef.current && !costPopRef.current.contains(e.target)) setShowCostPopover(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCostPopover]);

  const update = (field, value) => {
    onUpdate(item._id, field, value);
  };

  const inputStyle = {
    padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4,
    fontSize: 13, background: 'var(--white)',
  };

  // ---- 查看模式：紧凑一行 ----
  if (!editing) {
    const materialsStr = (item.materials || []).join(', ');

    const cellStyle = { padding: '10px 4px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        background: 'var(--white)', marginBottom: 4, fontSize: 12, overflow: 'visible',
      }}>
        <div style={{ ...cellStyle, width: 120, flex: 'none', fontSize: 11, color: 'var(--text-light)' }}>{item.item_date ? item.item_date.slice(0, 16) : ''}</div>
        <div style={{ ...cellStyle, width: 28, flex: 'none', fontWeight: 700, color: 'var(--text-light)' }}>{index + 1}</div>
        <div title={item.name || ''} style={{ ...cellStyle, flex: 2, minWidth: 60, textAlign: 'left', fontWeight: 600 }}>{item.name || ''}</div>
        <div title={materialsStr || ''} style={{ ...cellStyle, flex: 1.5, minWidth: 50, textAlign: 'left', color: 'var(--text-light)' }}>{materialsStr || ''}</div>
        <div title={item.content || ''} style={{ ...cellStyle, flex: 1.5, minWidth: 50, textAlign: 'left', color: 'var(--text-light)' }}>{item.content || ''}</div>
        <div title={item.width ? String(parseFloat(item.width)) : ''} style={{ ...cellStyle, flex: 1, minWidth: 44 }}>{item.width ? parseFloat(item.width) : ''}</div>
        <div title={item.unit !== '米' && item.height ? String(parseFloat(item.height)) : ''} style={{ ...cellStyle, flex: 1, minWidth: 44 }}>{item.unit !== '米' && item.height ? parseFloat(item.height) : ''}</div>
        <div title={String(item.quantity || 1)} style={{ ...cellStyle, width: 36, flex: 'none' }}>{item.quantity || 1}</div>
        <div title={area > 0 ? area.toFixed(4) + 'm²' : ''} style={{ ...cellStyle, flex: 1, minWidth: 50 }}>{area > 0 ? area.toFixed(2) + 'm²' : ''}</div>
        <div
          ref={costPopRef}
          title={costPrice > 0 ? '成本: ¥' + costPrice.toFixed(2) + ' (点击查看明细)' : ''}
          style={{ ...cellStyle, flex: 1, minWidth: 52, color: '#d97706', position: 'relative', cursor: costPrice > 0 ? 'pointer' : 'default', overflow: 'visible' }}
          onClick={() => { if (costPrice > 0) setShowCostPopover(!showCostPopover); }}
        >
          {costPrice > 0 ? '¥' + costPrice.toFixed(2) : ''}
          {showCostPopover && (item.cost_details || []).length > 0 && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                zIndex: 100, background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
                boxShadow: 'var(--shadow-lg)', padding: '10px 14px', minWidth: 180, textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                成本明细 ({(item.cost_details || []).length}项)
              </div>
              {(item.cost_details || []).map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: 'var(--text)' }}>
                  <span>{d.name || '未命名'}</span>
                  <span style={{ fontWeight: 600, color: '#d97706' }}>{fmt(d.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6, color: '#d97706' }}>
                <span>合计</span>
                <span>{fmt(costPrice)}</span>
              </div>
            </div>
          )}
        </div>
        <div title={parseFloat(item.unit_price) ? '¥' + parseFloat(item.unit_price) : ''} style={{ ...cellStyle, flex: 1, minWidth: 46 }}>{parseFloat(item.unit_price) ? '¥' + parseFloat(item.unit_price) : ''}</div>
        <div title={item.unit || ''} style={{ ...cellStyle, width: 56, flex: 'none' }}>{item.unit || ''}</div>
        <div title={fmt(total)} style={{ ...cellStyle, flex: 1, minWidth: 52, textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>{fmt(total)}</div>
        <div title={item.remark || ''} style={{ ...cellStyle, flex: 1.5, minWidth: 50, textAlign: 'left', color: 'var(--text-light)' }}>{item.remark || ''}</div>
        <div style={{ ...cellStyle, width: 48, flex: 'none', padding: '6px 4px' }}>
          {item.image ? (
            <img src={item.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '6px 4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
              padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 4,
              background: 'var(--white)', cursor: 'pointer', fontSize: 12, color: 'var(--primary)', fontWeight: 500,
            }}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => { if (window.confirm('确定删除该项目吗？')) onRemove(item._id); }}
            style={{
              padding: '3px 8px', border: 'none', borderRadius: 4,
              background: '#fef2f2', cursor: 'pointer', fontSize: 12, color: 'var(--danger)', fontWeight: 500,
            }}
          >
            删除
          </button>
        </div>
      </div>
    );
  }

  // ---- 编辑模式：展开卡片 ----
  return (
    <div style={{
      border: '2px solid var(--primary)', borderRadius: 'var(--radius)',
      background: '#fefefe', padding: 16, marginBottom: 12,
    }}>
      {/* Row 1: Name + Unit + Done/Delete */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <input
          type="datetime-local"
          value={item.item_date ? item.item_date.replace(' ', 'T').slice(0, 16) : ''}
          onChange={e => update('item_date', e.target.value.replace('T', ' '))}
          style={{ ...inputStyle, width: 170, fontSize: 13, flexShrink: 0 }}
        />
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)',
          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {index + 1}
        </span>
        <input
          type="text"
          placeholder="商品名称"
          value={item.name}
          onChange={e => update('name', e.target.value)}
          style={{ ...inputStyle, flex: 1, fontWeight: 600, fontSize: 14 }}
        />
        <UnitComboBox
          value={item.unit}
          onChange={v => update('unit', v)}
          style={{ minWidth: 90, flexShrink: 0 }}
        />
        <button
          type="button"
          onClick={() => setEditing(false)}
          style={{
            padding: '6px 16px', border: 'none', background: 'var(--primary)',
            color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}
        >
          完成
        </button>
        <button
          type="button"
          onClick={() => onRemove(item._id)}
          style={{
            padding: '6px 14px', border: 'none', background: '#fef2f2',
            color: 'var(--danger)', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}
        >
          删除
        </button>
      </div>

      {/* Row 2: Dimensions - 根据单位动态显示 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        {item.unit === '米' ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <span style={{ color: 'var(--text-light)' }}>长度(m):</span>
            <input type="number" step="0.01" value={item.width} onChange={e => update('width', e.target.value)} style={{ ...inputStyle, width: 80 }} />
          </label>
        ) : (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <span style={{ color: 'var(--text-light)' }}>宽(m):</span>
              <input type="number" step="0.01" value={item.width} onChange={e => update('width', e.target.value)} style={{ ...inputStyle, width: 80 }} />
            </label>
            <span style={{ color: 'var(--text-lighter)' }}>×</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <span style={{ color: 'var(--text-light)' }}>高(m):</span>
              <input type="number" step="0.01" value={item.height} onChange={e => update('height', e.target.value)} style={{ ...inputStyle, width: 80 }} />
            </label>
          </>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <span style={{ color: 'var(--text-light)' }}>数量:</span>
          <input type="number" min="1" value={item.quantity} onChange={e => update('quantity', e.target.value)} style={{ ...inputStyle, width: 70 }} />
        </label>
        {item.unit === '平方米' && area > 0 && (
          <span style={{ fontSize: 13, color: 'var(--info)', fontWeight: 600 }}>
            面积: {area.toFixed(2)} m²
          </span>
        )}
        {item.unit === '米' && parseFloat(item.width) > 0 && (
          <span style={{ fontSize: 13, color: 'var(--info)', fontWeight: 600 }}>
            {parseFloat(item.width)}m × {parseInt(item.quantity) || 1} = {(parseFloat(item.width) * (parseInt(item.quantity) || 1)).toFixed(2)}m
          </span>
        )}
      </div>

      {/* Row 3: Prices */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <span style={{ color: 'var(--text-light)' }}>单价:</span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={item.unit_price}
            onChange={e => update('unit_price', e.target.value)}
            style={{ ...inputStyle, width: 100 }}
          />
        </label>
        <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
          计算金额: <strong style={{ color: 'var(--primary)' }}>{fmt(amount)}</strong>
        </span>
      </div>

      {/* Row 4: Cost breakdown */}
      <div style={{ marginBottom: 12 }}>
        <CostBreakdownEditor
          details={item.cost_details}
          onChange={v => update('cost_details', v)}
        />
      </div>

      {/* Row 5: Materials */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>耗材:</div>
          <MaterialPicker
            categories={categories}
            selected={item.materials || []}
            onChange={v => update('materials', v)}
          />
        </div>
      </div>

      {/* Row 6: Content */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 4 }}>制作内容:</label>
        <input
          type="text"
          placeholder="制作内容..."
          value={item.content}
          onChange={e => update('content', e.target.value)}
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      {/* Row 7: Remark + Image */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 4 }}>备注:</label>
          <input
            type="text"
            placeholder="备注信息..."
            value={item.remark}
            onChange={e => update('remark', e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 4 }}>图样:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{
              padding: '4px 12px', border: '1px dashed var(--border)', borderRadius: 4,
              cursor: 'pointer', fontSize: 12, color: 'var(--text-light)', background: 'var(--bg)',
            }}>
              📷 上传
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => onImageUpload(item._id, e)}
              />
            </label>
            {item.image && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={item.image}
                  alt="图样"
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => update('image', '')}
                  style={{
                    position: 'absolute', top: -6, right: -6, width: 16, height: 16,
                    borderRadius: '50%', border: 'none', background: 'var(--danger)',
                    color: '#fff', fontSize: 10, cursor: 'pointer', lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Print Preview Modal
// ============================================================================
function PrintPreviewModal({ order, onClose }) {
  const items = order.items || [];
  const orderTotal = items.reduce((sum, item) => {
    const cp = parseFloat(item.customer_price);
    const amt = parseFloat(item.amount) || 0;
    return sum + (cp > 0 ? cp : amt);
  }, 0);
  const total = parseFloat(order.total_amount || orderTotal);
  const discountAmt = parseFloat(order.discount_amount || 0);
  const actual = parseFloat(order.actual_amount || (total - discountAmt));
  const notes = order.description || order.notes || '';

  const [allQRCodes, setAllQRCodes] = useState([]);
  const [selectedQRIds, setSelectedQRIds] = useState([]);
  useEffect(() => {
    apiGet('/qrcode/list').then(res => {
      if (res.code === 200) {
        const list = res.data || [];
        setAllQRCodes(list);
        setSelectedQRIds(list.filter(q => Number(q.enabled)).map(q => q.id));
      }
    }).catch(() => {});
  }, []);
  const toggleQR = (id) => {
    setSelectedQRIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const enabledQRCodes = allQRCodes.filter(q => selectedQRIds.includes(q.id));
  const handlePrint = () => {
    const prepaidAmt = parseFloat(order.prepaid_amount) || 0;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>客户清单 #${order.id}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;padding:16px 12px;color:#222;font-size:12px;min-height:100vh;display:flex;flex-direction:column}
.content{flex:1}
h2{text-align:center;font-size:18px;margin-bottom:2px}
.sub{text-align:center;color:#666;font-size:11px;margin-bottom:8px}
hr{border:none;border-top:1.5px solid #333;margin:6px 0 10px}
.info{display:flex;justify-content:space-between;margin-bottom:10px;font-size:12px;line-height:1.6}
.info strong{font-weight:700}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:10px}
th{background:#f0f1f5;padding:5px 6px;text-align:center;font-weight:700;border:1px solid #ccc;white-space:nowrap}
td{padding:4px 6px;border:1px solid #ddd;text-align:center}
td.left{text-align:left}
.item-img{width:36px;height:36px;object-fit:cover;border-radius:3px}
.summary-row{display:flex;justify-content:flex-end;gap:24px;margin-bottom:8px;font-size:12px;flex-wrap:wrap}
.summary-item{display:flex;gap:4px;align-items:baseline}
.summary-item.highlight{font-weight:700;font-size:14px;color:#1a7f37}
.bottom-section{display:flex;justify-content:space-between;align-items:flex-end;padding-top:16px;page-break-inside:avoid;break-inside:avoid}
.sign-area{display:flex;gap:40px}
.sign-line{display:flex;align-items:baseline;gap:4px}
.sign-line span{font-size:12px;font-weight:600;white-space:nowrap}
.sign-line div{border-bottom:1px solid #333;width:120px}
@page{size:A4 landscape;margin:8mm}
@media print{body{padding:8px 8px}}
</style></head><body>
<div class="content">
<h2>视觉创印广告物料制作清单</h2>
<p class="sub">订单号：#${order.id}</p><hr/>
<div class="info">
<div><strong>客户：</strong>${order.customer?.name || '-'}　　<strong>电话：</strong>${order.customer?.phone || '-'}　　<strong>地址：</strong>${order.customer?.address || '-'}</div>
<div><strong>日期：</strong>${order.order_date || '-'}</div>
</div>
<table><thead><tr><th>日期</th><th>序号</th><th>商品名称</th><th>耗材</th><th>制作内容</th><th>宽(m)</th><th>高(m)</th><th>数量</th><th>面积</th><th>单价</th><th>单位</th><th>金额</th><th>备注</th><th>图样</th></tr></thead><tbody>
${items.length === 0 ? '<tr><td colspan="14" style="text-align:center;color:#aaa;padding:16px">无明细</td></tr>' : items.map((item, idx) => {
  const w = parseFloat(item.width) || 0;
  const h = parseFloat(item.height) || 0;
  const area = item.unit === '平方米' ? (w * h).toFixed(2) + 'm²' : '-';
  const amt = parseFloat(item.amount) || 0;
  const cp = parseFloat(item.customer_price);
  const finalAmt = cp > 0 ? cp : amt;
  const mats = (() => { try { const m = typeof item.materials === 'string' ? JSON.parse(item.materials) : (item.materials || []); return m.map(x => x.name || x).filter(Boolean).join(', '); } catch { return ''; } })();
  const imgSrc = item.image ? (item.image.startsWith('http') ? item.image : window.location.origin + (item.image.startsWith('/') ? '' : '/') + item.image) : '';
  return `<tr>
    <td style="font-size:10px;white-space:nowrap;padding:4px 3px">${item.item_date ? item.item_date.slice(0, 16) : '-'}</td>
    <td>${idx+1}</td>
    <td class="left">${item.name||'-'}</td>
    <td class="left">${mats||'-'}</td>
    <td class="left">${item.content||'-'}</td>
    <td>${w || '-'}</td>
    <td>${h || '-'}</td>
    <td>${item.quantity||1}</td>
    <td>${area}</td>
    <td>${fmt(item.unit_price)}</td>
    <td>${item.unit||'-'}</td>
    <td style="font-weight:600">${fmt(finalAmt)}</td>
    <td class="left">${item.remark||''}</td>
    <td>${imgSrc ? `<img class="item-img" src="${imgSrc}"/>` : '-'}</td>
  </tr>`;
}).join('')}
</tbody></table>
<div class="summary-row">
<div class="summary-item"><span>项目合计：</span><span style="font-weight:600">${fmt(total)}</span></div>
${discountAmt > 0 ? `<div class="summary-item"><span style="color:#f39c12">优惠：</span><span style="color:#f39c12;font-weight:600">-${fmt(discountAmt)}</span></div>` : ''}
${prepaidAmt > 0 ? `<div class="summary-item"><span>余额抵扣：</span><span style="font-weight:600">${fmt(prepaidAmt)}</span></div>` : ''}
<div class="summary-item highlight"><span>实收总计：</span><span>${fmt(actual)}</span></div>
</div>
${notes ? `<div style="margin-bottom:10px;font-size:12px"><strong>备注：</strong>${notes}</div>` : ''}
</div>
<div class="bottom-section">
<div style="display:flex;gap:16px;align-items:flex-start">
${enabledQRCodes.length > 0 ? enabledQRCodes.map(qr => `<div style="text-align:center"><div style="font-size:10px;font-weight:600;margin-bottom:3px">扫码支付</div><img src="${qr.url}" style="max-width:140px;max-height:180px;object-fit:contain;border:1px solid #ddd;border-radius:3px"/><p style="font-size:10px;color:#666;margin-top:2px">${qr.name}</p></div>`).join('') : ''}
</div>
<div class="sign-area">
<div class="sign-line"><span>验收人：</span><div></div></div>
<div class="sign-line"><span>客户签字：</span><div></div></div>
</div>
</div>
</body></html>`;
    const win = window.open('', '_blank', 'width=1100,height=700');
    win.document.write(html);
    win.document.close();
    win.focus();
    const imgs = win.document.querySelectorAll('img');
    if (imgs.length === 0) {
      setTimeout(() => win.print(), 200);
    } else {
      let loaded = 0;
      const tryPrint = () => { loaded++; if (loaded >= imgs.length) setTimeout(() => win.print(), 100); };
      imgs.forEach(img => {
        if (img.complete) { tryPrint(); }
        else { img.onload = tryPrint; img.onerror = tryPrint; }
      });
      setTimeout(() => win.print(), 3000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 900 }} onClick={e => e.stopPropagation()}>
        <div className="no-print" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handlePrint}>打印</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, flexWrap: 'wrap' }}>
            {allQRCodes.length > 0 && (
              <>
                <span style={{ color: 'var(--text-light)' }}>收款码：</span>
                {allQRCodes.map(qr => (
                  <label key={qr.id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedQRIds.includes(qr.id)} onChange={() => toggleQR(qr.id)} />
                    {qr.name}
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="print-preview">
          <div className="print-header">
            <h1 style={{ fontSize: 22 }}>视觉创印广告物料制作清单</h1>
            <p style={{ color: 'var(--text-light)', fontSize: 13 }}>订单号：#{order.id}</p>
          </div>

          <div className="print-info">
            <div className="print-info-item">
              <div><strong>客户：</strong>{order.customer?.name || '-'}</div>
              <div><strong>电话：</strong>{order.customer?.phone || '-'}</div>
              <div><strong>地址：</strong>{order.customer?.address || '-'}</div>
            </div>
            <div className="print-info-item">
              <div><strong>订单日期：</strong>{order.order_date || '-'}</div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="print-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>序号</th>
                  <th>商品名称</th>
                  <th>耗材</th>
                  <th>制作内容</th>
                  <th>宽(m)</th>
                  <th>高(m)</th>
                  <th>数量</th>
                  <th>面积</th>
                  <th>单价</th>
                  <th>单位</th>
                  <th>金额</th>
                  <th>备注</th>
                  <th>图样</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={14} style={{ textAlign: 'center', color: 'var(--text-light)' }}>无明细</td></tr>
                ) : items.map((item, idx) => {
                  const w = parseFloat(item.width) || 0;
                  const h = parseFloat(item.height) || 0;
                  const area = item.unit === '平方米' ? (w * h).toFixed(2) + 'm²' : '-';
                  const amt = parseFloat(item.amount) || 0;
                  const cp = parseFloat(item.customer_price);
                  const finalAmt = cp > 0 ? cp : amt;
                  const mats = (() => { try { const m = typeof item.materials === 'string' ? JSON.parse(item.materials) : (item.materials || []); return m.map(x => x.name || x).filter(Boolean).join(', '); } catch { return ''; } })();
                  const imgSrc = item.image ? (item.image.startsWith('http') ? item.image : `${window.location.origin}${item.image.startsWith('/') ? '' : '/'}${item.image}`) : '';
                  return (
                    <tr key={idx}>
                      <td style={{ fontSize: 12 }}>{item.item_date ? item.item_date.slice(0, 16) : '-'}</td>
                      <td>{idx + 1}</td>
                      <td>{item.name || '-'}</td>
                      <td>{mats || '-'}</td>
                      <td>{item.content || '-'}</td>
                      <td>{w || '-'}</td>
                      <td>{h || '-'}</td>
                      <td>{item.quantity || 1}</td>
                      <td>{area}</td>
                      <td>{fmt(item.unit_price)}</td>
                      <td>{item.unit || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(finalAmt)}</td>
                      <td style={{ fontSize: 12 }}>{item.remark || ''}</td>
                      <td>{imgSrc ? <img src={imgSrc} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 3 }} /> : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 6, padding: '14px 20px', fontSize: 14, marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 24, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div><span style={{ color: 'var(--text-light)' }}>项目合计：</span><span style={{ fontWeight: 700 }}>{fmt(total)}</span></div>
            {discountAmt > 0 && <div><span style={{ color: '#f39c12' }}>优惠：</span><span style={{ color: '#f39c12', fontWeight: 600 }}>-{fmt(discountAmt)}</span></div>}
            {parseFloat(order.prepaid_amount) > 0 && <div><span style={{ color: 'var(--text-light)' }}>余额抵扣：</span><span style={{ fontWeight: 600 }}>{fmt(order.prepaid_amount)}</span></div>}
            <div><span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 16 }}>实收总计：{fmt(actual)}</span></div>
          </div>

          {notes && (
            <div style={{ marginBottom: 16, fontSize: 14 }}><strong>备注：</strong>{notes}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {enabledQRCodes.length > 0 && enabledQRCodes.map(qr => (
                <div key={qr.id} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>扫码支付</div>
                  <img src={qr.url} alt={qr.name} style={{ width: 140, height: 140, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 4 }} />
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 3 }}>{qr.name}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>验收人：</span>
                <div style={{ borderBottom: '1px solid #333', width: 140 }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>客户签字：</span>
                <div style={{ borderBottom: '1px solid #333', width: 140 }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Create / Edit View
// ============================================================================
function OrderFormView({ editId, onBack, isActive }) {
  const showToast = useToast();
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  // oldPrepaid removed - balance operations now handled via "余额完成" button only
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQRManager, setShowQRManager] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [qrcodes, setQrcodes] = useState([]);

  const fetchCustomers = useCallback(() => {
    apiGet('/customer/list').then(j => setCustomers(j.data || j || [])).catch(() => {});
  }, []);
  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  // 切换回此页面时刷新客户列表（含最新余额）
  useEffect(() => { if (isActive) fetchCustomers(); }, [isActive, fetchCustomers]);

  const fetchCategories = useCallback(() => {
    apiGet('/product/categories').then(j => setCategories(j.data || j || [])).catch(() => {});
  }, []);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const loadQRCodesFromAPI = useCallback(() => {
    apiGet('/qrcode/list').then(res => {
      if (res.code === 200) setQrcodes(res.data || []);
    }).catch(() => {});
  }, []);
  useEffect(() => { loadQRCodesFromAPI(); }, [loadQRCodesFromAPI]);

  // Load existing order for edit
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    apiGet(`/sales/detail/${editId}`)
      .then(j => {
        const detail = j.data || j;
        setCustomerId(detail.customer_id || '');
        setNotes(detail.description || detail.notes || '');
        setDiscountAmount(detail.discount_amount || '');
        // oldPrepaid no longer needed
        if (detail.items && detail.items.length > 0) {
          setItems(detail.items.map(i => ({
            _id: (i.id || Date.now()) + Math.random(),
            item_date: i.item_date || '',
            name: i.name || '',
            unit: i.unit || '平方米',
            width: i.width || '',
            height: i.height || '',
            quantity: parseInt(i.quantity) || 1,
            unit_price: i.unit_price || '',
            customer_price: i.customer_price || '',
            cost_details: (() => {
              try { return typeof i.cost_details === 'string' ? JSON.parse(i.cost_details) : (i.cost_details || []); }
              catch { return []; }
            })(),
            materials: (() => {
              try { return typeof i.materials === 'string' ? JSON.parse(i.materials) : (i.materials || []); }
              catch { return []; }
            })(),
            content: i.content || '',
            remark: i.remark || '',
            image: i.image || '',
          })));
        }
      })
      .catch(err => showToast('error', '加载失败', err.message))
      .finally(() => setLoading(false));
  }, [editId, showToast]);

  // Calculations
  const costTotal = items.reduce((sum, i) => sum + calcCostPrice(i), 0);
  const amountTotal = items.reduce((sum, i) => sum + getItemTotal(i), 0);
  const discount = parseFloat(discountAmount) || 0;
  const actualTotal = amountTotal - discount;
  const selectedCustomer = customers.find(c => String(c.id) === String(customerId));
  const customerBalance = parseFloat(selectedCustomer?.balance) || 0;
  const balanceDeduct = Math.min(customerBalance, Math.max(actualTotal, 0));
  const pendingAmount = actualTotal - balanceDeduct;
  const profit = actualTotal - costTotal;

  const addItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
    setDirty(true);
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i._id !== id));
    setDirty(true);
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(i => {
      if (i._id !== id) return i;
      if (field === 'quantity') return { ...i, [field]: parseInt(value) || 1 };
      return { ...i, [field]: value };
    }));
    setDirty(true);
  };

  const handleItemImageUpload = async (itemId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await apiUpload('/upload/image', file);
      if (res.code === 200 && res.data?.url) {
        updateItem(itemId, 'image', res.data.url);
        showToast('success', '图样上传成功');
      } else {
        showToast('error', '上传失败', res.message || '未知错误');
      }
    } catch (err) {
      showToast('error', '上传失败', err.message);
    }
  };

  const handleBack = () => {
    if (dirty && !window.confirm('有未保存的修改，确定要返回吗？')) return;
    onBack();
  };

  const handleSubmit = async () => {
    if (!customerId) {
      showToast('warning', '提示', '请选择客户');
      return;
    }
    if (items.length === 0) {
      showToast('warning', '提示', '请添加项目');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customer_id: customerId,
        description: notes,
        discount_amount: discount,
        actual_amount: actualTotal,
        total_amount: amountTotal,
        cost_total: costTotal,
        profit: profit,
        image: '',
        items: items.map(i => ({
          item_date: i.item_date || '',
          name: i.name,
          unit: i.unit,
          width: parseFloat(i.width) || 0,
          height: parseFloat(i.height) || 0,
          quantity: parseInt(i.quantity) || 1,
          unit_price: parseFloat(i.unit_price) || 0,
          customer_price: parseFloat(i.customer_price) || 0,
          cost_details: JSON.stringify(i.cost_details || []),
          cost_price: calcCostPrice(i),
          materials: JSON.stringify(i.materials || []),
          area: calcArea(i),
          amount: calcAmount(i),
          content: i.content || '',
          remark: i.remark || '',
          image: i.image || '',
        })),
      };
      const url = editId ? `/sales/update/${editId}` : '/sales/create';
      const res = await apiPost(url, payload);
      if (res.code === 200 || res.id || res.data) {
        const msg = res.message || (editId ? '订单已更新' : '订单已创建');
        showToast('success', '成功', msg);
        setDirty(false);
        onBack();
      } else {
        showToast('error', '操作失败', res.message || '未知错误');
      }
    } catch (err) {
      showToast('error', '操作失败', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <button className="btn" onClick={handleBack} style={{ marginBottom: 16 }}>
        ← 返回列表
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          {editId ? `编辑客户清单 #${editId}` : '创建客户清单'}
        </h2>
        <button
          className="btn"
          onClick={() => setShowCategoryModal(true)}
          style={{ padding: '4px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          🏷️ 耗材分类
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Items Section */}
          <div className="form-section" style={{ overflow: 'visible' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h4 style={{ margin: 0 }}>📋 项目明细</h4>
              <button className="btn btn-primary" onClick={addItem}>
                + 添加项目
              </button>
            </div>

            {items.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 40, border: '2px dashed var(--border)',
                borderRadius: 'var(--radius)', color: 'var(--text-light)',
              }}>
                <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.4 }}>📋</div>
                <div style={{ marginBottom: 12 }}>暂无项目，点击上方按钮添加</div>
                <button className="btn btn-primary" onClick={addItem}>+ 添加第一个项目</button>
              </div>
            ) : (
              <>
                {/* 表头 - 仅当有非编辑状态的行时显示 */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  background: '#f5f6fa', borderRadius: '6px 6px 0 0', fontSize: 12,
                  fontWeight: 600, color: 'var(--text-light)', marginBottom: 0,
                  border: '1px solid var(--border)', borderBottom: 'none',
                }}>
                  <div style={{ width: 120, flex: 'none', padding: '8px 4px', textAlign: 'center' }}>日期</div>
                  <div style={{ width: 28, flex: 'none', padding: '8px 4px', textAlign: 'center' }}>#</div>
                  <div style={{ flex: 2, minWidth: 60, padding: '8px 4px' }}>商品名称</div>
                  <div style={{ flex: 1.5, minWidth: 50, padding: '8px 4px' }}>耗材</div>
                  <div style={{ flex: 1.5, minWidth: 50, padding: '8px 4px' }}>制作内容</div>
                  <div style={{ flex: 1, minWidth: 44, padding: '8px 4px', textAlign: 'center' }}>宽(m)</div>
                  <div style={{ flex: 1, minWidth: 44, padding: '8px 4px', textAlign: 'center' }}>高(m)</div>
                  <div style={{ width: 36, flex: 'none', padding: '8px 4px', textAlign: 'center' }}>数量</div>
                  <div style={{ flex: 1, minWidth: 50, padding: '8px 4px', textAlign: 'center' }}>面积</div>
                  <div style={{ flex: 1, minWidth: 52, padding: '8px 4px', textAlign: 'center' }}>成本价</div>
                  <div style={{ flex: 1, minWidth: 46, padding: '8px 4px', textAlign: 'center' }}>单价</div>
                  <div style={{ width: 56, flex: 'none', padding: '8px 4px', textAlign: 'center' }}>单位</div>
                  <div style={{ flex: 1, minWidth: 52, padding: '8px 4px', textAlign: 'right' }}>金额</div>
                  <div style={{ flex: 1.5, minWidth: 50, padding: '8px 4px' }}>备注</div>
                  <div style={{ width: 48, flex: 'none', padding: '8px 4px', textAlign: 'center' }}>图样</div>
                  <div style={{ padding: '8px 4px', flexShrink: 0, textAlign: 'center', width: 96 }}>操作</div>
                </div>
                {items.map((item, idx) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    index={idx}
                    categories={categories}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    onImageUpload={handleItemImageUpload}
                    defaultEditing={!!item._isNew}
                  />
                ))}
              </>
            )}

            {items.length > 0 && (
              <button
                className="btn"
                onClick={addItem}
                style={{
                  width: '100%', padding: '10px', border: '2px dashed var(--border)',
                  background: 'transparent', fontSize: 14, color: 'var(--text-light)',
                  cursor: 'pointer', borderRadius: 'var(--radius)',
                }}
              >
                + 继续添加项目
              </button>
            )}
          </div>

          {/* Customer Info Section */}
          <div className="form-section">
            <h4>👤 客户信息</h4>
            <CustomerSelector
              customers={customers}
              value={customerId}
              onChange={v => { setCustomerId(v); setDirty(true); }}
              onRefresh={fetchCustomers}
            />
            <div className="form-group">
              <label>订单备注</label>
              <textarea
                rows={3}
                placeholder="输入订单备注信息..."
                value={notes}
                onChange={e => { setNotes(e.target.value); setDirty(true); }}
              />
            </div>
          </div>

          {/* 耗材分类管理弹窗 */}
          {showCategoryModal && (
            <CategoryManagerModal
              categories={categories}
              onRefresh={fetchCategories}
              onClose={() => setShowCategoryModal(false)}
            />
          )}

          {/* QR Codes Section */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>💳 收款二维码</h4>
              <button className="btn" onClick={() => setShowQRManager(true)}>管理二维码</button>
            </div>
            {qrcodes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)', background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>💳</div>
                <div style={{ fontSize: 13 }}>暂无收款二维码</div>
                <button className="btn btn-primary" style={{ marginTop: 10, fontSize: 12, padding: '6px 14px' }} onClick={() => setShowQRManager(true)}>去添加</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {qrcodes.map(qr => (
                  <div key={qr.id} style={{
                    textAlign: 'center', padding: 10, border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', background: qr.enabled ? '#f0fdf4' : '#fafafa',
                    opacity: qr.enabled ? 1 : 0.5, width: 120,
                  }}>
                    <img src={qr.url} alt={qr.name} style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 4, marginBottom: 4 }} />
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{qr.name}</div>
                    <div style={{ fontSize: 11, color: qr.enabled ? 'var(--success)' : 'var(--text-light)' }}>
                      {qr.enabled ? '✓ 打印时显示' : '✗ 不显示'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 价格汇总 - 横向布局 */}
        <div className="form-section">
          <h4>💵 价格汇总</h4>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 140, margin: 0 }}>
              <label>成本合计</label>
              <input type="text" readOnly value={fmt(costTotal)}
                style={{ background: '#fff3cd', borderColor: '#ffc107', fontWeight: 600 }}
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 140, margin: 0 }}>
              <label>项目金额合计</label>
              <input type="text" readOnly value={fmt(amountTotal)} style={{ background: '#f7fafc' }} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 140, margin: 0 }}>
              <label>优惠金额</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="无优惠留空"
                value={discountAmount}
                onChange={e => { setDiscountAmount(e.target.value); setDirty(true); }}
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 140, margin: 0 }}>
              <label>预计利润</label>
              <input type="text" readOnly value={fmt(profit)}
                style={{
                  background: profit >= 0 ? '#d1fae5' : '#fef2f2',
                  borderColor: profit >= 0 ? '#10b981' : '#ef4444',
                  color: profit >= 0 ? '#065f46' : '#b91c1c',
                  fontWeight: 600,
                }}
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 140, margin: 0 }}>
              <label>客户余额</label>
              <input type="text" readOnly value={fmt(customerBalance)}
                style={{ background: customerBalance > 0 ? '#eef2ff' : '#f7fafc', fontWeight: 600, color: customerBalance > 0 ? 'var(--primary)' : 'var(--text-lighter)' }}
              />
              {balanceDeduct > 0 && (
                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, fontWeight: 600 }}>提交时自动抵扣 {fmt(balanceDeduct)}</div>
              )}
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 140, margin: 0 }}>
              <label>待付金额</label>
              <input type="text" readOnly value={fmt(pendingAmount > 0 ? pendingAmount : 0)}
                style={{
                  background: pendingAmount > 0 ? '#fef2f2' : '#d1fae5',
                  fontWeight: 600,
                  borderColor: pendingAmount > 0 ? '#ef4444' : '#10b981',
                  color: pendingAmount > 0 ? '#b91c1c' : '#065f46',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px', background: 'var(--bg)', borderRadius: 8, minWidth: 180 }}>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>实收总计</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{fmt(actualTotal)}</span>
            </div>
          </div>
          <button
            className="btn btn-success"
            style={{ width: '100%', padding: '12px 20px', fontSize: 15, fontWeight: 600, marginTop: 16 }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '提交中...' : '✓ 提交订单'}
          </button>
        </div>

      {showQRManager && (
        <QRCodeManagerModal
          onClose={() => setShowQRManager(false)}
          onUpdate={(updated) => setQrcodes(updated)}
        />
      )}
    </div>
  );
}

// ============================================================================
// List View
// ============================================================================
function OrderListView({ onNew, onEdit, onPrint }) {
  const showToast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date_desc');

  const fetchOrders = useCallback(() => {
    setLoading(true);
    apiGet('/sales/list')
      .then(j => setOrders(j.data || j || []))
      .catch(err => showToast('error', '加载失败', err.message))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const actualAmt = parseFloat(o.actual_amount || o.total_amount) || 0;
    return (
      String(o.id).includes(q) ||
      (o.customer?.name || '').toLowerCase().includes(q) ||
      (o.order_date || '').includes(q) ||
      (o.description || '').toLowerCase().includes(q) ||
      String(actualAmt.toFixed(2)).includes(q) ||
      (o.status === 'completed' && '已完成'.includes(q)) ||
      (o.status !== 'completed' && '待确认'.includes(q))
    );
  }).sort((a, b) => {
    const aAmt = parseFloat(a.actual_amount || a.total_amount) || 0;
    const bAmt = parseFloat(b.actual_amount || b.total_amount) || 0;
    switch (sortKey) {
      case 'date_desc': return (b.id || 0) - (a.id || 0);
      case 'date_asc': return (a.id || 0) - (b.id || 0);
      case 'amount_desc': return bAmt - aAmt;
      case 'amount_asc': return aAmt - bAmt;
      case 'status_pending': {
        const aP = a.status === 'completed' ? 1 : 0;
        const bP = b.status === 'completed' ? 1 : 0;
        return aP - bP || (b.id || 0) - (a.id || 0);
      }
      case 'status_completed': {
        const aC = a.status === 'completed' ? 0 : 1;
        const bC = b.status === 'completed' ? 0 : 1;
        return aC - bC || (b.id || 0) - (a.id || 0);
      }
      default: return 0;
    }
  });

  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  // Reset page when search/sort changes
  useEffect(() => { setCurrentPage(1); }, [search, sortKey]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasAnyDiscount = filtered.some(o => parseFloat(o.discount_amount) > 0);

  const handleDelete = async (id) => {
    if (!window.confirm(`确定要删除订单 #${id} 吗？`)) return;
    try {
      const res = await apiDelete(`/sales/delete/${id}`);
      if (res.code === 200 || res.success) {
        showToast('success', '删除成功', `订单 #${id} 已删除`);
        fetchOrders();
      } else {
        showToast('error', '删除失败', res.message || '未知错误');
      }
    } catch (err) {
      showToast('error', '删除失败', err.message);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  const hasAnyUpdate = filtered.some(o => o.updated_at && o.updated_at !== o.created_at);
  const colCount = (hasAnyDiscount ? 10 : 9) + (hasAnyUpdate ? 1 : 0);

  return (
    <div>
      <div className="page-header">
        <h2>客户清单管理</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="搜索订单号/客户/金额..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 12px 7px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, width: 200, outline: 'none' }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-lighter)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
          </div>
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'var(--white)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="date_desc">日期 新→旧</option>
            <option value="date_asc">日期 旧→新</option>
            <option value="amount_desc">实收 高→低</option>
            <option value="amount_asc">实收 低→高</option>
            <option value="status_pending">待付优先</option>
            <option value="status_completed">已完成优先</option>
          </select>
          <button className="btn btn-primary" onClick={onNew}>+ 新建客户清单</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>订单号</th>
              <th style={{ whiteSpace: 'nowrap' }}>客户</th>
              {hasAnyUpdate && <th style={{ whiteSpace: 'nowrap' }}>更新时间</th>}
              <th style={{ whiteSpace: 'nowrap' }}>订单日期</th>
              <th style={{ whiteSpace: 'nowrap' }}>成本</th>
              <th style={{ whiteSpace: 'nowrap' }}>总金额</th>
              {hasAnyDiscount && <th style={{ whiteSpace: 'nowrap' }}>优惠</th>}
              <th style={{ whiteSpace: 'nowrap' }}>利润</th>
              <th style={{ whiteSpace: 'nowrap' }}>实收</th>
              <th style={{ whiteSpace: 'nowrap' }}>状态</th>
              <th style={{ whiteSpace: 'nowrap' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <div className="empty-state">
                    <div className="empty-state-icon">{search ? '🔍' : '📋'}</div>
                    <div className="empty-state-text">{search ? `未找到 "${search}" 相关订单` : '暂无客户清单数据'}</div>
                  </div>
                </td>
              </tr>
            ) : paged.map(order => {
              const costVal = parseFloat(order.cost_total) || 0;
              const profitVal = parseFloat(order.profit) || 0;
              const totalAmt = parseFloat(order.actual_amount || order.total_amount) || 0;
              const discountVal = parseFloat(order.discount_amount) || 0;
              const prepaidAmt = parseFloat(order.prepaid_amount) || 0;
              const pendingAmt = totalAmt - prepaidAmt;
              const isCompleted = order.status === 'completed';
              return (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>#{order.id}</td>
                  <td style={{ whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.customer?.name}>{order.customer?.name || '-'}</td>
                  {hasAnyUpdate && <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-light)' }}>{order.updated_at || '-'}</td>}
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{order.order_date || '-'}</td>
                  <td style={{ color: '#d97706', whiteSpace: 'nowrap' }}>{fmt(costVal)}</td>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(order.total_amount)}</td>
                  {hasAnyDiscount && <td style={{ color: '#f39c12', fontWeight: 600, whiteSpace: 'nowrap' }}>{discountVal > 0 ? `-${fmt(discountVal)}` : '-'}</td>}
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap', color: profitVal >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {fmt(profitVal)}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0369a1', whiteSpace: 'nowrap' }}>{fmt(totalAmt)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {isCompleted ? (
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>✓ 已完成</span>
                    ) : pendingAmt > 0 ? (
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>待付{fmt(pendingAmt)}</span>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: 13 }}>待确认</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                      <button
                        className={isCompleted ? 'btn' : 'btn btn-success'}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={async () => {
                          const newStatus = isCompleted ? 'pending' : 'completed';
                          try {
                            const res = await apiPost(`/sales/status/${order.id}`, { status: newStatus });
                            if (res.code === 200) {
                              showToast('success', '成功', res.message || (isCompleted ? '已取消完成' : '订单已完成'));
                              fetchOrders();
                            }
                          } catch (err) {
                            showToast('error', '操作失败', err.message);
                          }
                        }}
                      >
                        {isCompleted ? '取消完成' : '完成'}
                      </button>
                      {!isCompleted && (
                        <button
                          className="btn"
                          style={{ padding: '4px 10px', fontSize: 12, background: '#7c3aed', color: '#fff', border: 'none' }}
                          onClick={async () => {
                            try {
                              const res = await apiPost(`/sales/balance-complete/${order.id}`);
                              if (res.code === 200) {
                                showToast('success', '成功', res.message);
                                fetchOrders();
                              } else {
                                showToast('error', '操作失败', res.message);
                              }
                            } catch (err) {
                              showToast('error', '操作失败', err.message);
                            }
                          }}
                        >
                          余额完成
                        </button>
                      )}
                      <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onEdit(order.id)}>编辑</button>
                      <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onPrint(order.id)}>查看/打印</button>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(order.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function SalesOrderPage({ jumpToOrderId, onJumpHandled, isActive }) {
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const showToast = useToast();

  const handleNew = () => { setEditId(null); setView('form'); };
  const handleEdit = (id) => { setEditId(id); setView('form'); };

  const handlePrint = async (id) => {
    try {
      const res = await apiGet(`/sales/detail/${id}`);
      setPrintOrder(res.data || res);
    } catch (err) {
      showToast('error', '加载失败', err.message);
    }
  };

  const handleBackToList = () => { setView('list'); setEditId(null); };

  // Handle jump from other pages (e.g. CustomerPage debt link)
  useEffect(() => {
    if (jumpToOrderId) {
      handlePrint(jumpToOrderId);
      if (onJumpHandled) onJumpHandled();
    }
    // eslint-disable-next-line
  }, [jumpToOrderId]);

  return (
    <>
      {view === 'list' && <OrderListView onNew={handleNew} onEdit={handleEdit} onPrint={handlePrint} />}
      {view === 'form' && <OrderFormView editId={editId} onBack={handleBackToList} isActive={isActive} />}
      {printOrder && <PrintPreviewModal order={printOrder} onClose={() => setPrintOrder(null)} />}
    </>
  );
}
