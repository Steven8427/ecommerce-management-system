import { useState } from 'react';
import { apiPost, apiGet } from '../api';

export default function LoginPage({ onLogin }) {
  const [isSetup, setIsSetup] = useState(null); // null=loading, true=has users, false=no users
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' | 'setup'

  // Check if system has users
  useState(() => {
    apiGet('/auth/check-setup').then(res => {
      if (res.code === 200) {
        setIsSetup(res.data.has_users);
        if (!res.data.has_users) setMode('setup');
      }
    }).catch(() => setIsSetup(true));
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'setup') {
        // First user registration (admin)
        const regRes = await apiPost('/auth/register', { username, password, nickname: nickname || username });
        if (regRes.code !== 200) {
          setError(regRes.message || '注册失败');
          setLoading(false);
          return;
        }
      }

      // Login
      const res = await apiPost('/auth/login', { username, password });
      if (res.code === 200) {
        localStorage.setItem('auth_token', res.data.token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        onLogin(res.data.user);
      } else {
        setError(res.message || '登录失败');
      }
    } catch (err) {
      setError('网络错误：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSetup === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <div style={{ color: '#fff', fontSize: 18 }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a202c', margin: 0 }}>电商管理系统</h1>
          <p style={{ color: '#718096', fontSize: 14, marginTop: 8 }}>
            {mode === 'setup' ? '首次使用，请创建管理员账号' : '请登录您的账号'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'setup' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
                昵称
              </label>
              <input
                type="text"
                placeholder="输入昵称（可选）"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0',
                  borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#667eea'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
              用户名 <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="输入用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0',
                borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>
              密码 <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <input
              type="password"
              placeholder={mode === 'setup' ? '设置密码（至少6位）' : '输入密码'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={mode === 'setup' ? 6 : 1}
              style={{
                width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0',
                borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fff5f5', color: '#c53030', padding: '10px 14px',
              borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #fed7d7',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px 20px',
              background: loading ? '#a0aec0' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, transform 0.1s',
            }}
          >
            {loading ? '处理中...' : mode === 'setup' ? '创建管理员并登录' : '登 录'}
          </button>
        </form>

        {mode === 'setup' && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#a0aec0', marginTop: 16 }}>
            首个注册的账号将自动成为管理员
          </p>
        )}
      </div>
    </div>
  );
}
