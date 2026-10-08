import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackDashboard from '../components/BackDashboard';

const API = import.meta.env.VITE_API_URL || '';

type Month = {
  year: number;
  month: number;
  base: number | null;
  sales_from: 'same_month' | 'average' | null;
  sales: number | null;
  cost: number | null;
  fees: number | null;
  expenses: number;
  earning: number | null;
  verdict: 'vas_bien' | 'vamos' | null;
};
type Place = {
  tenant_id: string;
  site_id: string;
  name: string;
  company_name: string;
  adjust_percent: number;
  has_history: boolean;
  has_products: boolean;
  months: Month[];
};

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function euros(amount: number | null) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json',
  };
}

export default function Horizon() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const load = async () => {
    const response = await fetch(`${API}/api/v1/horizonte`, { headers: authHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error('No se pudo leer el horizonte.');
    const next: Place[] = data.places || [];
    setPlaces(next);
    const typed: Record<string, string> = {};
    next.forEach((place) => {
      typed[place.tenant_id] = String(place.adjust_percent ?? 0);
    });
    setDraft(typed);
  };

  useEffect(() => {
    load().catch((reason) => setError(reason.message));
  }, []);

  const saveAdjust = async (tenantId: string) => {
    setError('');
    const response = await fetch(`${API}/api/v1/projection?tenant_id=${tenantId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ adjust_percent: draft[tenantId] === '' ? 0 : Number(draft[tenantId]) }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(typeof data.detail === 'string' ? data.detail : 'No se pudo guardar el ajuste.');
      return;
    }
    await load();
  };

  const companies = places.reduce<Record<string, Place[]>>((groups, place) => {
    const key = place.tenant_id;
    groups[key] = groups[key] || [];
    groups[key].push(place);
    return groups;
  }, {});

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 72px' }}>
        <BackDashboard />
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 18 }}>Próximos 12 meses</div>
        <h1 style={{ margin: '8px 0 0', fontSize: 32 }}>Horizonte</h1>
        <p style={{ color: '#64748b' }}>Si el local gana dinero. La caja, el día en que el dinero llega, está en Salud de Caja.</p>
        {error && <p style={{ color: '#991b1b' }}>{error}</p>}
        {places.length === 0 && !error && <p style={{ color: '#64748b' }}>Cuando haya un local activo, el año aparece aquí.</p>}
        {Object.entries(companies).map(([tenantId, group]) => (
          <section key={tenantId} style={{ marginTop: 18 }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ajuste de ventas · {group[0].company_name}</div>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>El histórico queda a la vista. Un 10 sube la proyección un 10 %. Un -10 la baja.</p>
              </div>
              <input
                aria-label={`Ajuste de ventas de ${group[0].company_name}`}
                value={draft[tenantId] ?? ''}
                inputMode="decimal"
                onChange={(event) => setDraft({ ...draft, [tenantId]: event.target.value })}
                style={field}
              />
              <button type="button" onClick={() => saveAdjust(tenantId)} style={primary}>Aplicar</button>
            </div>
            {group.map((place) => (
              <article key={place.site_id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginTop: 12 }}>
                <h2 style={{ margin: 0 }}>{place.name}</h2>
                <p style={{ color: '#94a3b8', marginTop: 4 }}>{place.company_name}</p>
                {!place.has_history && (
                  <p style={note}>Sin ventas pasadas no hay proyección. El histórico se carga en el seteo, a mano o desde el TPV.</p>
                )}
                {place.has_history && !place.has_products && (
                  <p style={note}>Hay ventas. Falta el precio y el costo de lo que vende, así que todavía no digo si gana.</p>
                )}
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr>
                        {['Mes', 'Histórico', 'Proyección', 'Costo', 'Comisiones', 'Gastos', 'Resultado'].map((label) => (
                          <th key={label} style={th}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {place.months.map((month) => (
                        <tr key={`${month.year}-${month.month}`}>
                          <td style={td}><strong>{MONTHS[month.month - 1]} {month.year}</strong></td>
                          <td style={td}>
                            {euros(month.base)}
                            {month.sales_from === 'average' && <div style={hint}>media, no ese mes</div>}
                          </td>
                          <td style={td}>{euros(month.sales)}</td>
                          <td style={td}>{euros(month.cost)}</td>
                          <td style={td}>{euros(month.fees)}</td>
                          <td style={td}>{euros(month.expenses)}</td>
                          <td style={{ ...td, color: month.earning == null ? '#64748b' : month.earning >= 0 ? '#166534' : '#991b1b', fontWeight: 800 }}>
                            {euros(month.earning)}
                            {month.verdict && (
                              <div style={{ fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                                {month.verdict === 'vas_bien' ? 'Vas bien' : '¡Vamos, que podemos!'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </section>
        ))}
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Ventas, productos y gastos del año se cargan en <Link to="/seteo">Seteo</Link>. La caja del mes, en <Link to="/caja">Salud de Caja</Link>.
        </p>
      </div>
    </main>
  );
}

const field = { padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16, width: 90 };
const primary = { padding: '10px 14px', borderRadius: 10, border: 'none', background: '#635bff', color: 'white', fontWeight: 800, cursor: 'pointer' };
const note = { background: '#fefce8', color: '#854d0e', borderRadius: 10, padding: 10, fontWeight: 700 };
const th = { textAlign: 'left' as const, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' as const, color: '#64748b', padding: '8px 8px 8px 0', borderBottom: '1px solid #e2e8f0' };
const td = { padding: '10px 8px 10px 0', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' as const };
const hint = { fontSize: 11, color: '#94a3b8', fontWeight: 600 };
