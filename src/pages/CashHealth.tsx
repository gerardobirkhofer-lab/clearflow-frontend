import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
        <Link to="/panel" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>Volver al chequeo</Link>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 18 }}>El mes entero</div>
        <h1 style={{ margin: '8px 0 0', fontSize: 32 }}>Salud de Caja</h1>
        <p style={{ color: '#64748b' }}>Cada día del mes: lo ya vendido llega el día del contrato, y sale lo que cargaste con fecha. Si gana dinero, eso está en Horizonte.</p>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 14 }}>
                {WEEK.map((label) => (
                  <div key={label} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{label}</div>
                ))}
                {Array.from({ length: offset }).map((_, empty) => <div key={`empty-${empty}`} />)}
                {place.days.map((item, itemIndex) => {
                  const selected = itemIndex === index;
                  return (
                    <button
                      key={item.date}
                      type="button"
                      aria-label={item.is_today ? `Hoy ${dayText(item.date)}` : dayText(item.date)}
                      aria-pressed={selected}
                      onClick={() => setPicked({ ...picked, [key]: itemIndex })}
                      style={{
                        borderRadius: 10,
                        minHeight: 42,
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: item.covers === false ? '1px solid #fecaca' : '1px solid #e2e8f0',
                        background: selected ? '#0f172a' : item.bills.length ? '#fff7ed' : 'white',
                        color: selected ? 'white' : item.covers === false ? '#991b1b' : '#0f172a',
                        outline: item.is_today ? '2px solid #635bff' : 'none',
                      }}
                    >
                      {Number(item.date.slice(-2))}
                    </button>
                  );
                })}
              </div>
              {day && (
                <>
                  <div style={{ margin: '16px 0 8px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    {day.is_today ? `Hoy · ${dayText(day.date)}` : dayText(day.date)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    <Tile label="Caja inicio" value={euros(day.opening)} hint={place.opening_known ? 'cierre del día anterior' : 'falta el saldo del banco'} />
                    <Tile label="Ingresos estimados" value={euros(day.inflows)} hint="ventas ya hechas · fee ya restado" />
                    <Tile label="Erogaciones" value={euros(day.outflows)} hint={day.bills.map((bill) => bill.concept).join(', ') || 'ninguna con fecha'} />
                    <Tile label="Caja al cierre" value={euros(day.closing)} tone={day.covers === false ? '#991b1b' : '#166534'} />
                  </div>
                  {day.covers === false && <p style={warn}>No cubre · {day.bills.map((bill) => `${bill.concept} ${euros(bill.amount)}`).join(', ')}</p>}
                  {day.covers == null && day.bills.length > 0 && <p style={warn}>Vence · {day.bills.map((bill) => bill.concept).join(', ')}. Falta el saldo del banco para saber si cubre.</p>}
                </>
              )}
              {place.upcoming.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Lo que vence de hoy en adelante</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                    {place.upcoming.map((item) => (
                      <li key={item.date} style={{ padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
                        <strong>{dayText(item.date)}</strong>
                        <span style={{ color: '#64748b' }}> · {item.bills.map((bill) => `${bill.concept} ${euros(bill.amount)}`).join(', ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
        <p style={{ color: '#64748b', fontSize: 14 }}>
          El día, el importe y el concepto se cargan en <Link to="/seteo">Seteo</Link>. Si el local gana, míralo en <Link to="/horizonte">Horizonte</Link>.
        </p>
      </div>
    </main>
  );
}

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: tone || '#0f172a' }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const warn = { marginTop: 10, background: '#fff7ed', color: '#9a3412', borderRadius: 10, padding: 10, fontWeight: 700 };
