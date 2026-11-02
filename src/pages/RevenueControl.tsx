import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

type DayBucket = { date: string; net: number; gross: number; count: number };
type Leg = {
  provider_tx_id: number;
  provider_name: string;
  sale_date: string | null;
  expected_deposit_date: string;
  overdue: boolean;
  gross: number;
  fees: number;
  net: number;
  amount_basis: string;
  match_status: string;
  payout_days: number;
  reference?: string | null;
};
type HorizonPack = {
  horizon_days: number;
  total_net: number;
  total_gross: number;
  total_fees: number;
  leg_count: number;
  overdue_net: number;
  by_day: DayBucket[];
  legs: Leg[];
};

export default function RevenueControl() {
  const [horizon, setHorizon] = useState<7 | 14 | 30>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOf, setAsOf] = useState<string>('');
  const [pack, setPack] = useState<HorizonPack | null>(null);
  const [note, setNote] = useState('');

  const load = async (h: 7 | 14 | 30) => {
    setLoading(true);
    setError(null);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) throw new Error('Sin tenant — inicia sesión');
      const res = await fetch(
        `${API}/api/v1/cash-flow/projected?tenant_id=${tenant.id}&horizon_days=${h}`,
        { headers: getAuth() },
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setAsOf(data.as_of || '');
      setNote(data.note || '');
      const key = String(h);
      setPack(data.horizons?.[key] || null);
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar la proyección');
      setPack(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(horizon);
  }, [horizon]);

  const maxDayNet = Math.max(1, ...(pack?.by_day || []).map((d) => Math.abs(d.net)));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          Caja proyectada
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Cash flow proyectado</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15, maxWidth: 720, lineHeight: 1.5 }}>
          Cobros esperados en banco desde liquidaciones pendientes + retraso contractual
          (<code>credit_delay_days</code>) y neto recalculado por contrato. Sin demos.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {([7, 14, 30] as const).map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHorizon(h)}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: horizon === h ? '#0f172a' : 'white',
              color: horizon === h ? 'white' : '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {h} días
          </button>
        ))}
        <button
          type="button"
          onClick={() => load(horizon)}
          style={{ marginLeft: 'auto', padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600 }}
        >
          Actualizar
        </button>
      </div>

      {asOf && (
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          A fecha {asOf} · <Link to="/profitability" style={{ color: '#635bff', fontWeight: 600 }}>Ver P&amp;L proyectado vs real →</Link>
        </div>
      )}

      {loading && <div style={{ padding: 24, color: '#64748b' }}>Calculando proyección…</div>}
      {error && (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!loading && pack && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Neto esperado</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: '#166534' }}>{formatMoney(pack.total_net)}</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Bruto pendiente</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{formatMoney(pack.total_gross)}</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Fees contractuales</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{formatMoney(pack.total_fees)}</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: pack.overdue_net > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0', background: pack.overdue_net > 0 ? '#fef2f2' : 'white' }}>
              <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Vencido sin confirmar</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: '#991b1b' }}>{formatMoney(pack.overdue_net)}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{pack.leg_count} liquidaciones</div>
            </div>
          </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Entradas esperadas por día</h2>
            {pack.by_day.length === 0 ? (
              <p style={{ color: '#64748b', margin: 0 }}>
                No hay liquidaciones pendientes con depósito esperado en este horizonte.
                Sube detalle de proveedor o espera a que haya ventas no confirmadas en banco.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pack.by_day.map((d) => (
                  <div key={d.date} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{d.date}</div>
                    <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (Math.abs(d.net) / maxDayNet) * 100)}%`,
                          height: '100%',
                          background: '#166534',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                      {formatMoney(d.net)}
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{d.count} tx</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>Detalle de liquidaciones</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '8px 6px' }}>Proveedor</th>
                    <th style={{ padding: '8px 6px' }}>Venta</th>
                    <th style={{ padding: '8px 6px' }}>Depósito est.</th>
                    <th style={{ padding: '8px 6px' }}>Neto</th>
                    <th style={{ padding: '8px 6px' }}>Base</th>
                    <th style={{ padding: '8px 6px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(pack.legs || []).slice(0, 80).map((L) => (
                    <tr key={L.provider_tx_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 600 }}>{L.provider_name}</td>
                      <td style={{ padding: '8px 6px' }}>{L.sale_date || '—'}</td>
                      <td style={{ padding: '8px 6px', color: L.overdue ? '#991b1b' : undefined }}>
                        {L.expected_deposit_date}{L.overdue ? ' · vencido' : ''}
                      </td>
                      <td style={{ padding: '8px 6px', fontWeight: 700 }}>{formatMoney(L.net)}</td>
                      <td style={{ padding: '8px 6px', color: '#64748b' }}>{L.amount_basis}</td>
                      <td style={{ padding: '8px 6px' }}>{L.match_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {note && (
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45 }}>{note}</p>
          )}
        </>
      )}
    </div>
  );
}
