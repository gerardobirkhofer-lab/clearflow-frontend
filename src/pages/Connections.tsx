import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StripeConnect from '../components/StripeConnect';

type StorageChoice = 'clearflow' | 'own';

type ConnectionsState = {
  storage: StorageChoice;
  mercado_pago: boolean;
  tpv: boolean;
  booking: boolean;
  bank_waiting: boolean;
};

const EMPTY: ConnectionsState = {
  storage: 'clearflow',
  mercado_pago: false,
  tpv: false,
  booking: false,
  bank_waiting: false,
};

const API = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  'Content-Type': 'application/json',
});

export default function Connections() {
  const navigate = useNavigate();
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null') as { id?: string } | null;
  const [choice, setChoice] = useState<ConnectionsState>(EMPTY);
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
              bank_waiting: !!saved.bank_waiting,
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
      if (done) navigate('/hub');
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

  return (
    <div style={{ minHeight: '100vh', background: '#eef2ff', fontFamily: 'sans-serif', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 8px 30px rgba(15,23,42,0.06)' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Conecta de dónde llega el dinero</h1>
        <p style={{ color: '#64748b', marginTop: 8 }}>
          El grupo ya está guardado. Ahora elige la nube y conecta Stripe, el banco y Mercado Pago. Puedes dejar para después lo que todavía no tengas.
        </p>

        <section style={{ marginTop: 28 }}>
          <h2 style={sectionTitle}>Dónde se guardan los documentos</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            <Choice
              title="Nube de ClearFlow"
              body="Los documentos se guardan en nuestro almacenamiento."
              selected={choice.storage === 'clearflow'}
              disabled={saving}
              onClick={() => update({ storage: 'clearflow' })}
            />
            <Choice
              title="Tu propia nube"
              body="Google Drive, Dropbox o el almacenamiento de tu empresa."
              selected={choice.storage === 'own'}
              disabled={saving}
              onClick={() => update({ storage: 'own' })}
            />
          </div>
          {choice.storage === 'own' && (
            <p style={noteStyle}>Tu nube queda anotada. Hasta que esa conexión esté abierta, los documentos siguen en la nube de ClearFlow.</p>
          )}
        </section>

        <section style={{ marginTop: 28 }}>
          <h2 style={sectionTitle}>Stripe</h2>
          <p style={helpStyle}>La clave solo se usa para leer cobros. No mueve dinero.</p>
          {tenant?.id ? <StripeConnect tenantId={tenant.id} /> : (
            <p style={noteStyle}>No encontramos la empresa de esta sesión. Vuelve a entrar para conectar Stripe.</p>
          )}
        </section>

        <section style={{ marginTop: 8 }}>
          <h2 style={sectionTitle}>Banco, solo lectura</h2>
          <p style={helpStyle}>
            La conexión con el banco pide un permiso de solo lectura: ClearFlow ve los movimientos y no puede hacer pagos ni transferencias.
            {bankStatus === 'unavailable' ? ' Esa autorización todavía no está abierta.' : ' Ya se puede pedir.'}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => update({ bank_waiting: !choice.bank_waiting })}
            style={choice.bank_waiting ? selectedPill : pill}
          >
            {choice.bank_waiting ? 'Te avisaremos cuando se pueda conectar' : 'Avísame cuando se pueda'}
          </button>
        </section>

        <section style={{ marginTop: 28 }}>
          <h2 style={sectionTitle}>Otros cobros</h2>
          <p style={helpStyle}>Si los usas, los anotamos. La conexión todavía no está abierta.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" disabled={saving} onClick={() => update({ mercado_pago: !choice.mercado_pago })} style={choice.mercado_pago ? selectedPill : pill}>
              Mercado Pago
            </button>
            <button type="button" disabled={saving} onClick={() => update({ tpv: !choice.tpv })} style={choice.tpv ? selectedPill : pill}>
              TPV / Redsys
            </button>
            <button type="button" disabled={saving} onClick={() => update({ booking: !choice.booking })} style={choice.booking ? selectedPill : pill}>
              Booking
            </button>
          </div>
        </section>

        {notice && <p style={{ marginTop: 16, color: '#166534' }}>{notice}</p>}
        {error && <p style={{ marginTop: 16, color: '#991b1b' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
          <button type="button" disabled={saving} onClick={() => save(choice, true)} style={primaryButton}>
            {saving ? 'Guardando...' : 'Ir al inicio'}
          </button>
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

const sectionTitle = { margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' };
const helpStyle = { color: '#64748b', margin: '0 0 12px', fontSize: 14 };
const noteStyle = { marginTop: 12, padding: 12, borderRadius: 12, background: '#f8fafc', color: '#475569', fontSize: 14 };
const pill = { padding: '8px 12px', borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700 };
const selectedPill = { ...pill, border: '1px solid #635bff', background: '#eef2ff', color: '#4338ca' };
const primaryButton = { padding: '12px 18px', borderRadius: 10, border: 'none', background: '#635bff', color: 'white', fontWeight: 800, cursor: 'pointer' };
