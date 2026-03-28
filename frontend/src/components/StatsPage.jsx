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

export default function StatsPage() {
  const [period, setPeriod] = useState('all');
  const [overview, setOverview] = useState(null);
  const [customerRank, setCustomerRank] = useState([]);
  const [productRank, setProductRank] = useState([]);
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
    } catch (err) {
      setError('网络错误：' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period !== 'custom') fetchData(period);
  }, [period, fetchData]);

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
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6 }}>已收预付</div>
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
            {/* 客户排行 */}
            <div style={sectionStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>客户排行</div>
              {customerRank.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-lighter)', fontSize: 13 }}>暂无数据</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {customerRank.map((item, idx) => (
                    <div key={item.customer_id || idx} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 8px', borderBottom: idx < customerRank.length - 1 ? '1px solid var(--border-light)' : 'none',
                      transition: 'var(--transition)', borderRadius: 4,
                    }}>
                      <RankBadge rank={idx} />
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.name || '-'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-lighter)', marginRight: 8 }}>{item.order_count}单</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.total_sales)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 商品排行 */}
            <div style={sectionStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>商品销售排行</div>
              {productRank.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-lighter)', fontSize: 13 }}>暂无数据</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {productRank.map((item, idx) => (
                    <div key={item.name || idx} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 8px', borderBottom: idx < productRank.length - 1 ? '1px solid var(--border-light)' : 'none',
                      transition: 'var(--transition)', borderRadius: 4,
                    }}>
                      <RankBadge rank={idx} />
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.name || '-'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-lighter)', marginRight: 8 }}>销量 {item.total_qty}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.total_sales)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
