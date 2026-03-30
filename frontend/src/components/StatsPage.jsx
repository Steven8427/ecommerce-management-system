import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../api';

const fmt = v => '¥' + parseFloat(v || 0).toFixed(2);
const fmtInt = v => parseInt(v || 0).toLocaleString();

const PERIODS = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' },
  { key: 'all', label: '全部' },
  { key: 'custom', label: '自定义' },
];

function RankBadge({ rank }) {
  const medals = ['#f59e0b', '#94a3b8', '#b45309'];
  if (rank < 3) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: '50%',
        background: medals[rank], color: '#fff', fontSize: 11, fontWeight: 700,
      }}>{rank + 1}</span>
    );
  }
  return <span style={{ display: 'inline-block', width: 22, textAlign: 'center', color: 'var(--text-lighter)', fontSize: 12, fontWeight: 600 }}>{rank + 1}</span>;
}

const RANK_PAGE_SIZE = 10;
const PAGE_SIZE = 20;

function RankSection({ title, list, keyField, renderItem }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(list.length / RANK_PAGE_SIZE));
  const safeP = Math.min(page, totalPages);
  const paged = list.slice((safeP - 1) * RANK_PAGE_SIZE, safeP * RANK_PAGE_SIZE);
  const offset = (safeP - 1) * RANK_PAGE_SIZE;

  const sectionStyle = {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px 24px',
  };

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <span style={{ fontSize: 12, color: 'var(--text-lighter)' }}>共 {list.length} 项</span>
      </div>
      {list.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-lighter)', fontSize: 13 }}>暂无数据</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {paged.map((item, idx) => (
              <div key={item[keyField] || idx} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 8px', borderBottom: idx < paged.length - 1 ? '1px solid var(--border-light)' : 'none',
                transition: 'var(--transition)', borderRadius: 4,
              }}>
                <RankBadge rank={offset + idx} />
                {renderItem(item)}
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 12 }}>
              <button className="btn" style={{ padding: '2px 8px', fontSize: 11 }} disabled={safeP <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{safeP} / {totalPages}</span>
              <button className="btn" style={{ padding: '2px 8px', fontSize: 11 }} disabled={safeP >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderSection({ title, list, color, emptyText }) {
  const [page, setPage] = useState(1);
  const [jumpVal, setJumpVal] = useState('');
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safeP = Math.min(page, totalPages);
  const paged = list.slice((safeP - 1) * PAGE_SIZE, safeP * PAGE_SIZE);

  const sectionStyle = {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px 24px',
  };

  return (
    <div style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
        <span style={{ fontSize: 12, color: 'var(--text-lighter)', marginLeft: 4 }}>({list.length})</span>
      </div>
      {list.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-lighter)', fontSize: 13 }}>{emptyText}</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['单号', '客户', '金额', '优惠', '成本', '利润', '余额抵扣', '日期'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-light)', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'var(--transition)' }}>
                    <td style={{ padding: '9px 10px', fontWeight: 500, color: 'var(--primary)', whiteSpace: 'nowrap' }}>#{o.id}</td>
                    <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>{o.customer_name || '-'}</td>
                    <td style={{ padding: '9px 10px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(o.total_amount)}</td>
                    <td style={{ padding: '9px 10px', color: parseFloat(o.discount_amount) > 0 ? '#f59e0b' : 'var(--text-lighter)', fontVariantNumeric: 'tabular-nums' }}>{fmt(o.discount_amount)}</td>
                    <td style={{ padding: '9px 10px', color: 'var(--text-light)', fontVariantNumeric: 'tabular-nums' }}>{fmt(o.cost_total)}</td>
                    <td style={{ padding: '9px 10px', fontWeight: 600, color: parseFloat(o.profit) >= 0 ? 'var(--success)' : 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>{fmt(o.profit)}</td>
                    <td style={{ padding: '9px 10px', color: parseFloat(o.prepaid_amount) > 0 ? '#7c3aed' : 'var(--text-lighter)', fontVariantNumeric: 'tabular-nums' }}>{fmt(o.prepaid_amount)}</td>
                    <td style={{ padding: '9px 10px', color: 'var(--text-light)', whiteSpace: 'nowrap', fontSize: 12 }}>{(o.order_date || '').slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '12px 0 0', flexWrap: 'wrap' }}>
              <button className="btn" style={{ padding: '3px 10px', fontSize: 12 }} disabled={safeP <= 1} onClick={() => setPage(1)}>首页</button>
              <button className="btn" style={{ padding: '3px 10px', fontSize: 12 }} disabled={safeP <= 1} onClick={() => setPage(p => p - 1)}>上一页</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safeP) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? <span key={`e${i}`} style={{ color: 'var(--text-lighter)', fontSize: 12 }}>...</span> :
                  <button key={p} className="btn" style={{ padding: '3px 10px', fontSize: 12, fontWeight: p === safeP ? 700 : 400, background: p === safeP ? 'var(--primary)' : undefined, color: p === safeP ? '#fff' : undefined }} onClick={() => setPage(p)}>{p}</button>
                )}
              <button className="btn" style={{ padding: '3px 10px', fontSize: 12 }} disabled={safeP >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
              <button className="btn" style={{ padding: '3px 10px', fontSize: 12 }} disabled={safeP >= totalPages} onClick={() => setPage(totalPages)}>末页</button>
              <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 8 }}>共 {list.length} 条</span>
              <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 4 }}>跳至</span>
              <input type="number" min={1} max={totalPages} value={jumpVal} onChange={e => setJumpVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(jumpVal); if (v >= 1 && v <= totalPages) { setPage(v); setJumpVal(''); } } }}
                style={{ width: 50, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12, textAlign: 'center', outline: 'none' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>页</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function StatsPage({ isActive }) {
  const [period, setPeriod] = useState('all');
  const [overview, setOverview] = useState(null);
  const [customerRank, setCustomerRank] = useState([]);
  const [productRank, setProductRank] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchData = useCallback(async (p, start, end) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/stats/overview?period=${p}`;
      if (p === 'custom' && start) url += `&start=${start}`;
      if (p === 'custom' && end) url += `&end=${end}`;
      const res = await apiGet(url);
      if (res.code !== 200) { setError(res.message || '加载失败'); return; }
      const d = res.data || {};
      setOverview(d);
      setCustomerRank(d.customerRank || []);
      setProductRank(d.productRank || []);
      setCompletedOrders(d.completedOrders || []);
      setPendingOrders(d.pendingOrders || []);
    } catch (err) {
      setError('网络错误：' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period !== 'custom') fetchData(period);
  }, [period, fetchData]);

  // 切换到统计页时自动刷新数据
  useEffect(() => {
    if (isActive) {
      if (period === 'custom') {
        if (customStart || customEnd) fetchData('custom', customStart, customEnd);
      } else {
        fetchData(period);
      }
    }
    // eslint-disable-next-line
  }, [isActive]);

  const handleCustomQuery = () => {
    if (customStart || customEnd) fetchData('custom', customStart, customEnd);
  };

  const counts = overview?.counts || {};
  const sales = overview?.sales || {};
  const profit = parseFloat(sales.profit) || 0;

  const sectionStyle = {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px 24px',
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h2>数据统计</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: '5px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
                  fontSize: 13, fontWeight: period === p.key ? 600 : 400, cursor: 'pointer',
                  transition: 'var(--transition)',
                  background: period === p.key ? 'var(--white)' : 'transparent',
                  color: period === p.key ? 'var(--text)' : 'var(--text-light)',
                  boxShadow: period === p.key ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none' }} />
              <span style={{ color: 'var(--text-lighter)', fontSize: 13 }}>至</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none' }} />
              <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: 13 }} onClick={handleCustomQuery}>查询</button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>
          <div style={{ fontSize: 16, marginBottom: 12 }}>加载失败</div>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>{error}</div>
          <button className="btn btn-primary" onClick={() => fetchData(period)}>重试</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 核心数据 - 一行四个 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div style={{ ...sectionStyle, borderLeft: '3px solid var(--primary)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>销售总额</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>{fmt(sales.total)}</div>
            </div>
            <div style={{ ...sectionStyle, borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>成本总计</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706', letterSpacing: -0.5 }}>{fmt(sales.cost)}</div>
            </div>
            <div style={{ ...sectionStyle, borderLeft: `3px solid ${profit >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>利润总计</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: profit >= 0 ? 'var(--success)' : 'var(--danger)', letterSpacing: -0.5 }}>{fmt(profit)}</div>
            </div>
            <div style={{ ...sectionStyle, borderLeft: '3px solid #8b5cf6' }}>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>余额抵扣</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#7c3aed', letterSpacing: -0.5 }}>{fmt(sales.prepaid)}</div>
            </div>
          </div>

          {/* 订单概览 */}
          <div style={{ ...sectionStyle }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>订单概览</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: '客户数量', value: fmtInt(counts.customers), color: '#ec4899', bg: '#fdf2f8' },
                { label: '订单总数', value: fmtInt(counts.orders), color: '#3b82f6', bg: '#eff6ff' },
                { label: '已完成', value: fmtInt(counts.completed), color: '#10b981', bg: '#ecfdf5' },
                { label: '进行中', value: fmtInt(counts.pending), color: '#f59e0b', bg: '#fffbeb' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                  background: item.bg,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: item.color + '18', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: item.color,
                  }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 排行榜 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <RankSection title="客户排行" list={customerRank} keyField="customer_id" renderItem={(item) => (
              <>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.name || '-'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-lighter)', marginRight: 8 }}>{item.order_count}单</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.total_sales)}</div>
              </>
            )} />
            <RankSection title="商品销售排行" list={productRank} keyField="name" renderItem={(item) => (
              <>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.name || '-'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-lighter)', marginRight: 8 }}>销量 {item.total_qty}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.total_sales)}</div>
              </>
            )} />
          </div>

          {/* 订单列表 */}
          <OrderSection title="进行中订单" list={pendingOrders} color="#f59e0b" emptyText="暂无进行中订单" />
          <OrderSection title="已完成订单" list={completedOrders} color="#10b981" emptyText="暂无已完成订单" />

        </div>
      )}
    </div>
  );
}
