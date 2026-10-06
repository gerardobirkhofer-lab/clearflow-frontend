import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get('reset') || '';
  const navigate = useNavigate();

  useEffect(() => {
    if (resetToken) setMode('reset');
  }, [resetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = mode === 'login' ? 'login' : 'register';
    const body = mode === 'login' 
      ? { email, password }
      : { email, password, name };
    
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
        navigate('/guided-setup');
        return;
      }
      
      // Onboarding done - go to HUB (not dashboard directly)
      try {
        const tenantRes = await fetch(`${API}/api/v1/tenants/`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const tenantData = await tenantRes.json();
        const items = tenantData.items || tenantData.tenants || [];
        const current = items.find((item: { id: string }) => item.id === data.user.tenant_id) || items[0];
        if (current) {
          localStorage.setItem('tenant', JSON.stringify({ id: current.id, name: current.name, role: current.role }));
        }
        if (data.user.role === 'accountant' || items.length === 0) {
          navigate('/tenants');
        } else if (items.length > 1) {
          navigate('/tenant-selector');
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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (password.length < 10) {
      setError(t('login.passwordTooShort'));
      return;
    }
    try {
      const res = await fetch(`${API}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || t('login.resetInvalid'));
        return;
      }
      setPassword('');
      setNotice(t('login.passwordUpdated'));
      setSearchParams({});
      setMode('login');
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
      setPassword('');
      setNotice('Si ese correo está registrado, te enviamos un enlace para elegir una contraseña nueva.');
      setMode('login');
    } catch {
      setError('No se pudo contactar el servidor. Intenta de nuevo.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 40, border: '1px solid #e2e8f0', borderRadius: 16, background: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>ClearFlow</h1>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32 }}>
        {mode === 'reset' ? t('login.resetTitle') : mode === 'forgot' ? 'Recupera tu contraseña' : mode === 'login' ? t('login.subtitle') : t('login.createAccount')}
      </p>
      
      <form onSubmit={mode === 'reset' ? handleReset : mode === 'forgot' ? handleForgot : handleSubmit}>
        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              {t('login.fullName')}
            </label>
            <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
        )}
        
        {mode !== 'reset' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            {t('login.email')}
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
        </div>
        )}
        
        {mode !== 'forgot' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              {mode === 'reset' ? t('login.newPassword') : t('login.password')}
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' || mode === 'reset' ? 10 : undefined} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
        )}

        {notice && <div style={{ padding: 12, background: '#f0fdf4', color: '#166534', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{notice}</div>}
        {error && error !== 'backend-error' && <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>❌ {error}</div>}
        
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'reset' ? t('login.savePassword') : mode === 'forgot' ? 'Enviar enlace' : mode === 'login' ? t('login.signIn') : t('login.createAccountBtn')}
        </button>
      </form>
      
      {mode !== 'reset' && (
      <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 }}>
        {mode === 'login' ? t('login.noAccount') : t('login.hasAccount')}
        <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ color: '#635bff', fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'login' ? t('login.register') : t('login.signIn')}
        </span>
      </p>
      )}
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
