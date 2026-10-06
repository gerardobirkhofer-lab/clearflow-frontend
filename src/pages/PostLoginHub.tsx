import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

type SavedDay = {
  day: string;
  matched_count: number;
  matched_amount: number;
  open_bank_count: number;
  open_provider_count: number;
};

type StatusMatch = {
  settlement?: {
    fee_difference?: number;
    days_late?: number;
  };
};

const toolGroups = [
  {
    label: 'Mirar el negocio',
    items: [
      { title: 'Dashboard', path: '/dashboard' },
      { title: 'Estadísticas', path: '/statistics' },
      { title: 'Rentabilidad', path: '/profitability' },
      { title: 'Control de ingresos', path: '/revenue-control' },
    ],
  },
  {
    label: 'Cuando algo no cuadra',
    items: [
      { title: 'Discrepancias', path: '/mismatch-tracker' },
      { title: 'Disputas', path: '/dispute-tracker' },
      { title: 'Comunicaciones', path: '/communications' },
      { title: 'Informes', path: '/reports' },
    ],
  },
  {
    label: 'La cuenta',
    items: [
      { title: 'Configura tu grupo', path: '/guided-setup' },
      { title: 'Contrato', path: '/contrato' },
      { title: 'Configuración', path: '/setup' },
      { title: 'Cambiar tienda', path: '/tenant-selector' },
      { title: 'Planes y precios', path: '/pricing' },
    ],
  },
];

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };
}

function dayLabel(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function euros(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function openCount(day: SavedDay) {
  return day.open_bank_count + day.open_provider_count;
}

function dayAnswer(day: SavedDay) {
  const open = openCount(day);
  if (day.matched_count === 0 && open === 0) return 'Ese día no tiene movimientos.';
  if (open === 0) return 'Ese día está cerrado: todo lo subido coincidió.';
  if (day.matched_count === 0) return 'Ese día sigue abierto: nada coincidió todavía.';
  return 'Parte coincidió y parte sigue abierta.';
}

function feeSentence(matched: StatusMatch[]) {
  if (matched.length === 0) return null;
  const checked = matched.filter((item) => item.settlement);
  if (checked.length === 0) {
    return 'Todavía no hay un contrato confirmado, así que la comisión no se compara.';
  }
  const short = checked.filter((item) => (item.settlement?.fee_difference || 0) > 0.01).length;
  const late = checked.filter((item) => (item.settlement?.days_late || 0) > 0).length;
  if (short === 0 && late === 0) {
    return 'En lo ya conciliado, la comisión y el plazo coinciden con el contrato.';
  }
  const parts: string[] = [];
  if (short === 1) parts.push('1 cobro llegó por debajo del contrato');
  else if (short > 1) parts.push(`${short} cobros llegaron por debajo del contrato`);
  if (late === 1) parts.push('1 cobro llegó más tarde de lo pactado');
  else if (late > 1) parts.push(`${late} cobros llegaron más tarde de lo pactado`);
  return `En lo ya conciliado, ${parts.join(' y ')}.`;
}

function leave() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('clearflow') || key === 'token' || key === 'user' || key === 'tenant' || key === 'onboardingComplete') {
      localStorage.removeItem(key);
    }
  });
  window.location.href = '/';
}

export default function PostLoginHub() {
  const navigate = useNavigate();
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const setupComplete = !!tenant?.id && !!localStorage.getItem('onboardingComplete');
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<SavedDay[]>([]);
  const [feeNote, setFeeNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!setupComplete) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [daysRes, statusRes] = await Promise.all([
          fetch(`${API}/api/v1/reconciliation/days?tenant_id=${tenant.id}`, { headers: authHeaders() }),
          fetch(`${API}/api/v1/reconciliation/status?tenant_id=${tenant.id}`, { headers: authHeaders() }),
        ]);
        if (daysRes.status === 401 || statusRes.status === 401) {
          throw new Error('La sesión caducó. Entra otra vez.');
        }
        if (!daysRes.ok) throw new Error('No se pudo leer los días guardados.');
        const daysData = await daysRes.json();
        if (cancelled) return;
        setDays(daysData.items || []);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setFeeNote(feeSentence(statusData.matched || []));
        } else {
          setFeeNote(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setDays([]);
          setFeeNote(null);
          setError(err instanceof Error ? err.message : 'No se pudo leer el estado.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [setupComplete, tenant?.id]);

  if (!setupComplete) {
    return (
      <main style={pageStyle}>
        <div style={panelStyle}>
          <h1 style={titleStyle}>Falta terminar la configuración</h1>
          <p style={leadStyle}>Antes de mirar si el dinero llegó, di cuántos negocios cobran.</p>
          <button type="button" onClick={() => navigate('/guided-setup')} style={primaryButton}>
            Ir a la configuración
          </button>
        </div>
      </main>
    );
  }

  const latest = days[0];

  return (
    <main style={pageStyle}>
      <div style={panelStyle}>
        <p style={eyebrowStyle}>Inicio</p>
        <h1 style={titleStyle}>¿Llegó el dinero?</h1>
        {tenant?.name && <p style={whereStyle}>Estás en {tenant.name}.</p>}
        <p style={leadStyle}>
          Sube el cierre del datáfono y la línea del banco de un día que ya conoces.
          Aquí ves cuánto coincidió, cuánto sigue abierto y si la comisión cuadra con el contrato.
        </p>

        <section style={answerStyle} aria-label="Días guardados">
          {loading && <p style={mutedStyle}>Mirando los días guardados…</p>}
          {!loading && error && <p style={errorStyle}>{error}</p>}
          {!loading && !error && days.length === 0 && (
            <p style={mutedStyle}>Todavía no hay un día guardado.</p>
          )}
          {!loading && !error && latest && (
            <>
              <p style={answerKicker}>Último día guardado · {dayLabel(latest.day)}</p>
              <p style={answerHeadline}>{dayAnswer(latest)}</p>
              <div style={countRow}>
                <div>
                  <div style={countNumber}>{latest.matched_count}</div>
                  <div style={countLabel}>conciliadas</div>
                </div>
                <div>
                  <div style={countNumber}>{openCount(latest)}</div>
                  <div style={countLabel}>abiertas</div>
                </div>
                <div>
                  <div style={countNumber}>{euros(latest.matched_amount)}</div>
                  <div style={countLabel}>conciliado</div>
                </div>
              </div>
              {feeNote && <p style={feeStyle}>{feeNote}</p>}
              {days.length > 1 && (
                <div style={{ marginTop: 16 }}>
                  {days.slice(1, 7).map((day) => (
                    <div key={day.day} style={olderDayStyle}>
                      <span>{dayLabel(day.day)}</span>
                      <span>{day.matched_count} conciliadas · {openCount(day)} abiertas</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <div style={actionsStyle}>
          <button type="button" onClick={() => navigate('/smartcheck-wizard')} style={primaryButton}>
            Subir el cierre y el banco
          </button>
          <Link to="/reconciliation" style={textLink}>Ver el detalle de los cobros</Link>
        </div>

        <section style={{ marginTop: 36 }} aria-label="Otras herramientas">
          <h2 style={toolsHeading}>Otras herramientas</h2>
          <p style={mutedStyle}>El resto sigue aquí, cuando lo necesites.</p>
          <div style={groupGrid}>
            {toolGroups.map((group) => (
              <div key={group.label}>
                <div style={groupLabel}>{group.label}</div>
                <ul style={toolList}>
                  {group.items.map((item) => (
                    <li key={item.path}>
                      <Link to={item.path} style={toolLink}>{item.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div style={footerStyle}>
          <button type="button" onClick={() => navigate('/tenant-selector')} style={quietButton}>Cambiar empresa</button>
          <button type="button" onClick={leave} style={quietButton}>Salir</button>
        </div>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f8fafc',
  fontFamily: 'sans-serif',
  padding: '32px 16px 64px',
  color: '#0f172a',
};

const panelStyle = { maxWidth: 720, margin: '0 auto' };

const eyebrowStyle = {
  margin: '0 0 8px',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase' as const,
  color: '#635bff',
};

const titleStyle = { margin: 0, fontSize: 32, fontWeight: 800, lineHeight: 1.15 };

const whereStyle = { margin: '10px 0 0', fontSize: 14, color: '#64748b' };

const leadStyle = { margin: '12px 0 0', fontSize: 16, lineHeight: 1.5, color: '#334155', maxWidth: 620 };

const answerStyle = {
  marginTop: 24,
  padding: 20,
  borderRadius: 16,
  background: 'white',
  border: '1px solid #e2e8f0',
};

const answerKicker = { margin: 0, fontSize: 13, fontWeight: 700, color: '#64748b' };

const answerHeadline = { margin: '8px 0 0', fontSize: 20, fontWeight: 800 };

const countRow = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 16 };

const countNumber = { fontSize: 22, fontWeight: 800 };

const countLabel = { fontSize: 13, color: '#64748b', marginTop: 2 };

const feeStyle = { margin: '16px 0 0', fontSize: 14, lineHeight: 1.45, color: '#0f172a' };

const olderDayStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  fontSize: 14,
  padding: '8px 0',
  borderTop: '1px solid #f1f5f9',
  color: '#334155',
};

const mutedStyle = { margin: '8px 0 0', fontSize: 14, color: '#64748b', lineHeight: 1.45 };

const errorStyle = { margin: 0, fontSize: 14, color: '#991b1b' };

const actionsStyle = { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 16, marginTop: 20 };

const primaryButton = {
  padding: '12px 18px',
  borderRadius: 10,
  border: 'none',
  background: '#635bff',
  color: 'white',
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
};

const textLink = { color: '#4338ca', fontWeight: 700, fontSize: 14 };

const toolsHeading = { margin: 0, fontSize: 16, fontWeight: 800 };

const groupGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginTop: 16 };

const groupLabel = { fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 0.3 };

const toolList = { listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 8 };

const toolLink = { color: '#334155', fontSize: 14, fontWeight: 600, textDecoration: 'none' };

const footerStyle = { display: 'flex', gap: 8, marginTop: 28 };

const quietButton = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: 'white',
  color: '#64748b',
  fontWeight: 700,
  cursor: 'pointer',
};
