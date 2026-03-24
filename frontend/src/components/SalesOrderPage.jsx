import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiPost, apiDelete, apiUpload } from '../api';
import { useToast } from './Toast';

const fmt = v => '\u00a5' + parseFloat(v || 0).toFixed(2);

// ============================================================================
// QR Code Management Modal - 数据库存储
// ============================================================================
function QRCodeManagerModal({ onClose, onUpdate }) {
  const showToast = useToast();
  const [qrcodes, setQrcodes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet('/qrcode/list').then(res => {
      if (res.code === 200) {
        setQrcodes(res.data || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
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
          // 重新加载列表
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

        {/* Add new */}
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

        {/* List */}
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
                <img
                  src={qr.url}
                  alt={qr.name}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{qr.name}</div>
                  <div style={{ fontSize: 12, color: Number(qr.enabled) ? 'var(--success)' : 'var(--text-light)', marginTop: 2 }}>
                    {Number(qr.enabled) ? '✓ 已启用（打印时显示）' : '已禁用（打印时不显示）'}
                  </div>
                </div>
                <button
                  className={`btn ${Number(qr.enabled) ? '' : 'btn-primary'}`}
                  style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={() => toggleEnabled(qr.id, Number(qr.enabled))}
                >
                  {Number(qr.enabled) ? '禁用' : '启用'}
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={() => removeQR(qr.id)}
                >
                  删除
                </button>
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
// Product Selector Modal
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
                <div style={{ fontSize: 12, color: 'var(--warning)', marginBottom: 4 }}>
                  成本价: {fmt(p.cost_price || 0)}
                </div>
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

  // 确保图片URL是绝对路径
  const rawImage = order.image || '';
  // 图片URL：用当前页面的origin（经过proxy），而不是直接连后端端口
  // 这样无论从 localhost:3000 还是 192.168.0.107:3000 都能正确加载
  const imageUrl = rawImage && !rawImage.startsWith('http') && !rawImage.startsWith('blob')
    ? `${window.location.origin}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`
    : rawImage;

  // QR codes - 从API加载
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
  const [showOrderImage, setShowOrderImage] = useState(true);

  const handlePrint = () => {
    // QR and image are now in the bottom flex row

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>客户清单 #${order.id}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;padding:30px;color:#222;min-height:100vh;display:flex;flex-direction:column}
h2{text-align:center;font-size:22px;margin-bottom:4px}
.sub{text-align:center;color:#666;font-size:13px;margin-bottom:12px}
hr{border:none;border-top:2px solid #333;margin:10px 0 16px}
.info{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;font-size:13px;line-height:1.7}
.info strong{display:inline-block;width:70px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
th{background:#f5f6fa;padding:8px 10px;text-align:left;font-weight:700;border:1px solid #ddd}
td{padding:8px 10px;border:1px solid #ddd}
.summary{background:#f9f9fb;padding:12px 16px;border-radius:6px;font-size:13px}
.row{display:flex;justify-content:space-between;margin-bottom:4px}
.total{display:flex;justify-content:space-between;font-weight:700;font-size:15px;border-top:1px solid #ddd;padding-top:8px;margin-top:4px}
.actual{display:flex;justify-content:space-between;color:#27ae60;font-weight:600;margin-top:4px}
.bottom-section{margin-top:auto;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-start;page-break-inside:avoid;break-inside:avoid}
@page{size:landscape;margin:10mm}
@media print{body{padding:8px}}
</style></head><body>
<h2>视觉创印广告物料制作清单</h2>
<p class="sub">订单号：#${order.id}</p><hr/>
<div class="info">
<div><strong>客户：</strong>${order.customer?.name || '-'}<br/><strong>电话：</strong>${order.customer?.phone || '-'}<br/><strong>地址：</strong>${order.customer?.address || '-'}</div>
<div><strong>订单日期：</strong>${order.order_date || '-'}</div>
</div>
<table><thead><tr><th>序号</th><th>商品名称</th><th>单位</th><th>单价</th><th>数量</th><th>小计</th></tr></thead><tbody>
${items.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#aaa">无商品明细</td></tr>' : items.map((item, idx) => `<tr><td>${idx + 1}</td><td>${item.product?.name || item.name || '-'}</td><td>${item.unit || item.product?.unit || '-'}</td><td>${fmt(item.unit_price || item.price)}</td><td>${item.quantity || item.qty || 1}</td><td>${fmt((item.unit_price || item.price || 0) * (item.quantity || item.qty || 1))}</td></tr>`).join('')}
</tbody></table>
<div class="summary">
<div class="row"><span>商品小计：</span><span>${fmt(subtotal)}</span></div>
<div class="total"><span>应收总计：</span><span>${fmt(total)}</span></div>
<div class="actual"><span>实收金额：</span><span>${fmt(actual)}</span></div>
</div>
${notes ? `<div style="margin-top:16px;font-size:13px"><strong>备注：</strong>${notes}</div>` : ''}
<div class="bottom-section">
<div style="display:flex;gap:20px;align-items:flex-start">
${enabledQRCodes.length > 0 ? enabledQRCodes.map(qr => `<div style="text-align:center"><div style="font-size:12px;font-weight:600;margin-bottom:4px">💳 扫码支付</div><img src="${qr.url}" style="width:180px;height:180px;object-fit:contain;border:1px solid #ddd;border-radius:4px"/><p style="font-size:11px;color:#666;margin-top:3px">${qr.name}</p></div>`).join('') : ''}
${imageUrl && showOrderImage ? `<div style="text-align:center;margin-left:20px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">📷 订单图片</div><img src="${imageUrl}" style="width:180px;height:180px;object-fit:contain;border:1px solid #ddd;border-radius:4px"/></div>` : ''}
</div>
<div style="display:flex;flex-direction:column;justify-content:flex-end;height:200px;gap:48px"><div style="display:flex;align-items:baseline"><span style="font-size:14px;font-weight:600;white-space:nowrap;display:inline-block;width:80px;text-align:justify;text-align-last:justify">验收人</span><span style="font-size:14px;font-weight:600">：</span><div style="border-bottom:1px solid #333;width:160px"></div></div><div style="display:flex;align-items:baseline"><span style="font-size:14px;font-weight:600;white-space:nowrap;display:inline-block;width:80px;text-align:justify;text-align-last:justify">客户签字</span><span style="font-size:14px;font-weight:600">：</span><div style="border-bottom:1px solid #333;width:160px"></div></div></div>
</div>
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
        <div className="no-print" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handlePrint}>打印</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, flexWrap: 'wrap' }}>
            {allQRCodes.length > 0 && (
              <>
                <span style={{ color: 'var(--text-light)' }}>收款码：</span>
                {allQRCodes.map(qr => (
                  <label key={qr.id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedQRIds.includes(qr.id)}
                      onChange={() => toggleQR(qr.id)}
                    />
                    {qr.name}
                  </label>
                ))}
              </>
            )}
            {imageUrl && (
              <>
                <span style={{ color: 'var(--text-light)', marginLeft: allQRCodes.length > 0 ? 8 : 0 }}>订单图片：</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showOrderImage}
                    onChange={() => setShowOrderImage(prev => !prev)}
                  />
                  显示
                </label>
              </>
            )}
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="print-preview">
          <div className="print-header">
            <h1>视觉创印广告物料制作清单</h1>
            <p style={{ color: 'var(--text-light)', fontSize: 14 }}>订单号：#{order.id}</p>
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
              <span>应收总计：</span><span>{fmt(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 600 }}>
              <span>实收金额：</span><span>{fmt(actual)}</span>
            </div>
          </div>

          {notes && (
            <div style={{ marginTop: 20, fontSize: 14 }}>
              <strong>备注：</strong>{notes}
            </div>
          )}

          {/* 底部：左对齐图片 + 右下签字 */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {enabledQRCodes.length > 0 && enabledQRCodes.map(qr => (
                <div key={qr.id} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>💳 扫码支付</div>
                  <img src={qr.url} alt={qr.name}
                    style={{ width: 180, height: 180, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 4 }} />
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 3 }}>{qr.name}</p>
                </div>
              ))}
              {imageUrl && showOrderImage && (
                <div style={{ textAlign: 'center', marginLeft: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>📷 订单图片</div>
                  <img src={imageUrl} alt="订单图片"
                    style={{ width: 180, height: 180, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 4 }} />
                </div>
              )}
            </div>
            {/* 右 - 验收人 + 客户签字 */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 200, gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: 600, display: 'inline-block', width: 80, textAlign: 'justify', textAlignLast: 'justify' }}>验收人</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>：</span>
                <div style={{ borderBottom: '1px solid #333', width: 160 }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: 600, display: 'inline-block', width: 80, textAlign: 'justify', textAlignLast: 'justify' }}>客户签字</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>：</span>
                <div style={{ borderBottom: '1px solid #333', width: 160 }}></div>
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
function OrderFormView({ editId, onBack }) {
  const showToast = useToast();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQRManager, setShowQRManager] = useState(false);
  const [qrcodes, setQrcodes] = useState([]);
  const [historyPrices, setHistoryPrices] = useState([]);
  const [historyProductId, setHistoryProductId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyRef = useRef(null);

  // 点击外部关闭历史价格下拉
  useEffect(() => {
    if (!historyProductId) return;
    const handleClick = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setHistoryProductId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [historyProductId]);

  // Load customers
  useEffect(() => {
    apiGet('/customer/list').then(j => setCustomers(j.data || j || [])).catch(() => {});
  }, []);

  // Load QR codes from API
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
        setImageUrl(detail.image || '');
        setActualAmount(detail.actual_amount || '');
        if (detail.items && detail.items.length > 0) {
          setItems(detail.items.map(i => ({
            product_id: i.product_id,
            name: i.product?.name || i.name || '',
            unit: i.product?.unit || i.unit || '',
            unit_price: parseFloat(i.unit_price || i.price || 0),
            cost_price: parseFloat(i.cost_price || 0),
            quantity: parseInt(i.quantity || i.qty || 1),
          })));
        }
      })
      .catch(err => showToast('error', '加载失败', err.message))
      .finally(() => setLoading(false));
  }, [editId, showToast]);

  // Calculations
  const costTotal = items.reduce((sum, i) => sum + (parseFloat(i.cost_price) || 0) * (parseInt(i.quantity) || 0), 0);
  const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.unit_price) || 0) * (parseInt(i.quantity) || 0), 0);
  const profit = subtotal - costTotal;
  const total = subtotal;

  const enabledQR = qrcodes.filter(q => Number(q.enabled));

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
          cost_price: parseFloat(p.cost_price || 0),
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

  const toggleHistoryPrices = async (productId) => {
    if (historyProductId === productId) {
      setHistoryProductId(null);
      return;
    }
    setHistoryProductId(productId);
    setHistoryLoading(true);
    try {
      const url = customerId
        ? `/sales/history-prices/${productId}?customer_id=${customerId}`
        : `/sales/history-prices/${productId}`;
      const res = await apiGet(url);
      setHistoryPrices(res.data || []);
    } catch {
      setHistoryPrices([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectHistoryPrice = (productId, price) => {
    updateItem(productId, 'unit_price', price);
    setHistoryProductId(null);
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
    if (!customerId) {
      showToast('warning', '提示', '请选择客户');
      return;
    }
    if (items.length === 0) {
      showToast('warning', '提示', '请添加商品');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customer_id: customerId,
        description: notes,
        actual_amount: actualAmount || total,
        image: imageUrl || '',
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          cost_price: i.cost_price,
        })),
      };
      const url = editId ? `/sales/update/${editId}` : '/sales/create';
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
        {editId ? `编辑客户清单 #${editId}` : '创建客户清单'}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Products Section */}
          <div className="form-section" style={{ overflow: 'visible' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h4 style={{ margin: 0 }}>选择商品</h4>
              <button className="btn btn-primary" onClick={() => setShowProductModal(true)}>
                + 添加商品
              </button>
            </div>

            <table className="data-table" style={{ overflow: 'visible' }}>
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
                      <div style={{ color: 'var(--text-light)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>📦</div>
                        <div>请点击上方按钮添加商品</div>
                      </div>
                    </td>
                  </tr>
                ) : items.map(item => (
                  <tr key={item.product_id}>
                    <td>{item.name}</td>
                    <td style={{ color: 'var(--text-light)', fontSize: 13 }}>{item.unit || '-'}</td>
                    <td style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={e => updateItem(item.product_id, 'unit_price', e.target.value)}
                          style={{ width: 100, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 14 }}
                        />
                        <button
                          type="button"
                          onClick={() => toggleHistoryPrices(item.product_id)}
                          title="历史价格"
                          style={{
                            padding: '5px 8px', fontSize: 12, border: '1px solid var(--border)',
                            borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap',
                            background: historyProductId === item.product_id ? 'var(--primary)' : 'var(--bg)',
                            color: historyProductId === item.product_id ? '#fff' : 'var(--text-light)',
                          }}
                        >
                          历史
                        </button>
                      </div>
                      {historyProductId === item.product_id && (
                        <div ref={historyRef} style={{
                          position: 'absolute', top: '100%', left: 0, zIndex: 100,
                          background: 'var(--white)', border: '1px solid var(--border)',
                          borderRadius: 8, boxShadow: 'var(--shadow-lg)', padding: 0,
                          minWidth: 280, marginTop: 4,
                        }}>
                          <div style={{
                            padding: '10px 14px', borderBottom: '1px solid var(--border)',
                            fontSize: 13, fontWeight: 600, color: 'var(--text)',
                          }}>
                            历史价格记录
                          </div>
                          {historyLoading ? (
                            <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-light)' }}>加载中...</div>
                          ) : historyPrices.length === 0 ? (
                            <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-light)' }}>暂无历史记录</div>
                          ) : (
                            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                              {historyPrices.map((hp, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => selectHistoryPrice(item.product_id, hp.unit_price)}
                                  style={{
                                    padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                                    borderBottom: idx < historyPrices.length - 1 ? '1px solid var(--border)' : 'none',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <div>
                                    <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 15 }}>
                                      ¥{parseFloat(hp.unit_price).toFixed(2)}
                                    </span>
                                    <span style={{ marginLeft: 8, color: 'var(--text-lighter)', fontSize: 12 }}>
                                      ×{hp.quantity}
                                    </span>
                                  </div>
                                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-lighter)' }}>
                                    <div>{hp.customer_name || '-'}</div>
                                    <div>{hp.order_date ? hp.order_date.split(' ')[0] : '-'}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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

          {/* Customer Info Section */}
          <div className="form-section">
            <h4>👤 客户信息</h4>

            <div className="form-group">
              <label>选择客户 <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span></label>
              <select
                value={customerId}
                onChange={e => { setCustomerId(e.target.value); setDirty(true); }}
              >
                <option value="">请选择客户</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` - ${c.phone}` : ''}</option>
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

            {/* 订单图片 - 独立区域 */}
            <div className="form-group">
              <label>📷 订单图片/附件</label>
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
                    onClick={async () => {
                      setImageUrl('');
                      setDirty(true);
                      // 编辑模式下直接保存到后端
                      if (editId) {
                        try {
                          await apiPost(`/sales/update/${editId}`, { image: '' });
                          showToast('success', '已删除', '订单图片已删除');
                        } catch (err) {
                          showToast('error', '删除失败', err.message);
                        }
                      }
                    }}
                  >
                    删除图片
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 收款二维码 - 独立区域 */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>💳 收款二维码</h4>
              <button className="btn" onClick={() => setShowQRManager(true)}>
                管理二维码
              </button>
            </div>

            {qrcodes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)', background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>💳</div>
                <div style={{ fontSize: 13 }}>暂无收款二维码</div>
                <button className="btn btn-primary" style={{ marginTop: 10, fontSize: 12, padding: '6px 14px' }} onClick={() => setShowQRManager(true)}>
                  去添加
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {qrcodes.map(qr => (
                  <div key={qr.id} style={{
                    textAlign: 'center', padding: 10, border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', background: qr.enabled ? '#f0fdf4' : '#fafafa',
                    opacity: qr.enabled ? 1 : 0.5, width: 110,
                  }}>
                    <img src={qr.url} alt={qr.name} style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 4, marginBottom: 4 }} />
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

        {/* Right Column - Sticky Summary */}
        <div className="sticky-summary">
          <div className="form-section">
            <h4>💵 价格汇总</h4>

            <div className="form-group">
              <label>成本小计</label>
              <input
                type="text"
                readOnly
                value={fmt(costTotal)}
                style={{ background: '#fff3cd', borderColor: '#ffc107', fontWeight: 600 }}
              />
            </div>

            <div className="form-group">
              <label>客户价格小计</label>
              <input
                type="text"
                readOnly
                value={fmt(subtotal)}
                style={{ background: '#f7fafc' }}
              />
            </div>

            <div className="form-group">
              <label>预计利润</label>
              <input
                type="text"
                readOnly
                value={fmt(profit)}
                style={{
                  background: '#d1fae5',
                  borderColor: '#10b981',
                  color: '#065f46',
                  fontWeight: 600,
                }}
              />
            </div>

            <div style={{ margin: '20px 0', textAlign: 'center', background: 'var(--bg)', borderRadius: 8, padding: '16px 12px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>应收总计</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{fmt(total)}</div>
            </div>

            <div className="form-group">
              <label>实收金额</label>
              <input
                type="number"
                step="0.01"
                placeholder="输入实收金额"
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

  const fetchOrders = useCallback(() => {
    setLoading(true);
    apiGet('/sales/list')
      .then(j => setOrders(j.data || j || []))
      .catch(err => showToast('error', '加载失败', err.message))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

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

  return (
    <div>
      <div className="page-header">
        <h2>客户清单管理</h2>
        <button className="btn btn-primary" onClick={onNew}>+ 新建客户清单</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>订单日期</th>
            <th>总成本</th>
            <th>总金额</th>
            <th>利润</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">💰</div>
                  <div className="empty-state-text">暂无客户清单数据</div>
                </div>
              </td>
            </tr>
          ) : orders.map(order => {
            const costTotal = order.cost_total_calculated || order.cost_total || 0;
            const profitVal = order.profit_calculated || order.profit || 0;
            const profitNum = parseFloat(profitVal);
            return (
              <tr key={order.id}>
                <td style={{ fontWeight: 700 }}>#{order.id}</td>
                <td>{order.customer?.name || '-'}</td>
                <td>{order.order_date || '-'}</td>
                <td style={{ color: 'var(--warning)' }}>{fmt(costTotal)}</td>
                <td style={{ fontWeight: 700 }}>{fmt(order.total_amount)}</td>
                <td style={{ fontWeight: 700, color: profitNum >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {fmt(profitVal)}
                </td>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function SalesOrderPage() {
  const [view, setView] = useState('list'); // 'list' | 'form'
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
      const res = await apiGet(`/sales/detail/${id}`);
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
