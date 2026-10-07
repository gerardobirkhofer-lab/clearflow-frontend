import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

type Place = {
  site_id: string | null;
  name: string;
  company_name: string;
  sales: number;
  collected: number;
  carried_open: number;
  resolved: number;
  this_check: number;
  unresolved: number;
  fees: number;
  late_amount: number;
  late_days: number;
  late_cost: number | null;
  debt_rate: number | null;
  uncollected_amount: number;
  uncollected_count: number;
  claims?: Claim[];
};

type Claim = {
  kind: 'liquidador' | 'caja';
  concept: string;
  amount: number;
  sold_on: string | null;
  auth_code: string | null;
  short: number;
  detail: string;
};

type Panel = {
  checked_at: string;
  unresolved_total: number;
  places: Place[];
};

function euros(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' });
}

const actions = [
  { label: 'Ver discrepancias', path: '/mismatch-tracker', className: 'a1' },
  { label: 'Ver disputas abiertas', path: '/dispute-tracker', className: 'a2' },
  { label: 'Ver comunicaciones', path: '/communications', className: 'a3' },
  { label: 'Ver informes', path: '/reports', className: 'a4' },
  { label: 'Control de ingresos', path: '/revenue-control', className: 'a5' },
  { label: 'Estadísticas', path: '/statistics', className: 'a6' },
  { label: 'Rentabilidad', path: '/profitability', className: 'a7' },
];

export default function MorningPanel() {
  const navigate = useNavigate();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch(`${API}/api/v1/panel`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'No se pudo hacer el chequeo.');
        setPanel(data);
      })
      .catch((reason) => setError(reason.message || 'No se pudo hacer el chequeo.'));
  }, [navigate]);

  return (
    <main style={page}>
      <style>{css}</style>
      <div style={wrap}>
        <div className="head">
          <div>
            <div className="kicker">Al abrir</div>
            <h1>¿Llegó el dinero?</h1>
            <p className="sub">{panel ? `Último chequeo: ${when(panel.checked_at)}` : 'Chequeando…'}</p>
          </div>
          <div className="pill">
            <div className="lbl">Sin resolver en el grupo</div>
            <div className="n">{panel ? euros(panel.unresolved_total) : '—'}</div>
          </div>
        </div>
        <div className="jumps">
          <Link to="/caja">Salud de Caja</Link>
          <Link to="/horizonte">Horizonte</Link>
          <Link to="/seteo">Seteo</Link>
          <Link to="/entidad">Chequeo según entidad legal</Link>
          <Link to="/ajustar">Cambiar/Ajustar setup</Link>
        </div>
        {error && <p className="error">{error}</p>}
        {panel && panel.places.length === 0 && (
          <article className="place">
            <h2>Todavía no hay locales</h2>
            <p className="meta">Cuando des de alta un local, el chequeo aparece aquí.</p>
            <Link to="/ajustar">Ir a setup</Link>
          </article>
        )}
        {(panel?.places || []).map((place) => (
          <article className="place" key={`${place.company_name}-${place.name}`}>
            <h2>{place.name}</h2>
            <p className="meta">Sociedad: {place.company_name}</p>
            <div className="grid">
              <Card label="Ventas" value={euros(place.sales)} tone="green" hint="de este chequeo" note="Ventas guardadas de este local." />
              <Card label="Cobranzas" value={euros(place.collected)} tone="green" hint="ya cruzadas con el banco" note="Dinero de esas ventas que ya se cruzó con un movimiento." />
              <Card label="De este chequeo" value={euros(place.this_check)} tone={place.this_check > 0 ? 'red' : 'green'} hint="nuevas" note="Lo que este chequeo dejó abierto." />
              <Card label="Ya venían abiertas" value={euros(place.carried_open)} tone="ink" hint="antes de este chequeo" note="Lo que seguía sin cuadrar en el chequeo anterior." />
              <Card label="Ya resueltas" value={euros(place.resolved)} tone="green" hint="este chequeo las cerró" note="Las que estaban abiertas y este chequeo ya no ve." />
              <Card label="Sin resolver" value={euros(place.unresolved)} tone={place.unresolved > 0 ? 'red' : 'green'} hint={`${euros(place.carried_open)} − ${euros(place.resolved)} + ${euros(place.this_check)}`} note="Lo que ya venía abierto, menos lo que este chequeo cerró, más lo nuevo." />
            </div>
            <div className="split-title">Abiertas, por tipo</div>
            <div className="split">
              <Soft tone={place.fees > 0 ? 'fee' : 'quiet'} label="Comisiones" value={euros(place.fees)} hint="distinta al contrato" note="El banco ingresó menos de lo que el contrato dice, descontada la comisión." />
              <Soft
                tone={place.late_amount > 0 ? 'delay' : 'quiet'}
                label="Días de retraso"
                value={euros(place.late_amount)}
                hint={place.late_days ? `${place.late_days} días${place.late_cost != null ? ` · tipo ${place.debt_rate}% · coste ${euros(place.late_cost)}` : ' · falta el tipo en setup'}` : 'al día'}
                note="Euros que llegaron tarde. El coste usa el tipo que tú fijas, solo sobre lo que va tarde."
              />
              <Soft tone={place.uncollected_count > 0 ? 'vale' : 'quiet'} label="Ventas no cobradas" value={euros(place.uncollected_amount)} hint={`${place.uncollected_count} vales`} note="Ventas hechas y todavía no cobradas." />
            </div>
            {(place.claims || []).length > 0 && (
              <div className="claims">
                <div className="split-title">Tickets de este chequeo</div>
                {(place.claims || []).map((claim) => (
                  <div key={`${claim.kind}-${claim.concept}-${claim.sold_on}`} className={claim.kind === 'liquidador' ? 'claim fee' : 'claim vale'}>
                    <strong>{claim.concept}</strong>
                    <span>{euros(claim.amount)} · {claim.detail}</span>
                    {claim.kind === 'liquidador' && <span>Para el liquidador · autorización {claim.auth_code} · de más {euros(claim.short)}</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="actions-title">Acciones rápidas · este local</div>
            <div className="actions">
              {actions.map((action) => (
                <Link key={action.path} to={place.site_id ? `${action.path}?site=${place.site_id}` : action.path} className={`act ${action.className}`}>{action.label}</Link>
              ))}
            </div>
          </article>
        ))}
        <section className="calm">
          <h2>Para mirar con calma</h2>
          <ul>
            <li><Link to="/caja">Salud de Caja</Link></li>
            <li><Link to="/horizonte">Horizonte</Link></li>
            <li><Link to="/seteo">Seteo</Link></li>
            <li><Link to="/entidad">Chequeo según entidad legal</Link></li>
            <li><Link to="/reports">Informes</Link></li>
            <li><Link to="/communications">Comunicaciones</Link></li>
            <li><Link to="/profitability">Rentabilidad</Link></li>
            <li><Link to="/revenue-control">Control de ingresos</Link></li>
            <li><Link to="/contrato">Contrato</Link></li>
            <li><Link to="/conexiones">Conexiones</Link></li>
            <li><Link to="/flujo">Flujo de caja</Link></li>
            <li><Link to="/ajustar">Cambiar/Ajustar setup</Link></li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function Card({ label, value, tone, hint, note }: { label: string; value: string; tone: string; hint: string; note: string }) {
  return (
    <div className="card">
      <details>
        <summary aria-label={`Información de ${label}`}>i</summary>
        <p>{note}</p>
      </details>
      <div className="lbl">{label}</div>
      <div className={`n ${tone}`}>{value}</div>
      <div className="hint">{hint}</div>
    </div>
  );
}

function Soft({ tone, label, value, hint, note }: { tone: string; label: string; value: string; hint: string; note: string }) {
  return (
    <div className={`soft ${tone}`}>
      <details>
        <summary aria-label={`Información de ${label}`}>i</summary>
        <p>{note}</p>
      </details>
      <div className="lbl">{label}</div>
      <div className="n">{value}</div>
      <div className="hint">{hint}</div>
    </div>
  );
}

const page = { minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'sans-serif' };
const wrap = { maxWidth: 1100, margin: '0 auto', padding: '28px 20px 72px' };

const css = `
  .kicker { font-size: 13px; color: #635bff; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
  h1 { margin: 0; font-size: 32px; font-weight: 800; }
  .sub { color: #64748b; margin: 8px 0 0; font-size: 15px; }
  .head { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
  .pill { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; border-radius: 12px; padding: 10px 14px; min-width: 180px; }
  .pill .lbl, .card .lbl, .soft .lbl { font-size: 11px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; }
  .pill .n { font-size: 22px; font-weight: 800; margin-top: 4px; }
  .jumps { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  .jumps a, .calm a { color: #635bff; font-weight: 700; text-decoration: none; }
  .place { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 18px; }
  .place h2 { margin: 0; font-size: 20px; }
  .meta { margin: 4px 0 16px; color: #94a3b8; font-size: 13px; }
  .grid, .split { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .card, .soft { position: relative; border-radius: 12px; padding: 16px; min-height: 96px; }
  .card { background: white; border: 1px solid #e2e8f0; }
  .n { font-size: 26px; font-weight: 800; margin-top: 8px; }
  .hint { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  .green { color: #166534; } .red { color: #991b1b; } .ink { color: #0f172a; }
  details { position: absolute; top: 10px; right: 10px; }
  summary { width: 18px; height: 18px; border-radius: 50%; border: 1px solid #cbd5e1; color: #64748b; font-size: 11px; font-weight: 700; font-style: italic; display: flex; align-items: center; justify-content: center; background: white; cursor: pointer; list-style: none; }
  summary::-webkit-details-marker { display: none; }
  details p { position: absolute; right: 0; top: 24px; width: 220px; background: #0f172a; color: white; border-radius: 10px; padding: 10px 12px; font-size: 12px; line-height: 1.4; z-index: 2; }
  .split-title, .actions-title { margin: 16px 0 8px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .4px; }
  .actions-title { font-size: 16px; color: #0f172a; text-transform: none; }
  .fee { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; }
  .delay { background: #fff7ed; border: 1px solid #ffedd5; color: #9a3412; }
  .vale { background: #fefce8; border: 1px solid #fef08a; color: #854d0e; }
  .quiet { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
  .soft .hint { color: inherit; opacity: .85; }
  .claims { display: grid; gap: 8px; margin-top: 12px; }
  .claim { border-radius: 10px; padding: 12px; display: grid; gap: 4px; }
  .claim span { font-size: 13px; }
  .actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .act { border-radius: 10px; padding: 14px 12px; font-size: 14px; font-weight: 600; text-decoration: none; }
  .a1 { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; }
  .a2 { background: #fff7ed; border: 1px solid #ffedd5; color: #9a3412; }
  .a3 { background: #eff6ff; border: 1px solid #dbeafe; color: #1e40af; }
  .a4 { background: #f0fdf4; border: 1px solid #d1fae5; color: #166534; }
  .a5 { background: #faf5ff; border: 1px solid #e9d5ff; color: #7e22ce; }
  .a6 { background: #f0fdfa; border: 1px solid #ccfbf1; color: #0f766e; }
  .a7 { background: #fefce8; border: 1px solid #fef08a; color: #854d0e; }
  .calm h2 { font-size: 18px; margin: 0 0 10px; }
  .calm ul { list-style: none; display: flex; flex-wrap: wrap; gap: 8px 18px; padding: 0; margin: 0; }
  .error { color: #991b1b; }
  @media (max-width: 800px) { .grid, .split, .actions { grid-template-columns: 1fr 1fr; } h1 { font-size: 26px; } }
`;
