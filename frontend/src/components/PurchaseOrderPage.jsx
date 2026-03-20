import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete, apiUpload } from '../api';
import { useToast } from './Toast';

const fmt = v => '\u00a5' + parseFloat(v || 0).toFixed(2);

// ============================================================================
// Product Selector Modal (single-select for purchase)
// ============================================================================
function ProductSelectorModal({ onSelect, onClose }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    apiGet('/product/list').then(j => setProducts(j.data || j || [])).catch(() => {});
    apiGet('/product/categories').then(j => setCategories(j.data || j || [])).catch(() => {});
  }, []);

  const filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === '' || p.category_name === catFilter || String(p.category) === catFilter;
    return matchName && matchCat;
  });

  const toggleSelect = (p) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === p.id);
      if (exists) return prev.filter(s => s.id !== p.id);
      return [...prev, p];
    });
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 1000 }} onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h3>选择商品</h3>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="搜索商品名称..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 }}
          />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, minWidth: 140 }}
          >
            <option value="">全部分类</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="product-selector">
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>
              暂无商品
            </div>
          )}
          {filtered.map(p => {
            const isSelected = selected.some(s => s.id === p.id);
            return (
              <div
                key={p.id}
                className={`product-card${isSelected ? ' selected' : ''}`}
                onClick={() => toggleSelect(p)}
              >
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                  />
                )}
                <h4>{p.name}</h4>
                <div className="price">{fmt(p.price)}</div>
                <div className="stock">库存: {p.stock ?? '-'}</div>
                {p.category_name && (
                  <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                    {p.category_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={selected.length === 0}>
            确认选择 {selected.length > 0 && `(${selected.length})`}
          </button>
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
  const subtotal = items.reduce((sum, i) => sum + parseFloat(i.unit_price || i.price || 0) * parseInt(i.quantity || i.qty || 1), 0);
  const total = parseFloat(order.total_amount || order.subtotal || subtotal);
  const actual = parseFloat(order.actual_amount || 0);
  const notes = order.description || order.notes || '';
  const imageUrl = order.image || '';
  const printTime = new Date().toLocaleString('zh-CN');

  const handlePrint = () => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>制作清单 #${order.id}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;padding:40px;color:#222}
h2{text-align:center;font-size:24px;margin-bottom:6px}
.sub{text-align:center;color:#666;font-size:14px;margin-bottom:16px}
hr{border:none;border-top:2px solid #333;margin:12px 0 20px}
.info{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;font-size:14px;line-height:1.8}
.info strong{display:inline-block;width:80px}
table{width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px}
th{background:#f5f6fa;padding:10px 12px;text-align:left;font-weight:700;border:1px solid #ddd}
td{padding:10px 12px;border:1px solid #ddd}
.summary{background:#f9f9fb;padding:16px 20px;border-radius:6px;font-size:14px}
.row{display:flex;justify-content:space-between;margin-bottom:6px}
.total{display:flex;justify-content:space-between;font-weight:700;font-size:16px;border-top:1px solid #ddd;padding-top:10px;margin-top:6px}
.actual{display:flex;justify-content:space-between;color:#27ae60;font-weight:600;margin-top:6px}
.ft{margin-top:24px;font-size:12px;color:#999}
.qr-section{text-align:center;margin-top:30px}
.qr-section h3{font-size:16px;margin-bottom:12px}
.qr-section img{max-width:200px;max-height:200px}
.qr-section p{font-size:13px;color:#666;margin-top:8px}
@media print{body{padding:20px}}
</style></head><body>
<h2>视觉创印广告物料制作清单</h2>
<p class="sub">订单号：#${order.id}</p><hr/>
<div class="info">
<div><strong>供应商：</strong>${order.supplier?.name || '-'}<br/><strong>联系人：</strong>${order.supplier?.contact || '-'}<br/><strong>电话：</strong>${order.supplier?.phone || '-'}</div>
<div><strong>订单日期：</strong>${order.order_date || '-'}</div>
</div>
<table><thead><tr><th>序号</th><th>商品名称</th><th>单位</th><th>单价</th><th>数量</th><th>小计</th></tr></thead><tbody>
${items.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#aaa">无商品明细</td></tr>' : items.map((item, idx) => `<tr><td>${idx + 1}</td><td>${item.product?.name || item.name || '-'}</td><td>${item.unit || item.product?.unit || '-'}</td><td>${fmt(item.unit_price || item.price)}</td><td>${item.quantity || item.qty || 1}</td><td>${fmt((item.unit_price || item.price || 0) * (item.quantity || item.qty || 1))}</td></tr>`).join('')}
</tbody></table>
<div class="summary">
<div class="row"><span>商品小计：</span><span>${fmt(subtotal)}</span></div>
<div class="total"><span>应付总计：</span><span>${fmt(total)}</span></div>
<div class="actual"><span>实付金额：</span><span>${fmt(actual)}</span></div>
</div>
${notes ? `<div style="margin-top:20px;font-size:14px"><strong>备注：</strong>${notes}</div>` : ''}
${imageUrl ? `<div class="qr-section"><h3>扫码支付</h3><img src="${imageUrl}" /><p>请扫描上方二维码完成支付</p></div>` : ''}
<p class="ft">打印时间：${printTime}</p>
</body></html>`;
    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 900 }} onClick={e => e.stopPropagation()}>
        <div className="no-print" style={{ marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={handlePrint}>打印</button>
        </div>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="print-preview">
          <div className="print-header">
            <h1>视觉创印广告物料制作清单</h1>
            <p style={{ color: 'var(--text-light)', fontSize: 14 }}>订单号：#{order.id}</p>
          </div>

          <div className="print-info">
            <div className="print-info-item">
              <div><strong>供应商：</strong>{order.supplier?.name || '-'}</div>
              <div><strong>联系人：</strong>{order.supplier?.contact || '-'}</div>
              <div><strong>电话：</strong>{order.supplier?.phone || '-'}</div>
            </div>
            <div className="print-info-item">
              <div><strong>订单日期：</strong>{order.order_date || '-'}</div>
            </div>
          </div>

          <table className="print-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>商品名称</th>
                <th>单位</th>
                <th>单价</th>
                <th>数量</th>
                <th>小计</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)' }}>无商品明细</td></tr>
              ) : items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.product?.name || item.name || '-'}</td>
                  <td>{item.unit || item.product?.unit || '-'}</td>
                  <td>{fmt(item.unit_price || item.price)}</td>
                  <td>{item.quantity || item.qty || 1}</td>
                  <td>{fmt((item.unit_price || item.price || 0) * (item.quantity || item.qty || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ background: 'var(--bg)', borderRadius: 6, padding: '16px 20px', fontSize: 14, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>商品小计：</span><span>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 6 }}>
              <span>应付总计：</span><span>{fmt(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 600 }}>
              <span>实付金额：</span><span>{fmt(actual)}</span>
            </div>
          </div>

          {notes && (
            <div style={{ marginTop: 20, fontSize: 14 }}>
              <strong>备注：</strong>{notes}
            </div>
          )}

          {imageUrl && (
            <div style={{ textAlign: 'center', marginTop: 30 }}>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>扫码支付</h3>
              <img src={imageUrl} alt="支付二维码" style={{ maxWidth: 200, maxHeight: 200, border: '1px solid var(--border)', borderRadius: 4 }} />
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 8 }}>请扫描上方二维码完成支付</p>
            </div>
          )}

          <div className="print-footer">
            打印时间：{printTime}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Create / Edit View
// ============================================================================
function OrderFormView({ editId, onBack }) {
  const showToast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet('/supplier/list').then(j => setSuppliers(j.data || j || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    apiGet(`/purchase/detail/${editId}`)
      .then(j => {
        const detail = j.data || j;
        setSupplierId(detail.supplier_id || '');
        setNotes(detail.description || detail.notes || '');
        setImageUrl(detail.image || '');
        setActualAmount(detail.actual_amount || '');
        if (detail.items && detail.items.length > 0) {
          setItems(detail.items.map(i => ({
            product_id: i.product_id,
            name: i.product?.name || i.name || '',
            unit: i.product?.unit || i.unit || '',
            unit_price: parseFloat(i.unit_price || i.price || 0),
            quantity: parseInt(i.quantity || i.qty || 1),
          })));
        }
      })
      .catch(err => showToast('error', '加载失败', err.message))
      .finally(() => setLoading(false));
  }, [editId, showToast]);

  const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.unit_price) || 0) * (parseInt(i.quantity) || 0), 0);
  const total = subtotal;

  const handleBack = () => {
    if (dirty && !window.confirm('有未保存的修改，确定要返回吗？')) return;
    onBack();
  };

  const handleAddProducts = (selected) => {
    const newItems = [...items];
    selected.forEach(p => {
      const exists = newItems.find(i => i.product_id === p.id);
      if (exists) {
        exists.quantity += 1;
      } else {
        newItems.push({
          product_id: p.id,
          name: p.name,
          unit: p.unit || '',
          unit_price: parseFloat(p.price || 0),
          quantity: 1,
        });
      }
    });
    setItems(newItems);
    setDirty(true);
  };

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
    setDirty(true);
  };

  const updateItem = (productId, field, value) => {
    setItems(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      return { ...i, [field]: field === 'quantity' ? (parseInt(value) || 1) : (parseFloat(value) || 0) };
    }));
    setDirty(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const res = await apiUpload('/upload/image', file);
      if (res.code === 200 && res.data?.url) {
        setImageUrl(res.data.url);
        setDirty(true);
        showToast('success', '上传成功', '图片已上传');
      } else {
        showToast('error', '上传失败', res.message || '未知错误');
      }
    } catch (err) {
      showToast('error', '上传失败', err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      showToast('warning', '提示', '请选择制作厂家');
      return;
    }
    if (items.length === 0) {
      showToast('warning', '提示', '请添加商品');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        supplier_id: supplierId,
        description: notes,
        actual_amount: actualAmount || total,
        image: imageUrl || '',
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      };
      const url = editId ? `/purchase/update/${editId}` : '/purchase/create';
      const res = await apiPost(url, payload);
      if (res.code === 200 || res.id || res.data) {
        showToast('success', '成功', editId ? '订单已更新' : '订单已创建');
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

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
        {editId ? `编辑合作清单 #${editId}` : '创建合作清单'}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Products Section */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h4 style={{ margin: 0 }}>🎁 选择商品</h4>
              <button className="btn btn-primary" onClick={() => setShowProductModal(true)}>
                + 添加商品
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>商品</th>
                  <th>单位</th>
                  <th>单价</th>
                  <th>数量</th>
                  <th>小计</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ color: 'var(--text-light)', fontSize: 14, opacity: 0.7 }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                        请点击上方按钮添加商品
                      </div>
                    </td>
                  </tr>
                ) : items.map(item => (
                  <tr key={item.product_id}>
                    <td>{item.name}</td>
                    <td style={{ color: 'var(--text-light)', fontSize: 13 }}>{item.unit || '-'}</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={e => updateItem(item.product_id, 'unit_price', e.target.value)}
                        style={{ width: 100, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 14 }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(item.product_id, 'quantity', e.target.value)}
                        style={{ width: 70, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 14 }}
                      />
                    </td>
                    <td>{fmt(item.unit_price * item.quantity)}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 12px', fontSize: 13 }}
                        onClick={() => removeItem(item.product_id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Supplier Info Section */}
          <div className="form-section">
            <h4>🏭 制作厂家信息</h4>

            <div className="form-group">
              <label>选择制作厂家 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select
                value={supplierId}
                onChange={e => { setSupplierId(e.target.value); setDirty(true); }}
              >
                <option value="">请选择供应商</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}{s.phone ? ` - ${s.phone}` : ''}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>订单备注</label>
              <textarea
                rows={3}
                placeholder="输入订单备注信息..."
                value={notes}
                onChange={e => { setNotes(e.target.value); setDirty(true); }}
              />
            </div>

            <div className="form-group">
              <label>订单图片/附件</label>
              <input
                type="file"
                accept="image/*"
                disabled={imageUploading}
                onChange={handleImageUpload}
              />
              {imageUploading && <span style={{ fontSize: 12, color: 'var(--text-light)' }}>上传中...</span>}
              {imageUrl && (
                <div style={{ marginTop: 10 }}>
                  <img
                    src={imageUrl}
                    alt="订单图片"
                    style={{ maxWidth: 200, maxHeight: 200, borderRadius: 6, border: '1px solid var(--border)', display: 'block' }}
                  />
                  <button
                    className="btn btn-danger"
                    style={{ marginTop: 6, padding: '4px 14px', fontSize: 12 }}
                    onClick={() => { setImageUrl(''); setDirty(true); }}
                  >
                    删除图片
                  </button>
                </div>
              )}
              {!imageUrl && !imageUploading && (
                <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                  可以添加订单相关的图片，如制作样稿、合同等（最大 5MB）
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sticky Summary */}
        <div className="sticky-summary">
          <div className="form-section">
            <h4>💵 价格汇总</h4>

            <div className="form-group">
              <label>商品小计</label>
              <input
                type="text"
                readOnly
                value={fmt(subtotal)}
                style={{ background: '#f7fafc' }}
              />
            </div>

            <div style={{ margin: '20px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>应付总计：</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{fmt(total)}</div>
            </div>

            <div className="form-group">
              <label>实付金额 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={actualAmount}
                onChange={e => { setActualAmount(e.target.value); setDirty(true); }}
              />
            </div>

            <button
              className="btn btn-success"
              style={{ width: '100%', padding: '12px 20px', fontSize: 15, fontWeight: 600, marginTop: 10 }}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? '提交中...' : '✓ 提交订单'}
            </button>
          </div>
        </div>
      </div>

      {showProductModal && (
        <ProductSelectorModal
          onSelect={handleAddProducts}
          onClose={() => setShowProductModal(false)}
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

  const fetchOrders = useCallback(() => {
    setLoading(true);
    apiGet('/purchase/list')
      .then(j => setOrders(j.data || j || []))
      .catch(err => showToast('error', '加载失败', err.message))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleDelete = async (id) => {
    if (!window.confirm(`确定要删除订单 #${id} 吗？`)) return;
    try {
      const res = await apiDelete(`/purchase/delete/${id}`);
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

  return (
    <div>
      <div className="page-header">
        <h2>🏭 合作制作厂家管理</h2>
        <button className="btn btn-primary" onClick={onNew}>+ 新建合作清单</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>制作厂家</th>
            <th>订单日期</th>
            <th>总金额</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 0 }}>
                <div className="empty-state">
                  <div className="empty-state-icon">🏭</div>
                  <div className="empty-state-text">暂无合作清单数据</div>
                </div>
              </td>
            </tr>
          ) : orders.map(order => (
            <tr key={order.id}>
              <td style={{ fontWeight: 700 }}>#{order.id}</td>
              <td>{order.supplier?.name || '-'}</td>
              <td>{order.order_date || '-'}</td>
              <td style={{ fontWeight: 700 }}>{fmt(order.total_amount)}</td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ padding: '5px 14px', fontSize: 13 }} onClick={() => onEdit(order.id)}>
                    编辑
                  </button>
                  <button className="btn" style={{ padding: '5px 14px', fontSize: 13 }} onClick={() => onPrint(order.id)}>
                    查看/打印
                  </button>
                  <button className="btn btn-danger" style={{ padding: '5px 14px', fontSize: 13 }} onClick={() => handleDelete(order.id)}>
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function PurchaseOrderPage() {
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const showToast = useToast();

  const handleNew = () => {
    setEditId(null);
    setView('form');
  };

  const handleEdit = (id) => {
    setEditId(id);
    setView('form');
  };

  const handlePrint = async (id) => {
    try {
      const res = await apiGet(`/purchase/detail/${id}`);
      const detail = res.data || res;
      setPrintOrder(detail);
    } catch (err) {
      showToast('error', '加载失败', err.message);
    }
  };

  const handleBackToList = () => {
    setView('list');
    setEditId(null);
  };

  return (
    <>
      {view === 'list' && (
        <OrderListView
          onNew={handleNew}
          onEdit={handleEdit}
          onPrint={handlePrint}
        />
      )}
      {view === 'form' && (
        <OrderFormView
          editId={editId}
          onBack={handleBackToList}
        />
      )}
      {printOrder && (
        <PrintPreviewModal
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </>
  );
}
