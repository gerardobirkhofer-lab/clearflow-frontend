import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BackDashboard from '../components/BackDashboard';

const API = import.meta.env.VITE_API_URL || '';

type DelayRow = { days: number; late: number; uncollected: number; fees: number };

type Place = {
  site_id: string | null;
  name: string;
  company_name: string;
  fees: number;
  late_amount: number;
  uncollected_amount: number;
  debt_rate: number | null;
  delays: DelayRow[];
};

function euros(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function parseRate(value: string) {
  const cleaned = value.trim().replace('%', '').replace(/\s/g, '').replace(',', '.');
  if (!cleaned) return null;
  const rate = Number(cleaned);
  if (!Number.isFinite(rate) || rate < 0) return null;
  return rate;
}

function lostMoney(rows: DelayRow[], rate: number) {
  return rows.reduce((sum, row) => {
    const amount = (row.late || 0) + (row.uncollected || 0) + (row.fees || 0);
    return sum + amount * (rate / 100) * row.days / 365;
  }, 0);
}

export default function Delays() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const [rateText, setRateText] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const site = params.get('site');
  const placeName = params.get('lugar');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API}/api/v1/panel`, { headers })
      .then(async (response) => {
        const data = await response.json();
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'No se pudo leer los retrasos.');
        const found = (data.places || []) as Place[];
        setPlaces(found);
        const current = found.find((place) => (site ? place.site_id === site : true));
        if (current?.debt_rate != null) setRateText(String(current.debt_rate));
      })
      .catch((reason) => setError(reason.message || 'No se pudo leer los retrasos.'));
  }, [navigate, site]);

  const visible = places.filter((place) => {
    if (site) return place.site_id === site;
    if (placeName) return place.name === placeName;
    return true;
  });
  const rate = parseRate(rateText);
  const loss = useMemo(
    () => (rate == null ? null : visible.reduce((sum, place) => sum + lostMoney(place.delays || [], rate), 0)),
    [rate, visible],
  );

  const saveRate = async () => {
    setSaved('');
    setError('');
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
    };
    const profileRes = await fetch(`${API}/api/v1/account/profile`, { headers });
    const profile = profileRes.ok ? await profileRes.json() : { payload: {} };
    const payload = { ...(profile.payload || {}), debt_rate_percent: rate };
    const response = await fetch(`${API}/api/v1/account/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ payload, onboarding_complete: true }),
    });
    if (!response.ok) {
      setError('No se pudo guardar la TNA.');
      return;
    }
    setSaved('TNA guardada en el setup.');
  };

  return (
    <main style={page}>
      <style>{css}</style>
      <div style={wrap}>
        <BackDashboard />
        <div className="kicker">Días de retraso</div>
        <h1>Retrasos en el cobro</h1>
        <p className="sub">Cada columna es un tramo de días. El total de cada tabla es el del casillero de ese local.</p>
        {error && <p className="error">{error}</p>}
        <section className="pair">
          <div className="box">
            <label htmlFor="tna">Tasa Nominal Anual (TNA)</label>
            <div className="entry">
              <input id="tna" inputMode="decimal" value={rateText} placeholder="12,5" onChange={(event) => { setRateText(event.target.value); setSaved(''); }} />
              <span>%</span>
              <button type="button" onClick={saveRate}>Guardar</button>
            </div>
            <p>La tasa que escribes es una Tasa Nominal Anual. Es la misma que queda en el setup.</p>
            {saved && <p className="ok">{saved}</p>}
          </div>
          <div className="box loss">
            <div className="lbl">Dinero que se pierde por los retrasos</div>
            <div className="n">{loss == null ? '—' : euros(loss)}</div>
            <p>Cada importe, de las tres tablas, se multiplica por la TNA, por sus días, y se divide entre 365.</p>
          </div>
        </section>
        {visible.map((place) => (
          <PlaceDelays key={`${place.company_name}-${place.name}`} place={place} />
        ))}
      </div>
    </main>
  );
}

function PlaceDelays({ place }: { place: Place }) {
  const rows = place.delays || [];
  const days = rows.map((row) => row.days);
  return (
    <article className="place">
      <h2>{place.name}</h2>
      <p className="meta">Sociedad: {place.company_name}</p>
      <DelayTable title="Retraso en la acreditación" hint="Cuadra con Días de retraso del chequeo." kind="late" days={days} rows={rows} card={place.late_amount} />
      <DelayTable title="Tickets no cobrados" hint="Cuadra con Ventas no cobradas del chequeo." kind="uncollected" days={days} rows={rows} card={place.uncollected_amount} />
      <DelayTable title="Comisiones cobradas de más" hint="Cuadra con Comisiones del chequeo." kind="fees" days={days} rows={rows} card={place.fees} />
    </article>
  );
}

function DelayTable({ title, hint, kind, days, rows, card }: {
  title: string;
  hint: string;
  kind: 'late' | 'uncollected' | 'fees';
  days: number[];
  rows: DelayRow[];
  card: number;
}) {
  const amount = (day: number) => rows.find((row) => row.days === day)?.[kind] || 0;
  const total = days.reduce((sum, day) => sum + amount(day), 0);
  return (
    <section className="table-block">
      <h3>{title}</h3>
      {days.length === 0 ? (
        <p className="meta">Sin importes. En el chequeo: {euros(card)}.</p>
      ) : (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                {days.map((day) => <th key={day}>{day === 0 ? 'Al día' : `+${day}D`}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {days.map((day) => <td key={day}>{euros(amount(day))}</td>)}
                <td className="total">{euros(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="meta">{hint} {euros(card)}.</p>
    </section>
  );
}

const page = { minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'sans-serif' };
const wrap = { maxWidth: 1100, margin: '0 auto', padding: '28px 20px 72px' };

const css = `
  .kicker { font-size: 13px; color: #635bff; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; margin: 18px 0 8px; }
  h1 { margin: 0; font-size: 32px; }
  .sub, .meta, .box p { color: #64748b; font-size: 14px; }
  .pair { display: grid; grid-template-columns: 1.1fr .9fr; gap: 12px; margin: 18px 0; }
  .box { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
  .box label, .lbl { font-size: 12px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: #64748b; }
  .entry { display: flex; gap: 8px; align-items: center; margin: 10px 0; }
  .entry input { width: 120px; padding: 10px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 18px; font-weight: 700; }
  .entry button, .loss .n { font-weight: 800; }
  .entry button { padding: 10px 14px; border: none; border-radius: 10px; background: #635bff; color: white; cursor: pointer; }
  .loss .n { font-size: 28px; color: #991b1b; margin-top: 8px; }
  .place { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .place h2 { margin: 0; }
  .table-block { margin-top: 18px; }
  .table-block h3 { margin: 0 0 8px; font-size: 16px; }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; min-width: 100%; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 14px; text-align: right; white-space: nowrap; }
  th { font-size: 12px; color: #64748b; text-transform: uppercase; }
  td { font-weight: 700; }
  td.total { color: #0f172a; }
  .error { color: #991b1b; }
  .ok { color: #166534; }
  @media (max-width: 800px) { .pair { grid-template-columns: 1fr; } h1 { font-size: 26px; } }
`;
