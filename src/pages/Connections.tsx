import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StripeConnect from '../components/StripeConnect';
import ProductEditor from '../components/ProductEditor';

type StorageChoice = 'clearflow' | 'own';
type ProviderKey = 'tpv' | 'mercado_pago' | 'booking' | 'glovo';

type ClaimsEmails = {
  stripe: string;
  tpv: string;
  mercado_pago: string;
  booking: string;
  glovo: string;
};

type ConnectionsState = {
  storage: StorageChoice;
  mercado_pago: boolean;
  tpv: boolean;
  booking: boolean;
  glovo: boolean;
  bank_waiting: boolean;
  claims_email: string;
  claims_emails: ClaimsEmails;
  accountant_email: string;
};

const EMPTY_EMAILS: ClaimsEmails = {
  stripe: '',
  tpv: '',
  mercado_pago: '',
  booking: '',
  glovo: '',
};

const EMPTY: ConnectionsState = {
  storage: 'clearflow',
  mercado_pago: false,
  tpv: false,
  booking: false,
  glovo: false,
  bank_waiting: false,
  claims_email: '',
  claims_emails: EMPTY_EMAILS,
  accountant_email: '',
};

const STEPS = ['Nube', 'Banco', 'Proveedores', 'Productos', 'Listo'];

const PROVIDERS: { key: ProviderKey; label: string; body: string }[] = [
  { key: 'tpv', label: 'Redsys', body: 'Cada comercio abre su portal Canales. El email es el de las reclamaciones de Redsys.' },
  { key: 'mercado_pago', label: 'Mercado Pago', body: 'El email es el de las reclamaciones de Mercado Pago.' },
  { key: 'booking', label: 'Booking', body: 'El email es el de las reclamaciones de Booking.' },
  { key: 'glovo', label: 'Glovo y apps de pedidos', body: 'El email es el de las reclamaciones de esa app.' },
];

const API = import.meta.env.VITE_API_URL || '';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  'Content-Type': 'application/json',
});

const emailsFrom = (saved: Record<string, unknown>): ClaimsEmails => {
  const raw = saved.claims_emails;
  const next = { ...EMPTY_EMAILS };
  if (raw && typeof raw === 'object') {
    for (const key of Object.keys(next) as (keyof ClaimsEmails)[]) {
      const value = (raw as Record<string, unknown>)[key];
      if (typeof value === 'string') next[key] = value;
    }
  }
  return next;
};

export default function Connections() {
  const navigate = useNavigate();
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null') as { id?: string } | null;
  const [choice, setChoice] = useState<ConnectionsState>(EMPTY);
  const [step, setStep] = useState(0);
  const [bankStatus, setBankStatus] = useState('unavailable');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [profileRes, bankRes] = await Promise.all([
          fetch(`${API}/api/v1/account/profile`, { headers: authHeaders() }),
          fetch(`${API}/api/v1/institutions`, { headers: authHeaders() }),
        ]);
        if (cancelled) return;
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const saved = profile?.payload?.connections;
          if (saved && typeof saved === 'object') {
            setChoice({
              storage: saved.storage === 'own' ? 'own' : 'clearflow',
              mercado_pago: !!saved.mercado_pago,
              tpv: !!saved.tpv,
              booking: !!saved.booking,
              glovo: !!saved.glovo,
              bank_waiting: !!saved.bank_waiting,
              claims_email: typeof saved.claims_email === 'string' ? saved.claims_email : '',
              claims_emails: emailsFrom(saved),
              accountant_email: typeof saved.accountant_email === 'string' ? saved.accountant_email : '',
            });
          }
        }
        if (bankRes.ok) {
          const bank = await bankRes.json();
          setBankStatus(bank.bank_connection || 'unavailable');
        }
      } catch {
        if (!cancelled) setError('No se pudieron leer las conexiones.');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (next: ConnectionsState, done: boolean) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const profileRes = await fetch(`${API}/api/v1/account/profile`, { headers: authHeaders() });
      const profile = profileRes.ok ? await profileRes.json() : { payload: {} };
      const payload = { ...(profile.payload || {}), connections: next };
      const response = await fetch(`${API}/api/v1/account/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ payload, onboarding_complete: true }),
      });
      if (!response.ok) {
        setError('No se pudieron guardar las conexiones.');
        setSaving(false);
        return;
      }
      localStorage.setItem('onboardingComplete', 'true');
      setChoice(next);
      setSaving(false);
      if (done) navigate('/panel');
      else setNotice('Guardado.');
    } catch {
      setError('No se pudo contactar el servidor.');
      setSaving(false);
    }
  };

  const update = (patch: Partial<ConnectionsState>) => {
    if (saving) return;
    const next = { ...choice, ...patch };
    setChoice(next);
    save(next, false);
  };

  const setClaimEmail = (key: keyof ClaimsEmails, value: string) => {
    setChoice((current) => ({ ...current, claims_emails: { ...current.claims_emails, [key]: value } }));
  };

  const commitClaimEmail = (key: keyof ClaimsEmails, value: string) => {
    const next = { ...choice, claims_emails: { ...choice.claims_emails, [key]: value } };
    setChoice(next);
    save(next, false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#eef2ff', fontFamily: 'sans-serif', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {STEPS.map((label, index) => (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ height: 6, borderRadius: 99, background: index <= step ? '#635bff' : '#e2e8f0' }} />
              <div style={{ fontSize: 11, color: index === step ? '#4338ca' : '#94a3b8', marginTop: 6, fontWeight: 700 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 8px 30px rgba(15,23,42,0.06)' }}>
          {step === 0 && (
            <>
              <h1 style={title}>Dónde se guardan los documentos</h1>
              <p style={help}>La estructura de negocios, empresas y cuentas ya está. Esto se hace una vez.</p>
              <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                <Choice title="Nube de ClearFlow" body="Los documentos se guardan en nuestro almacenamiento." selected={choice.storage === 'clearflow'} disabled={saving} onClick={() => update({ storage: 'clearflow' })} />
                <Choice title="Tu propia nube" body="Google Drive, Dropbox o el almacenamiento de tu empresa." selected={choice.storage === 'own'} disabled={saving} onClick={() => update({ storage: 'own' })} />
              </div>
              {choice.storage === 'own' && (
                <p style={note}>Tu nube queda anotada. Hasta que esa conexión esté abierta, los documentos siguen en la nube de ClearFlow.</p>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h1 style={title}>El banco, solo lectura</h1>
              <p style={help}>
                ClearFlow ve los movimientos y no puede hacer pagos ni transferencias.
                {bankStatus === 'unavailable' ? ' Esa autorización todavía no está abierta.' : ' Ya se puede pedir.'}
              </p>
              <button type="button" disabled={saving} onClick={() => update({ bank_waiting: !choice.bank_waiting })} style={choice.bank_waiting ? selectedPill : pill}>
                {choice.bank_waiting ? 'Te avisaremos cuando se pueda conectar' : 'Avísame cuando se pueda'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={title}>Proveedores de cobro</h1>
              <p style={help}>Cada uno tiene su propio lugar para reclamar. El email es el de ese proveedor.</p>
              <section style={{ marginTop: 8 }}>
                <h2 style={sectionTitle}>Stripe</h2>
                <p style={help}>La clave solo se usa para leer cobros. No mueve dinero.</p>
                {tenant?.id ? <StripeConnect tenantId={tenant.id} /> : (
                  <p style={note}>No encontramos la empresa de esta sesión. Vuelve a entrar para conectar Stripe.</p>
                )}
                <label style={emailLabel}>
                  Email para reclamaciones de Stripe
                  <input aria-label="Email para reclamaciones de Stripe" type="email" value={choice.claims_emails.stripe} placeholder="reclamaciones@stripe.com" onChange={(event) => setClaimEmail('stripe', event.target.value)} onBlur={(event) => commitClaimEmail('stripe', event.target.value)} style={emailField} />
                </label>
              </section>
              <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
                {PROVIDERS.map((provider) => {
                  const on = choice[provider.key];
                  return (
                    <div key={provider.key} style={{ padding: 14, borderRadius: 12, border: on ? '2px solid #635bff' : '1px solid #e2e8f0' }}>
                      <button type="button" disabled={saving} onClick={() => update({ [provider.key]: !on })} style={{ ...pill, border: 'none', background: 'transparent', padding: 0 }}>
                        {on ? 'Conectado · ' : 'Anotar · '}{provider.label}
                      </button>
                      <p style={{ ...help, marginTop: 6 }}>{provider.body}</p>
                      {on && (
                        <label style={emailLabel}>
                          Email para reclamaciones de {provider.label}
                          <input aria-label={`Email para reclamaciones de ${provider.label}`} type="email" value={choice.claims_emails[provider.key]} placeholder="reclamaciones@proveedor.com" onChange={(event) => setClaimEmail(provider.key, event.target.value)} onBlur={(event) => commitClaimEmail(provider.key, event.target.value)} style={emailField} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p style={banner}>Esta información es necesaria para armar Horizonte y Salud de Caja.</p>
              <h1 style={title}>Productos</h1>
              <p style={help}>Precio y costo, una vez para todo el grupo. Si hoy no los tienes, sigues y los cargas después.</p>
              <ProductEditor />
            </>
          )}

          {step === 4 && (
            <>
              <h1 style={{ ...title, letterSpacing: 0.3 }}>¡ENHORABUENA, FELICITACIONES!</h1>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#166534', marginTop: 12 }}>A chequear.</p>
              <p style={help}>La info entra de todos lados. El día a día es el Dashboard, la Caja y Horizonte.</p>
              <label style={emailLabel}>
                Correo del contable
                <input aria-label="Correo del contable" type="email" value={choice.accountant_email} placeholder="contable@empresa.com" onChange={(event) => setChoice({ ...choice, accountant_email: event.target.value })} onBlur={() => save(choice, false)} style={emailField} />
              </label>
            </>
          )}

          {notice && step < 4 && <p style={{ marginTop: 16, color: '#166534' }}>{notice}</p>}
          {error && <p style={{ marginTop: 16, color: '#991b1b' }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
            <button type="button" disabled={step === 0 || saving} onClick={() => { setNotice(''); setStep((current) => Math.max(0, current - 1)); }} style={secondary}>Atrás</button>
            {step < 4 && (
              <button type="button" disabled={saving} onClick={() => { setNotice(''); setStep((current) => current + 1); }} style={primary}>Continuar</button>
            )}
            {step === 4 && (
              <button type="button" disabled={saving} onClick={() => save(choice, true)} style={primary}>{saving ? 'Guardando...' : 'A chequear'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Choice({ title, body, selected, disabled, onClick }: { title: string; body: string; selected: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} style={{ textAlign: 'left', padding: 14, borderRadius: 12, border: selected ? '2px solid #635bff' : '1px solid #e2e8f0', background: selected ? '#f5f3ff' : 'white', cursor: 'pointer' }}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{body}</div>
    </button>
  );
}

const title = { margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' };
const sectionTitle = { margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' };
const help = { color: '#64748b', margin: '8px 0 12px', fontSize: 14 };
const note = { marginTop: 12, padding: 12, borderRadius: 12, background: '#f8fafc', color: '#475569', fontSize: 14 };
const banner = { margin: '0 0 14px', background: '#eef2ff', color: '#312e81', borderRadius: 12, padding: '12px 14px', fontWeight: 800 };
const pill = { padding: '8px 12px', borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700 };
const selectedPill = { ...pill, border: '1px solid #635bff', background: '#eef2ff', color: '#4338ca' };
const primary = { padding: '12px 18px', borderRadius: 10, border: 'none', background: '#635bff', color: 'white', fontWeight: 800, cursor: 'pointer' };
const secondary = { padding: '12px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer' };
const emailLabel = { display: 'grid', gap: 6, marginTop: 10, fontSize: 13, fontWeight: 700, color: '#334155' };
const emailField = { padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 500 };
