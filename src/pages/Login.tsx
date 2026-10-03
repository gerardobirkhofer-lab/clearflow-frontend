import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LoginProps {
  onLogin?: () => void;
}

const API = import.meta.env.VITE_API_URL;

export default function Login({ onLogin }: LoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
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
      const res = await fetch(`${API}/api/v1/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (!res.ok || data.detail) {
        setError(data.detail || (mode === 'login' ? 'Email o contraseña incorrectos' : 'Error al registrar cuenta'));
        return;
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.user?.tenant_id) {
        localStorage.setItem('tenant', JSON.stringify({
          id: data.user.tenant_id,
          name: data.user.name,
          tier: 'starter',
        }));
      }
      
      if (onLogin) onLogin();

      try {
        const profileRes = await fetch(`${API}/api/v1/account/profile`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.payload) localStorage.setItem('clearflowSetup', JSON.stringify(profile.payload));
          if (profile.onboarding_complete) localStorage.setItem('onboardingComplete', 'true');
        }
      } catch {
        // Setup can still continue from this browser.
      }
      
      const onboardingComplete = localStorage.getItem('onboardingComplete');
      if (!onboardingComplete) {
        navigate('/welcome');
        return;
      }
      
      // Onboarding done - go to HUB (not dashboard directly)
      try {
        const tenantRes = await fetch(`${API}/api/v1/tenants/`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const tenantData = await tenantRes.json();
        const tenantCount = (tenantData.items || tenantData.tenants || []).length;
        if (data.user.role === 'accountant' || tenantCount === 0) {
          navigate('/tenants');
        } else {
          navigate('/hub');
        }
      } catch {
        navigate('/hub');
      }
    } catch {
      setError('No se pudo contactar el servidor. Intenta de nuevo.');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'No se pudo enviar el enlace');
        return;
      }
      setError('');
      setMode('login');
      setPassword('');
      alert(data.detail);
    } catch {
      setError('No se pudo contactar el servidor. Intenta de nuevo.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 40, border: '1px solid #e2e8f0', borderRadius: 16, background: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>ClearFlow</h1>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32 }}>
        {mode === 'forgot' ? 'Recupera tu contraseña' : mode === 'login' ? t('login.subtitle') : t('login.createAccount')}
      </p>
      
      <form onSubmit={mode === 'forgot' ? handleForgot : handleSubmit}>
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
        
        {mode !== 'forgot' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              {t('login.password')}
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' ? 10 : undefined} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
        )}

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
          {mode === 'forgot' ? 'Enviar enlace' : mode === 'login' ? t('login.signIn') : t('login.createAccountBtn')}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 }}>
        {mode === 'login' ? t('login.noAccount') : t('login.hasAccount')}
        <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ color: '#635bff', fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'login' ? t('login.register') : t('login.signIn')}
        </span>
      </p>
      {mode === 'login' && (
        <p style={{ textAlign: 'center', marginTop: 12 }}>
          <span onClick={() => { setMode('forgot'); setError(''); }} style={{ color: '#635bff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Olvidé mi contraseña
          </span>
        </p>
      )}
    </div>
  );
}
