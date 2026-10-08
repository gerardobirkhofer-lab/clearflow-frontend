import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackDashboard from '../components/BackDashboard';

const API = import.meta.env.VITE_API_URL || '';

type Bill = { concept: string; amount: number };
type Day = {
  date: string;
  is_today: boolean;
  opening: number | null;
  inflows: number;
  outflows: number;
  closing: number | null;
  bills: Bill[];
  covers: boolean | null;
};
type Gap = { date: string; bills: Bill[]; closing: number | null };
type Place = {
  site_id?: string;
  name: string;
  company_name: string;
  opening_known: boolean;
  month: string;
  first_gap: Gap | null;
  upcoming: { date: string; bills: Bill[] }[];
  days: Day[];
};

function euros(amount: number | null) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function monthTitle(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const text = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dayText(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

const WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function CashHealth() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/v1/caja`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error('No se pudo leer la caja.');
        const nextPlaces: Place[] = data.places || [];
        const nextPicked: Record<string, number> = {};
        nextPlaces.forEach((place) => {
          const key = place.site_id || place.name;
          const todayIndex = place.days.findIndex((day) => day.is_today);
          nextPicked[key] = todayIndex >= 0 ? todayIndex : 0;
        });
        setPlaces(nextPlaces);
        setPicked(nextPicked);
      })
      .catch((reason) => setError(reason.message));
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 72px' }}>
        <BackDashboard />
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 18 }}>El mes entero</div>
        <h1 style={{ margin: '8px 0 0', fontSize: 32 }}>Salud de Caja</h1>
        <p style={{ color: '#64748b' }}>Cada día lleva su saldo de inicio, la cobranza estimada, el pago a realizar y el saldo final.</p>
        {error && <p style={{ color: '#991b1b' }}>{error}</p>}
        {places.map((place) => {
          const key = place.site_id || place.name;
          const index = picked[key] ?? 0;
          const day = place.days[index];
          const lead = place.days[0]?.date || `${place.month}-01`;
          const offset = (new Date(`${lead}T12:00:00`).getDay() + 6) % 7;
          return (
            <article key={key} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginTop: 18 }}>
              <h2 style={{ margin: 0 }}>{place.name}</h2>
              <p style={{ color: '#94a3b8', marginTop: 4 }}>{place.company_name} · {monthTitle(lead)}</p>
              {place.first_gap && (
                <p style={warn}>
                  El {dayText(place.first_gap.date)} no cubre
                  {place.first_gap.bills.length ? `: ${place.first_gap.bills.map((bill) => `${bill.concept} ${euros(bill.amount)}`).join(', ')}` : ''}.
                  Cierre {euros(place.first_gap.closing)}.
                </p>
              )}
              {!place.opening_known && place.upcoming.length > 0 && (
                <p style={warn}>Hay facturas con fecha. Falta el saldo del banco para saber si la caja llega.</p>
              )}
              <div style={{ overflowX: 'auto', marginTop: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(132px, 1fr))', gap: 6, minWidth: 960 }}>
                  {WEEK.map((label) => (
                    <div key={label} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{label}</div>
                  ))}
                  {Array.from({ length: offset }).map((_, empty) => <div key={`empty-${empty}`} />)}
                  {place.days.map((item, itemIndex) => {
                    const selected = itemIndex === index;
                    const concepts = item.bills.map((bill) => bill.concept).join(', ');
                    return (
                      <button
                        key={item.date}
                        type="button"
                        aria-label={`${item.is_today ? 'Hoy ' : ''}${dayText(item.date)}. Saldo inicio ${euros(item.opening)}. Cobranza estimada ${euros(item.inflows)}. Pago a realizar ${euros(item.outflows)}${concepts ? `, ${concepts}` : ''}. Saldo final ${euros(item.closing)}.`}
                        aria-pressed={selected}
                        onClick={() => setPicked({ ...picked, [key]: itemIndex })}
                        style={{
                          borderRadius: 12,
                          minHeight: 118,
                          padding: '8px 8px 10px',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          border: selected ? '2px solid #312e81' : item.covers === false ? '1px solid #fecaca' : '1px solid #e2e8f0',
                          background: item.bills.length ? '#fff7ed' : 'white',
                          color: '#0f172a',
                          outline: item.is_today ? '2px solid #635bff' : 'none',
                          boxShadow: selected ? '0 0 0 2px #e0e7ff' : 'none',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                          {Number(item.date.slice(-2))}
                          {item.is_today ? <span style={{ marginLeft: 6, fontSize: 10, color: '#635bff' }}>Hoy</span> : null}
                        </div>
                        <CellLine label="Inicio" value={euros(item.opening)} />
                        <CellLine label="Cobranza" value={euros(item.inflows)} color={item.inflows > 0 ? '#166534' : undefined} />
                        <CellLine label="Pago" value={euros(item.outflows)} color={item.outflows > 0 ? '#991b1b' : undefined} />
                        {concepts && <div style={{ fontSize: 10, color: '#9a3412', fontWeight: 700, marginTop: 1 }}>{concepts}</div>}
                        <CellLine label="Saldo" value={euros(item.closing)} color={item.covers === false ? '#991b1b' : item.covers ? '#166534' : undefined} />
                      </button>
                    );
                  })}
                </div>
              </div>
              {day && day.covers === false && <p style={warn}>No cubre · {day.bills.map((bill) => `${bill.concept} ${euros(bill.amount)}`).join(', ')}</p>}
              {day && day.covers == null && day.bills.length > 0 && <p style={warn}>Vence {day.bills.map((bill) => bill.concept).join(', ')}. Falta el saldo del banco para saber si cubre.</p>}
            </article>
          );
        })}
        <p style={{ color: '#64748b', fontSize: 15, marginTop: 22 }}>
          El día, el importe y el concepto se cargan en <Link to="/seteo" style={quietLink}>Seteo</Link>. Si quieres ver si estás ganando dinero o no, ve a <Link to="/horizonte" style={quietLink}>Horizonte</Link>.
        </p>
      </div>
    </main>
  );
}

function CellLine({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, fontSize: 10, lineHeight: 1.35 }}>
      <span style={{ color: '#64748b', fontWeight: 700 }}>{label}</span>
      <span style={{ fontWeight: 800, color: color || '#0f172a', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

const quietLink = {
  display: 'inline-block',
  margin: '0 4px',
  background: '#f1f5f9',
  border: '1px solid #cbd5e1',
  color: '#334155',
  fontWeight: 800,
  textDecoration: 'none',
  borderRadius: 12,
  padding: '6px 10px',
  fontSize: 13,
};

const warn = { marginTop: 10, background: '#fff7ed', color: '#9a3412', borderRadius: 10, padding: 10, fontWeight: 700 };
