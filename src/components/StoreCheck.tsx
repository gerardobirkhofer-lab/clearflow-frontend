import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

type Line = {
  kind: 'uncollected' | 'fee' | 'late';
  concept: string;
  amount: number;
  days: number;
  sold_on: string | null;
  detail: string;
  auth_code: string | null;
  extra: number | null;
};

type Place = {
  site_id: string | null;
  name: string;
  company_name: string;
  fees: number;
  late_amount: number;
  uncollected_amount: number;
  lines: Line[];
};

const groups = [
  { kind: 'uncollected' as const, title: 'Ventas no cobradas', field: 'uncollected_amount' as const },
  { kind: 'fee' as const, title: 'Comisiones', field: 'fees' as const },
  { kind: 'late' as const, title: 'Días de retraso', field: 'late_amount' as const },
];

function euros(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

export default function StoreCheck() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [places, setPlaces] = useState<Place[]>([]);
  const site = params.get('site');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API}/api/v1/panel`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (!response.ok) return;
        const data = await response.json();
        setPlaces(data.places || []);
      })
      .catch(() => setPlaces([]));
  }, [navigate]);

  const visible = site ? places.filter((place) => place.site_id === site) : places;
  if (!visible.length) return null;

  return (
    <section style={{ marginBottom: 28 }}>
      {visible.map((place) => (
        <article key={`${place.company_name}-${place.name}`} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#635bff', letterSpacing: 0.4, textTransform: 'uppercase' }}>Discrepancias de este local</div>
              <h2 style={{ margin: '6px 0 0' }}>{place.name}</h2>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>Sociedad: {place.company_name}. La suma de cada lista es la del chequeo.</p>
            </div>
            <Link to={place.site_id ? `/retrasos?site=${place.site_id}` : '/retrasos'} style={button}>Ver por días</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
            {groups.map((group) => (
              <div key={group.kind} style={mini}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: '#64748b' }}>{group.title}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{euros(place[group.field])}</div>
              </div>
            ))}
          </div>
          {groups.map((group) => {
            const lines = (place.lines || []).filter((line) => line.kind === group.kind);
            const sum = lines.reduce((total, line) => total + line.amount, 0);
            return (
              <div key={group.kind} style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{group.title} · {euros(sum)}</div>
                {lines.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13 }}>Nada en este tipo.</p>}
                {lines.map((line) => (
                  <div key={`${line.kind}-${line.concept}-${line.sold_on}-${line.amount}`} style={row}>
                    <strong>{line.concept}</strong>
                    <span>{euros(line.amount)}{line.days > 0 ? ` · +${line.days}D` : ''}</span>
                    <span style={{ color: '#64748b' }}>{line.detail}{line.auth_code ? ` Autorización ${line.auth_code}.` : ''}{line.extra ? ` De más ${euros(line.extra)}.` : ''}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </article>
      ))}
    </section>
  );
}

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 12 };
const mini = { border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' };
const row = { display: 'grid', gap: 2, padding: '8px 0', borderTop: '1px solid #f1f5f9', fontSize: 14 };
const button = { background: '#fff7ed', border: '1px solid #ffedd5', color: '#9a3412', fontWeight: 700, textDecoration: 'none', borderRadius: 10, padding: '8px 12px', fontSize: 13, alignSelf: 'start' };
