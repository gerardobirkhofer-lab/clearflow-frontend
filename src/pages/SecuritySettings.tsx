import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsStub, setSmsStub] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API}/api/v1/auth/mfa/status`, { headers: getAuth() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
      setStatus(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setupTotp = async () => {
    setMsg(null);
    setErr(null);
    const res = await fetch(`${API}/api/v1/auth/mfa/totp/setup`, {
      method: 'POST',
      headers: getAuth(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.detail || 'No se pudo generar TOTP');
      return;
    }
    setSecret(data.secret);
    setOtpauth(data.otpauth_url);
    setMsg('Escanea el QR con tu app Authenticator y confirma con un código.');
  };

  const enableTotp = async () => {
    setErr(null);
    const res = await fetch(`${API}/api/v1/auth/mfa/totp/enable`, {
      method: 'POST',
      headers: { ...getAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: totpCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.detail || 'Código inválido');
      return;
    }
    setMsg(data.message);
    setOtpauth(null);
    setSecret(null);
    setTotpCode('');
    await load();
  };

  const disableTotp = async () => {
    const code = window.prompt('Código Authenticator (o deja vacío y usa contraseña en el siguiente paso)') || '';
    let password = '';
    if (!code) password = window.prompt('Contraseña de la cuenta') || '';
    const res = await fetch(`${API}/api/v1/auth/mfa/totp/disable`, {
      method: 'POST',
      headers: { ...getAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.detail || 'No se pudo desactivar');
      return;
    }
    setMsg(data.message);
    await load();
  };

  const setupSms = async () => {
    setErr(null);
    const res = await fetch(`${API}/api/v1/auth/mfa/sms/setup`, {
      method: 'POST',
      headers: { ...getAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.detail || 'No se pudo enviar SMS');
      return;
    }
    setSmsStub(data.stub_code || null);
    setMsg(data.message);
  };

  const enableSms = async () => {
    setErr(null);
    const res = await fetch(`${API}/api/v1/auth/mfa/sms/enable`, {
      method: 'POST',
      headers: { ...getAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: smsCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.detail || 'Código SMS inválido');
      return;
    }
    setMsg(data.message);
    setSmsCode('');
    setSmsStub(null);
    await load();
  };

  const qrSrc = otpauth
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauth)}`
    : null;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Seguridad</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Acceso a tu cuenta</h1>
        <p style={{ color: '#64748b', marginTop: 8, lineHeight: 1.5 }}>
          1) Email + contraseña · 2) <strong>Authenticator (TOTP)</strong> recomendado · 3) SMS solo como respaldo.
          Face ID desbloquea el teléfono/app localmente; no sustituye el segundo factor del servidor.
        </p>
      </div>

      {loading && <div style={{ color: '#64748b' }}>Cargando…</div>}
      {err && <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, marginBottom: 12 }}>{err}</div>}
      {msg && <div style={{ padding: 12, background: '#ecfdf5', color: '#166534', borderRadius: 8, marginBottom: 12 }}>{msg}</div>}

      {status && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>1. Contraseña</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Ya activa en el login.</div>
          </div>

          <div style={{ padding: 20, borderRadius: 12, border: status.totp_enabled ? '1px solid #bbf7d0' : '1px solid #e2e8f0', background: status.totp_enabled ? '#f0fdf4' : 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 800 }}>2. Authenticator (TOTP) — principal</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  {status.totp_enabled ? 'Activado' : 'No activado'} · Google Authenticator, Authy, 1Password…
                </div>
              </div>
              {status.totp_enabled ? (
                <button type="button" onClick={disableTotp} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2', color: '#991b1b', fontWeight: 600, cursor: 'pointer' }}>
                  Desactivar
                </button>
              ) : (
                <button type="button" onClick={setupTotp} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#635bff', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  Configurar
                </button>
              )}
            </div>

            {otpauth && (
              <div style={{ marginTop: 16, display: 'grid', gap: 12, justifyItems: 'start' }}>
                {qrSrc && <img src={qrSrc} alt="QR TOTP" width={220} height={220} style={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />}
                <div style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>
                  Clave manual: <code>{secret}</code>
                </div>
                <input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Código de 6 dígitos"
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', width: 200 }}
                />
                <button type="button" onClick={enableTotp} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#166534', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  Confirmar y activar
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ fontWeight: 800 }}>3. SMS de respaldo</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 12 }}>
              {status.sms_backup_enabled
                ? `Activo · ${status.phone_masked}`
                : 'Opcional si pierdes el Authenticator. Menos seguro que TOTP.'}
            </div>
            {!status.sms_backup_enabled && (
              <div style={{ display: 'grid', gap: 10, maxWidth: 360 }}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                <button type="button" onClick={setupSms} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}>
                  Enviar código SMS
                </button>
                {smsStub && <div style={{ fontSize: 12, color: '#92400e' }}>Stub dev: {smsStub}</div>}
                <input
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Código SMS"
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
                <button type="button" onClick={enableSms} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  Confirmar SMS backup
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ fontWeight: 800 }}>Passkey (Face ID / Touch ID vía WebAuthn)</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 12 }}>
              Autenticación fuerte ante ClearFlow. En iPhone/Mac puede usar Face ID; no es lo mismo que solo desbloquear el móvil.
            </div>
            <button
              type="button"
              onClick={async () => {
                setErr(null);
                setMsg(null);
                try {
                  const begin = await fetch(`${API}/api/v1/auth/passkey/register/begin`, {
                    method: 'POST',
                    headers: getAuth(),
                  });
                  const beginData = await begin.json();
                  if (!begin.ok) throw new Error(beginData.detail || 'Passkeys no disponibles en servidor');
                  const publicKey = beginData.publicKey;
                  // Convert base64url fields for navigator.credentials
                  const decode = (v: string) => {
                    const pad = '='.repeat((4 - (v.length % 4)) % 4);
                    const b64 = (v + pad).replace(/-/g, '+').replace(/_/g, '/');
                    const raw = atob(b64);
                    const arr = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
                    return arr.buffer;
                  };
                  publicKey.challenge = decode(publicKey.challenge);
                  publicKey.user.id = decode(publicKey.user.id);
                  if (publicKey.excludeCredentials) {
                    publicKey.excludeCredentials = publicKey.excludeCredentials.map((c: any) => ({
                      ...c,
                      id: decode(c.id),
                    }));
                  }
                  const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
                  const att = cred.response as AuthenticatorAttestationResponse;
                  const encode = (buf: ArrayBuffer) => {
                    const bytes = new Uint8Array(buf);
                    let s = '';
                    bytes.forEach((b) => { s += String.fromCharCode(b); });
                    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                  };
                  const payload = {
                    nickname: 'Este dispositivo',
                    credential: {
                      id: cred.id,
                      rawId: encode(cred.rawId),
                      type: cred.type,
                      response: {
                        clientDataJSON: encode(att.clientDataJSON),
                        attestationObject: encode(att.attestationObject),
                      },
                    },
                  };
                  const fin = await fetch(`${API}/api/v1/auth/passkey/register/complete`, {
                    method: 'POST',
                    headers: { ...getAuth(), 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  const finData = await fin.json();
                  if (!fin.ok) throw new Error(finData.detail || 'No se pudo registrar passkey');
                  setMsg(finData.message);
                } catch (e: any) {
                  setErr(e.message || 'Passkey cancelado o no soportado en este navegador');
                }
              }}
              style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#635bff', color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              Registrar passkey en este dispositivo
            </button>
          </div>

          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
            Face ID solo para desbloquear el teléfono ≠ segundo factor. Passkey + Face ID sí autentica ante ClearFlow.
            Configura también <code>WEBAUTHN_RP_ID</code> / <code>WEBAUTHN_ORIGIN</code> en producción (dominio real).
          </p>
          <Link to="/hub" style={{ color: '#635bff', fontWeight: 600, fontSize: 14 }}>← Volver al hub</Link>
        </div>
      )}
    </div>
  );
}
