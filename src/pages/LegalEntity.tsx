import { useEffect, useState } from 'react';
import BackDashboard from '../components/BackDashboard';

const API = import.meta.env.VITE_API_URL || '';

type Place = {
  name: string;
  company_name: string;
  sales: number;
  collected: number;
  this_check: number;
  carried_open: number;
  resolved: number;
  unresolved: number;
  earning: number;
};

function euros(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

export default function LegalEntity() {
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    fetch(`${API}/api/v1/panel`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } })
      .then((response) => response.json())
      .then((data) => setPlaces(data.places || []))
      .catch(() => setPlaces([]));
  }, []);

  const names = [...new Set(places.map((place) => place.company_name))];

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 72px' }}>
        <BackDashboard />
        <div style={{ marginTop: 18, fontSize: 13, color: '#635bff', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Página aparte</div>
        <h1 style={{ margin: '8px 0' }}>Chequeo según entidad legal</h1>
        <p style={{ color: '#64748b' }}>Los locales de una sociedad, sumados. Para ver el sector y para el contable. El día de cada factura se mira en su local.</p>
        {names.map((name) => {
          const rows = places.filter((place) => place.company_name === name);
          const sum = (key: keyof Place) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);
          return (
            <article key={name} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginTop: 18 }}>
              <h2 style={{ margin: 0 }}>{name}</h2>
              <p style={{ color: '#94a3b8' }}>{rows.map((row) => row.name).join(' + ')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <Cell label="Ventas" value={euros(sum('sales'))} />
                <Cell label="Cobranzas" value={euros(sum('collected'))} />
                <Cell label="De este chequeo" value={euros(sum('this_check'))} />
                <Cell label="Ya venían abiertas" value={euros(sum('carried_open'))} />
                <Cell label="Ya resueltas" value={euros(sum('resolved'))} />
                <Cell label="Sin resolver" value={euros(sum('unresolved'))} />
                <Cell label="¿Gana la sociedad?" value={euros(sum('earning'))} />
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}
