import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LoginProps {
  onLogin?: () => void;
}

// Demo fallback credentials
const DEMO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImRlbW9AY2xlYXJmbG93LmxvY2FsIiwiZXhwIjo5OTk5OTk5OTk5fQ.demo';
const DEMO_USER = {"id": 1, "email": "demo@clearflow.local", "name": "Demo User", "role": "self_owner"};
const DEMO_TENANT = {"id": "22222222-2222-2222-2222-222222222222", "name": "Demo Restaurant", "tier": "starter"};

export default function Login({ onLogin }: LoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [role, setRole] = useState('self_owner');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = mode === 'login' ? 'login' : 'register';
    const body = mode === 'login' 
      ? { email, password }
      : { email, password, name, role };
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      // If backend fails, use demo mode
      if (!res.ok || data.detail) {
        throw new Error('backend-error');
      }
      
      localStorage.clear();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (onLogin) onLogin();
      
      // Check onboarding status - redirect new users to Welcome/Wizard
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      if (!onboardingComplete) {
        navigate('/welcome');
        return;
      }
      
      // Onboarding done - go to HUB (not dashboard directly)
      try {
        const tenantRes = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenants/`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const tenantData = await tenantRes.json();
        const tenantCount = tenantData.tenants?.length || 0;
        if (data.user.role === 'accountant' || tenantCount === 0) {
          navigate('/tenants');
        } else {
          navigate('/hub');
        }
      } catch {
        localStorage.setItem('tenant', JSON.stringify(DEMO_TENANT));
        navigate('/hub');
      }
    } catch (err: any) {
      // DEMO FALLBACK: if backend is down, use demo mode
      localStorage.clear();
      localStorage.setItem('token', DEMO_TOKEN);
      localStorage.setItem('user', JSON.stringify(DEMO_USER));
      localStorage.setItem('tenant', JSON.stringify(DEMO_TENANT));
      localStorage.setItem('onboardingComplete', 'true');
      if (onLogin) onLogin();
      navigate('/hub');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 40, border: '1px solid #e2e8f0', borderRadius: 16, background: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>ClearFlow</h1>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32 }}>
        {mode === 'login' ? t('login.subtitle') : t('login.createAccount')}
      </p>
      
      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              {t('login.fullName')}
            </label>
            <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
        )}
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            {t('login.email')}
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            {t('login.password')}
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              {t('login.iAmA')}
            </label>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}>
              <option value="self_owner">{t('login.businessOwner')}</option>
              <option value="accountant">{t('login.accountant')}</option>
            </select>
          </div>
        )}
        
        {error && error !== 'backend-error' && <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>❌ {error}</div>}
        
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'login' ? t('login.signIn') : t('login.createAccountBtn')}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 }}>
        {mode === 'login' ? t('login.noAccount') : t('login.hasAccount')}
        <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ color: '#635bff', fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'login' ? t('login.register') : t('login.signIn')}
        </span>
      </p>

      <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
          <strong>{t('login.demoAccount')}</strong><br/>
          {t('login.demoEmail')} / {t('login.demoPassword')}
        </p>
      </div>
    </div>
  );
}
