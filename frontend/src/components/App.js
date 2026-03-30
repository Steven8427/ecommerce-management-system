import React, { useState, useRef, useEffect } from 'react';
import CustomerPage from './CustomerPage';
import SalesOrderPage from './SalesOrderPage';
import StatsPage from './StatsPage';
import UserManagePage from './UserManagePage';
import LoginPage from './LoginPage';
import { apiPost } from '../api';

const ALL_NAV_ITEMS = [
  { key: 'sales', label: '📋 客户订单' },
  { key: 'customers', label: '🏷️ 客户管理' },
  { key: 'stats', label: '📊 数据统计' },
];

const PAGE_MAP = {
  customers: CustomerPage,
  sales: SalesOrderPage,
  stats: StatsPage,
  users: UserManagePage,
};

function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const isAdmin = user?.role === 'admin';
  const permissions = user?.permissions || {};

  // Filter nav items based on permissions
  const navItems = isAdmin
    ? [...ALL_NAV_ITEMS, { key: 'users', label: '⚙️ 用户管理' }]
    : ALL_NAV_ITEMS.filter(item => permissions[item.key]);

  const defaultTab = navItems.length > 0 ? navItems[0].key : 'sales';

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('activeTab');
    // Check if saved tab is still accessible
    if (saved && (isAdmin || permissions[saved] || saved === 'users')) return saved;
    return defaultTab;
  });

  const visited = useRef({ [activeTab]: true });
  const [jumpToOrderId, setJumpToOrderId] = useState(null);

  const navigateToOrder = (orderId) => {
    visited.current['sales'] = true;
    localStorage.setItem('activeTab', 'sales');
    setActiveTab('sales');
    setJumpToOrderId(orderId);
  };

  // Listen for auth-logout events (from api.js 401 handler)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const handleTabChange = (key) => {
    visited.current[key] = true;
    localStorage.setItem('activeTab', key);
    setActiveTab(key);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    // Reset to first available tab
    const perms = userData.permissions || {};
    const isAdm = userData.role === 'admin';
    const firstTab = isAdm ? 'sales' : ALL_NAV_ITEMS.find(i => perms[i.key])?.key || 'sales';
    visited.current = { [firstTab]: true };
    setActiveTab(firstTab);
  };

  const handleLogout = async () => {
    try {
      await apiPost('/auth/logout', {});
    } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('activeTab');
    setUser(null);
  };

  // Not logged in - show login page
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // No permissions at all
  if (navItems.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2>暂无访问权限</h2>
        <p style={{ color: '#718096' }}>请联系管理员分配权限</p>
        <button className="btn" onClick={handleLogout}>退出登录</button>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <h1>⚡ 电商管理系统</h1>
          <ul className="nav-menu" style={{ flex: 1 }}>
            {navItems.map(item => (
              <li key={item.key}>
                <span
                  className={activeTab === item.key ? 'active' : ''}
                  onClick={() => handleTabChange(item.key)}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>👤</span>
              {user.nickname || user.username}
              {isAdmin && <span style={{ padding: '2px 8px', background: 'rgba(129,140,248,0.2)', color: '#a5b4fc', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>管理员</span>}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '5px 14px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, fontSize: 12,
                cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500, whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.2)'; e.target.style.color = '#fca5a5'; e.target.style.borderColor = 'rgba(239,68,68,0.3)'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = '#94a3b8'; e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            >
              退出登录
            </button>
          </div>
        </div>
      </nav>
      <main className="container">
        {navItems.map(item => {
          if (!visited.current[item.key]) return null;
          const Page = PAGE_MAP[item.key];
          if (!Page) return null;
          return (
            <div key={item.key} style={{ display: activeTab === item.key ? 'block' : 'none' }}>
              <Page
                isActive={activeTab === item.key}
                {...(item.key === 'customers' ? { onNavigateToOrder: navigateToOrder } : {})}
                {...(item.key === 'sales' ? { jumpToOrderId, onJumpHandled: () => setJumpToOrderId(null) } : {})}
              />
            </div>
          );
        })}
      </main>
    </div>
  );
}

export default App;
