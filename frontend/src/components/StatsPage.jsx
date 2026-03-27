import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../api';

const fmt = v => '¥' + parseFloat(v || 0).toFixed(2);

const PERIODS = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' },
  { key: 'all', label: '全部' },
];

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'var(--transition)',
      cursor: 'default',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: color || 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-lighter)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function RankingTable({ title, icon, columns, data, emptyText }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 24,
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icon}</span> {title}
      </h3>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 30, color: 'var(--text-light)' }}>
                {emptyText || '暂无数据'}
              </td>
            </tr>
          ) : data.map((item, idx) => (
            <tr key={item.id || idx}>
              {columns.map(col => (
                <td key={col.key} style={col.style}>
                  {col.render ? col.render(item, idx) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }) {
  const colors = ['#f6c343', '#a0aec0', '#cd7f32'];
  const bg = rank < 3 ? colors[rank] : 'var(--bg-dark)';
  const color = rank < 3 ? '#fff' : 'var(--text-light)';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: bg,
      color: color,
      fontSize: 12,
      fontWeight: 700,
    }}>
      {rank + 1}
    </span>
  );
}

export default function StatsPage() {
  const [period, setPeriod] = useState('all');
  const [overview, setOverview] = useState(null);
  const [customerRank, setCustomerRank] = useState([]);
  const [productRank, setProductRank] = useState([]);
  const [supplierRank, setSupplierRank] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet(`/stats/overview?period=${p}`);
      if (res.code !== 200) {
        setError(res.message || '加载失败');
        return;
      }
      const d = res.data || {};
      setOverview(d);
      setCustomerRank(d.customerRank || []);
      setProductRank(d.productRank || []);
      setSupplierRank(d.supplierRank || []);
    } catch (err) {
      console.error('Stats fetch error:', err);
      setError('网络错误：' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const sales = overview?.sales || {};
  const purchase = overview?.purchase || {};
  const counts = overview?.counts || {};

  const customerColumns = [
    { key: 'rank', label: '排名', render: (_, idx) => <RankBadge rank={idx} /> },
    { key: 'name', label: '客户', render: (item) => item.name || '-' },
    { key: 'order_count', label: '订单数', style: { textAlign: 'center' } },
    { key: 'total_sales', label: '销售额', style: { fontWeight: 600 }, render: (item) => fmt(item.total_sales) },
    { key: 'total_profit', label: '利润', render: (item) => (
      <span style={{ color: parseFloat(item.total_profit) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
        {fmt(item.total_profit)}
      </span>
    )},
  ];

  const productColumns = [
    { key: 'rank', label: '排名', render: (_, idx) => <RankBadge rank={idx} /> },
    { key: 'name', label: '商品', render: (item) => item.name || '-' },
    { key: 'total_qty', label: '销量', style: { textAlign: 'center' } },
    { key: 'total_sales', label: '销售额', style: { fontWeight: 600 }, render: (item) => fmt(item.total_sales) },
  ];

  const supplierColumns = [
    { key: 'rank', label: '排名', render: (_, idx) => <RankBadge rank={idx} /> },
    { key: 'name', label: '制作厂家', render: (item) => item.name || '-' },
    { key: 'order_count', label: '订单数', style: { textAlign: 'center' } },
    { key: 'total_amount', label: '采购总额', style: { fontWeight: 600 }, render: (item) => fmt(item.total_amount) },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h2>📊 数据统计</h2>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: '7px 16px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: period === p.key ? 600 : 400,
                cursor: 'pointer',
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
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger)' }}>
          <div style={{ fontSize: 18, marginBottom: 12 }}>加载失败</div>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>{error}</div>
          <button className="btn btn-primary" onClick={() => fetchData(period)}>重试</button>
        </div>
      ) : (
        <>
          {/* 基础统计 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard icon="📦" label="商品数量" value={counts.products || 0} color="#e0f2fe" />
            <StatCard icon="👥" label="客户数量" value={counts.customers || 0} color="#fce7f3" />
            <StatCard icon="🏭" label="制作厂家" value={counts.suppliers || 0} color="#f0fdf4" />
            <StatCard
              icon="💰"
              label="销售订单量"
              value={sales.order_count || 0}
              color="#eef2ff"
            />
            <StatCard
              icon="📥"
              label="采购订单量"
              value={purchase.order_count || 0}
              color="#ede9fe"
            />
          </div>

          {/* ========== 销售（客户清单）========== */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 24, marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              💰 客户清单（销售统计）
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <StatCard
                icon="💰"
                label="销售总额"
                value={fmt(sales.total_sales)}
                color="#eef2ff"
                sub={`${sales.order_count || 0} 笔订单`}
              />
              <StatCard
                icon="📈"
                label="销售利润"
                value={fmt(sales.total_profit)}
                color={parseFloat(sales.total_profit) >= 0 ? '#dcfce7' : '#fef2f2'}
                sub={sales.total_sales > 0 ? `利润率 ${((sales.total_profit / sales.total_sales) * 100).toFixed(1)}%` : '-'}
              />
              <StatCard
                icon="💵"
                label="销售成本"
                value={fmt(sales.total_cost)}
                color="#fef3c7"
              />
              <StatCard
                icon="💳"
                label="实收金额"
                value={fmt(sales.total_received)}
                color="#f0fdf4"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
              <RankingTable
                title="客户销售排行"
                icon="👥"
                columns={customerColumns}
                data={customerRank}
                emptyText="暂无数据"
              />
              <RankingTable
                title="商品销售排行"
                icon="🎁"
                columns={productColumns}
                data={productRank}
                emptyText="暂无数据"
              />
            </div>
          </div>

          {/* ========== 采购（合作制造厂家）========== */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 24,
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🏭 合作制作厂家（采购统计）
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <StatCard
                icon="📥"
                label="采购总额"
                value={fmt(purchase.total_amount)}
                color="#ede9fe"
                sub={`${purchase.order_count || 0} 笔采购`}
              />
              <StatCard
                icon="💳"
                label="实付金额"
                value={fmt(purchase.total_paid)}
                color="#fef3c7"
              />
              <StatCard
                icon="📋"
                label="采购订单数"
                value={purchase.order_count || 0}
                color="#e0f2fe"
              />
            </div>
            <RankingTable
              title="制作厂家采购排行"
              icon="🏭"
              columns={supplierColumns}
              data={supplierRank}
              emptyText="暂无数据"
            />
          </div>
        </>
      )}
    </div>
  );
}
