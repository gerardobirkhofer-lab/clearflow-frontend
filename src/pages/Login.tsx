import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LoginProps {
  onLogin?: () => void;
}

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';

function persistTenant(user: any, extra?: { name?: string; tier?: string }) {
  const tenantId = user?.tenant_id;
  if (!tenantId) return false;
  localStorage.setItem(
    'tenant',
    JSON.stringify({
      id: tenantId,
      name: extra?.name || user?.name || 'Mi negocio',
      tier: extra?.tier || 'starter',
    }),
  );
  return true;
}

async function enrichTenantFromApi(token: string) {
  try {
    const res = await fetch(`${API}/api/v1/tenants/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const tenant = await res.json();
    if (tenant?.id) {
      localStorage.setItem(
        'tenant',
        JSON.stringify({
          id: tenant.id,
          name: tenant.name || 'Mi negocio',
          tier: tenant.tier || 'starter',
          slug: tenant.slug,
        }),
      );
    }
  } catch {
    // keep tenant from user.tenant_id
  }
}

export default function Login({ onLogin }: LoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [role, setRole] = useState('self_owner');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // MFA challenge state
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaMethods, setMfaMethods] = useState<string[]>([]);
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'sms'>('totp');
  const [mfaCode, setMfaCode] = useState('');
  const [phoneMasked, setPhoneMasked] = useState<string | null>(null);
  const [smsHint, setSmsHint] = useState<string | null>(null);

  const finishLogin = async (data: any) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    const hasTenant = persistTenant(data.user);
    if (!hasTenant) {
      setError('La cuenta no tiene tenant asignado. Contacta soporte.');
      return;
    }
    await enrichTenantFromApi(data.token);
    if (onLogin) onLogin();
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (!onboardingComplete) {
      navigate('/welcome');
      return;
    }
    if (data.user.role === 'accountant') {
      navigate('/tenants');
      return;
    }
    navigate('/hub');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const endpoint = mode === 'login' ? 'login' : 'register';
    const body =
      mode === 'login' ? { email, password } : { email, password, name, role };

    try {
      const res = await fetch(`${API}/api/v1/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.detail) {
        const detail =
          typeof data.detail === 'string'
            ? data.detail
            : mode === 'login'
              ? 'Email o contraseña incorrectos'
              : 'Error al registrar cuenta';
        setError(detail);
        return;
      }

      if (data.mfa_required && data.mfa_token) {
        setMfaToken(data.mfa_token);
        const methods: string[] = data.methods || ['totp'];
        setMfaMethods(methods);
        setMfaMethod((data.preferred_method || methods[0] || 'totp') as 'totp' | 'sms');
        setPhoneMasked(data.phone_masked || null);
        setSmsHint(null);
        return;
      }

      if (!data.token || !data.user) {
        setError('Respuesta de autenticación incompleta');
        return;
      }
      await finishLogin(data);
    } catch (err: any) {
      const isNetworkError =
        err?.name === 'TypeError' ||
        err?.message?.includes('fetch') ||
        err?.message?.includes('Failed') ||
        err?.message?.includes('Network');
      setError(
        isNetworkError
          ? 'No hay conexión con el servidor. Revisa la red e inténtalo de nuevo.'
          : 'Error inesperado. Intenta de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const sendSmsCode = async () => {
    if (!mfaToken) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/mfa/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfa_token: mfaToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.detail === 'string' ? data.detail : 'No se pudo enviar SMS');
        return;
      }
      setSmsHint(
        data.stub_code
          ? `SMS stub (dev): usa el código ${data.stub_code}`
          : `Código enviado a ${data.phone_masked || phoneMasked || 'tu móvil'}`,
      );
    } catch {
      setError('Error al enviar SMS');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfa_token: mfaToken, method: mfaMethod, code: mfaCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setError(typeof data.detail === 'string' ? data.detail : 'Código incorrecto');
        return;
      }
      await finishLogin(data);
    } catch {
      setError('Error verificando el código');
    } finally {
      setSubmitting(false);
    }
  };

  if (mfaToken) {
    return (
      <div style={{ maxWidth: 420, margin: '80px auto', padding: 40, border: '1px solid #e2e8f0', borderRadius: 16, background: 'white', fontFamily: 'sans-serif' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Verificación</h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 24, fontSize: 14, lineHeight: 1.45 }}>
          Paso 2 de seguridad. Preferimos <strong>Authenticator (TOTP)</strong>; SMS solo como respaldo.
        </p>

        {mfaMethods.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {mfaMethods.includes('totp') && (
              <button
                type="button"
                onClick={() => setMfaMethod('totp')}
                style={{
                  flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0',
                  background: mfaMethod === 'totp' ? '#0f172a' : 'white',
                  color: mfaMethod === 'totp' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Authenticator
              </button>
            )}
            {mfaMethods.includes('sms') && (
              <button
                type="button"
                onClick={() => setMfaMethod('sms')}
                style={{
                  flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0',
                  background: mfaMethod === 'sms' ? '#0f172a' : 'white',
                  color: mfaMethod === 'sms' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer',
                }}
              >
                SMS respaldo
              </button>
            )}
          </div>
        )}

        <form onSubmit={verifyMfa}>
          {mfaMethod === 'sms' && (
            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={sendSmsCode}
                disabled={submitting}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
              >
                Enviar código a {phoneMasked || 'móvil'}
              </button>
              {smsHint && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{smsHint}</div>}
            </div>
          )}
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            Código de 6 dígitos
          </label>
          <input
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="000000"
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 20, letterSpacing: 6, textAlign: 'center', marginBottom: 16 }}
          />
          {error && (
            <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || mfaCode.length < 6}
            style={{
              width: '100%', padding: 12, background: '#635bff', color: 'white', border: 'none',
              borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? '…' : 'Verificar y entrar'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setMfaToken(null);
            setMfaCode('');
            setError('');
          }}
          style={{ width: '100%', marginTop: 16, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}
        >
          ← Volver al login
        </button>
      </div>
    );
  }

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
            <input value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            {t('login.email')}
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
            {t('login.password')}
          </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>
              {t('login.iAmA')}
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}>
              <option value="self_owner">{t('login.businessOwner')}</option>
              <option value="accountant">{t('login.accountant')}</option>
            </select>
          </div>
        )}

        {error && (
          <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '12px',
            background: '#635bff',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? '…' : mode === 'login' ? t('login.signIn') : t('login.createAccountBtn')}
        </button>
      </form>

      {mode === 'login' && (
        <button
          type="button"
          disabled={submitting || !email}
          onClick={async () => {
            setError('');
            setSubmitting(true);
            try {
              const begin = await fetch(`${API}/api/v1/auth/passkey/login/begin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              });
              const beginData = await begin.json();
              if (!begin.ok) throw new Error(beginData.detail || 'Sin passkey para esta cuenta');
              const publicKey = beginData.publicKey;
              const decode = (v: string) => {
                const pad = '='.repeat((4 - (v.length % 4)) % 4);
                const b64 = (v + pad).replace(/-/g, '+').replace(/_/g, '/');
                const raw = atob(b64);
                const arr = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
                return arr.buffer;
              };
              publicKey.challenge = decode(publicKey.challenge);
              if (publicKey.allowCredentials) {
                publicKey.allowCredentials = publicKey.allowCredentials.map((c: any) => ({
                  ...c,
                  id: decode(c.id),
                }));
              }
              const cred = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential;
              const resp = cred.response as AuthenticatorAssertionResponse;
              const encode = (buf: ArrayBuffer) => {
                const bytes = new Uint8Array(buf);
                let s = '';
                bytes.forEach((b) => { s += String.fromCharCode(b); });
                return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
              };
              const fin = await fetch(`${API}/api/v1/auth/passkey/login/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email,
                  credential: {
                    id: cred.id,
                    rawId: encode(cred.rawId),
                    type: cred.type,
                    response: {
                      clientDataJSON: encode(resp.clientDataJSON),
                      authenticatorData: encode(resp.authenticatorData),
                      signature: encode(resp.signature),
                      userHandle: resp.userHandle ? encode(resp.userHandle) : null,
                    },
                  },
                }),
              });
              const data = await fin.json();
              if (!fin.ok || !data.token) throw new Error(data.detail || 'Passkey rechazado');
              await finishLogin(data);
            } catch (e: any) {
              setError(e.message || 'Passkey no disponible');
            } finally {
              setSubmitting(false);
            }
          }}
          style={{
            width: '100%', marginTop: 12, padding: 12, borderRadius: 8,
            border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Entrar con passkey / Face ID
        </button>
      )}

      <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 }}>
        {mode === 'login' ? t('login.noAccount') : t('login.hasAccount')}
        <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ color: '#635bff', fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'login' ? t('login.register') : t('login.signIn')}
        </span>
      </p>
    </div>
  );
}
