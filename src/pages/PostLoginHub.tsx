import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

type WaitingItem = {
  concept: string;
  amount: number;
  expected_date: string | null;
  overdue: boolean;
};

type Outlook = {
  checked_on: string | null;
  matched_count: number;
  matched_amount: number;
  open_count: number;
  open_amount: number;
  fee_checked: boolean;
  fee_matches: boolean | null;
  fee_short_count: number;
  fee_late_count: number;
  previous_day: string | null;
  previous_open_count: number | null;
  arrived_since_previous_amount: number | null;
  arrived_since_previous_count: number | null;
  waiting: WaitingItem[];
  waiting_count: number;
  waiting_amount: number;
  disputes_open_count: number;
  disputes_open_amount: number;
  disputes_resolved_count: number;
  disputes_resolved_amount: number;
  has_expenses: boolean;
  expenses_monthly: number;
  left_after_expenses: number;
};

const mainTools = [
  { title: 'Estadísticas', body: 'Cómo van las ventas y los cobros.', path: '/statistics' },
  { title: 'Flujo de caja', body: 'Lo que debe entrar y lo que sale cada mes.', path: '/flujo' },
  { title: 'Discrepancias', body: 'Lo que no cuadra, abierto y ya resuelto.', path: '/mismatch-tracker' },
  { title: 'Disputas', body: 'Reclamos abiertos y los que ya se cerraron.', path: '/dispute-tracker' },
];

const deeperTools = [
  { title: 'Informes', path: '/reports' },
  { title: 'Comunicaciones', path: '/communications' },
  { title: 'Dashboard', path: '/dashboard' },
  { title: 'Rentabilidad', path: '/profitability' },
  { title: 'Control de ingresos', path: '/revenue-control' },
  { title: 'Contrato', path: '/contrato' },
  { title: 'Configura tu grupo', path: '/guided-setup' },
  { title: 'Configuración', path: '/setup' },
  { title: 'Cambiar tienda', path: '/tenant-selector' },
  { title: 'Planes y precios', path: '/pricing' },
];

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };
}

function dayLabel(iso: string | null) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function euros(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function feeSentence(outlook: Outlook) {
  if (!outlook.fee_checked) {
    if (outlook.matched_count === 0) return null;
    return 'Todavía no hay un contrato confirmado, así que la comisión no se compara.';
  }
  if (outlook.fee_matches) return 'En lo ya conciliado, la comisión y el plazo coinciden con el contrato.';
  const parts: string[] = [];
  if (outlook.fee_short_count === 1) parts.push('1 cobro llegó por debajo del contrato');
  else if (outlook.fee_short_count > 1) parts.push(`${outlook.fee_short_count} cobros llegaron por debajo del contrato`);
  if (outlook.fee_late_count === 1) parts.push('1 cobro llegó más tarde de lo pactado');
  else if (outlook.fee_late_count > 1) parts.push(`${outlook.fee_late_count} cobros llegaron más tarde de lo pactado`);
  return parts.length ? `En lo ya conciliado, ${parts.join(' y ')}.` : null;
}

function arrivedSentence(outlook: Outlook) {
  if (!outlook.previous_day) return 'Esta es la primera comprobación.';
  const when = dayLabel(outlook.previous_day);
  const arrived = outlook.arrived_since_previous_amount || 0;
  if (arrived > 0) {
    const count = outlook.arrived_since_previous_count || 0;
    const pieces = count === 1 ? '1 cobro' : `${count} cobros`;
    return `Desde el ${when} entraron ${euros(arrived)} (${pieces}) que seguían abiertos.`;
  }
  if ((outlook.previous_open_count || 0) > 0) return `Desde el ${when} no entró nada nuevo de lo que seguía abierto.`;
  return `Desde el ${when} no había nada pendiente.`;
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
  const [outlook, setOutlook] = useState<Outlook | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!setupComplete) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const runRes = await fetch(`${API}/api/v1/reconciliation/run?tenant_id=${tenant.id}`, {
          method: 'POST',
          headers: authHeaders(),
        });
        if (runRes.status === 401) throw new Error('La sesión caducó. Entra otra vez.');
        const outlookRes = await fetch(`${API}/api/v1/expenses/outlook?tenant_id=${tenant.id}`, { headers: authHeaders() });
        if (outlookRes.status === 401) throw new Error('La sesión caducó. Entra otra vez.');
        if (!outlookRes.ok) throw new Error('No se pudo leer la comprobación.');
        const data = await outlookRes.json();
        if (!cancelled) setOutlook(data);
      } catch (err: unknown) {
        if (!cancelled) {
          setOutlook(null);
          setError(err instanceof Error ? err.message : 'No se pudo leer la comprobación.');
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

  const fee = outlook ? feeSentence(outlook) : null;

  return (
    <main style={pageStyle}>
      <div style={panelStyle}>
        <p style={eyebrowStyle}>Inicio</p>
        <h1 style={titleStyle}>¿Llegó el dinero?</h1>
        {tenant?.name && <p style={whereStyle}>Estás en {tenant.name}.</p>}
        <p style={leadStyle}>
          Al entrar se hace la comprobación con lo que ya está guardado. Aquí ves el resultado, lo que estaba pendiente y ya entró, y lo que queda después de tus gastos.
        </p>

        {loading && <p style={mutedStyle}>Comprobando los cobros…</p>}
        {!loading && error && <p style={errorStyle}>{error}</p>}

        {!loading && outlook && (
          <>
            <section style={answerStyle} aria-label="Comprobación de ahora">
              <p style={answerKicker}>Esta comprobación{outlook.checked_on ? ` · ${dayLabel(outlook.checked_on)}` : ''}</p>
              <p style={answerHeadline}>
                {outlook.matched_count === 0 && outlook.open_count === 0
                  ? 'No hay movimientos en esta comprobación.'
                  : outlook.open_count === 0
                    ? 'Todo lo guardado coincidió.'
                    : 'Parte coincidió y parte sigue abierta.'}
              </p>
              <div style={countRow}>
                <div>
                  <div style={countNumber}>{outlook.matched_count}</div>
                  <div style={countLabel}>conciliadas</div>
                </div>
                <div>
                  <div style={countNumber}>{outlook.open_count}</div>
                  <div style={countLabel}>abiertas</div>
                </div>
                <div>
                  <div style={countNumber}>{euros(outlook.matched_amount)}</div>
                  <div style={countLabel}>conciliado</div>
                </div>
              </div>
              {fee && <p style={feeStyle}>{fee}</p>}
              <div style={actionsStyle}>
                <button type="button" onClick={() => navigate('/smartcheck-wizard')} style={primaryButton}>
                  Subir el cierre y el banco
                </button>
                <Link to="/reconciliation" style={textLink}>Ver el detalle de los cobros</Link>
              </div>
            </section>

            <section style={answerStyle} aria-label="Lo que ya entró">
              <p style={answerKicker}>Lo que estaba pendiente</p>
              <p style={answerHeadline}>{arrivedSentence(outlook)}</p>
              {outlook.waiting_count === 0 ? (
                <p style={mutedStyle}>No queda ningún cobro pendiente.</p>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <p style={mutedStyle}>Sigue sin entrar {euros(outlook.waiting_amount)}.</p>
                  {outlook.waiting.map((item) => (
                    <div key={`${item.concept}-${item.expected_date}-${item.amount}`} style={olderDayStyle}>
                      <span>{item.concept}</span>
                      <span>
                        {euros(item.amount)}
                        {item.overdue && item.expected_date ? ` · debía llegar el ${dayLabel(item.expected_date)}` : ''}
                      </span>
                    </div>
                  ))}
                  {outlook.waiting_count > outlook.waiting.length && (
                    <p style={mutedStyle}>Y {outlook.waiting_count - outlook.waiting.length} cobros más.</p>
                  )}
                </div>
              )}
            </section>

            <section style={answerStyle} aria-label="Discrepancias y disputas">
              <p style={answerKicker}>Discrepancias y disputas</p>
              <div style={olderDayStyle}>
                <span>Discrepancias abiertas</span>
                <span>{outlook.open_count} · {euros(outlook.open_amount)}</span>
              </div>
              <div style={olderDayStyle}>
                <span>Discrepancias ya resueltas</span>
                <span>{outlook.matched_count} · {euros(outlook.matched_amount)}</span>
              </div>
              {outlook.disputes_open_count === 0 && outlook.disputes_resolved_count === 0 ? (
                <p style={mutedStyle}>No hay disputas.</p>
              ) : (
                <>
                  <div style={olderDayStyle}>
                    <span>Disputas abiertas</span>
                    <span>{outlook.disputes_open_count} · {euros(outlook.disputes_open_amount)}</span>
                  </div>
                  <div style={olderDayStyle}>
                    <span>Disputas ya resueltas</span>
                    <span>{outlook.disputes_resolved_count} · {euros(outlook.disputes_resolved_amount)}</span>
                  </div>
                </>
              )}
            </section>

            <section style={answerStyle} aria-label="Flujo de caja">
              <p style={answerKicker}>Flujo de caja</p>
              {outlook.has_expenses ? (
                <>
                  <div style={countRow}>
                    <div>
                      <div style={countNumber}>{euros(outlook.waiting_amount)}</div>
                      <div style={countLabel}>deben entrar</div>
                    </div>
                    <div>
                      <div style={countNumber}>{euros(outlook.expenses_monthly)}</div>
                      <div style={countLabel}>salen cada mes</div>
                    </div>
                    <div>
                      <div style={countNumber}>{euros(outlook.left_after_expenses)}</div>
                      <div style={countLabel}>quedarían</div>
                    </div>
                  </div>
                  <p style={feeStyle}>Quedarían es lo pendiente de entrar, menos los gastos aproximados del mes.</p>
                </>
              ) : (
                <p style={answerHeadline}>Añade el alquiler, los sueldos y el resto para ver qué queda.</p>
              )}
              <div style={actionsStyle}>
                <button type="button" onClick={() => navigate('/flujo')} style={primaryButton}>Ver el flujo de caja</button>
              </div>
            </section>
          </>
        )}

        <section style={{ marginTop: 28 }} aria-label="Para seguir">
          <div style={groupGrid}>
            {mainTools.map((tool) => (
              <button key={tool.path} type="button" onClick={() => navigate(tool.path)} style={toolButton}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{tool.title}</span>
                <span style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>{tool.body}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }} aria-label="Para mirar con calma">
          <h2 style={toolsHeading}>Para mirar con calma</h2>
          <ul style={toolList}>
            {deeperTools.map((item) => (
              <li key={item.path}>
                <Link to={item.path} style={toolLink}>{item.title}</Link>
              </li>
            ))}
          </ul>
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
const eyebrowStyle = { margin: '0 0 8px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' as const, color: '#635bff' };
const titleStyle = { margin: 0, fontSize: 32, fontWeight: 800, lineHeight: 1.15 };
const whereStyle = { margin: '10px 0 0', fontSize: 14, color: '#64748b' };
const leadStyle = { margin: '12px 0 0', fontSize: 16, lineHeight: 1.5, color: '#334155', maxWidth: 640 };
const answerStyle = { marginTop: 16, padding: 20, borderRadius: 16, background: 'white', border: '1px solid #e2e8f0' };
const answerKicker = { margin: 0, fontSize: 13, fontWeight: 700, color: '#64748b' };
const answerHeadline = { margin: '8px 0 0', fontSize: 18, fontWeight: 800, lineHeight: 1.35 };
const countRow = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 16 };
const countNumber = { fontSize: 22, fontWeight: 800 };
const countLabel = { fontSize: 13, color: '#64748b', marginTop: 2 };
const feeStyle = { margin: '16px 0 0', fontSize: 14, lineHeight: 1.45, color: '#0f172a' };
const olderDayStyle = { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12, fontSize: 14, padding: '8px 0', borderTop: '1px solid #f1f5f9', color: '#334155' };
const mutedStyle = { margin: '8px 0 0', fontSize: 14, color: '#64748b', lineHeight: 1.45 };
const errorStyle = { margin: '16px 0 0', fontSize: 14, color: '#991b1b' };
const actionsStyle = { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 16, marginTop: 16 };
const primaryButton = { padding: '12px 18px', borderRadius: 10, border: 'none', background: '#635bff', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer' };
const textLink = { color: '#4338ca', fontWeight: 700, fontSize: 14 };
const toolsHeading = { margin: 0, fontSize: 16, fontWeight: 800 };
const groupGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 };
const toolButton = { display: 'flex', flexDirection: 'column' as const, gap: 6, textAlign: 'left' as const, padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' };
const toolList = { listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexWrap: 'wrap' as const, gap: 8 };
const toolLink = { color: '#334155', fontSize: 14, fontWeight: 600, textDecoration: 'none', background: 'white', border: '1px solid #e2e8f0', borderRadius: 999, padding: '6px 10px' };
const footerStyle = { display: 'flex', gap: 8, marginTop: 28 };
const quietButton = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' };
