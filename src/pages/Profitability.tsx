import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

type Block = { gross: number; fees: number; net: number; count: number; bank_credited?: number };
type ProviderRow = {
  name: string;
  projected: Block;
  actual: Block;
  variance: { gross: number; fees: number; net: number };
};

export default function Profitability() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);
  const [projected, setProjected] = useState<Block | null>(null);
  const [actual, setActual] = useState<Block | null>(null);
  const [variance, setVariance] = useState<{ gross: number; fees: number; net: number } | null>(null);
  const [byProvider, setByProvider] = useState<ProviderRow[]>([]);
  const [pending, setPending] = useState(0);
  const [defs, setDefs] = useState<Record<string, string>>({});

  const load = async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) throw new Error('Sin tenant — inicia sesión');
      const res = await fetch(
        `${API}/api/v1/cash-flow/pnl?tenant_id=${tenant.id}&days=${d}`,
        { headers: getAuth() },
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setPeriod(data.period);
      setProjected(data.projected);
      setActual(data.actual);
      setVariance(data.variance);
      setByProvider(data.by_provider || []);
      setPending(data.pending_unconfirmed_sales || 0);
      setDefs(data.definitions || {});
    } catch (e: any) {
      setError(e.message || 'No se pudo cargar el P&L');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
  }, [days]);

  const Metric = ({
    label,
    proj,
    act,
    varN,
    invertGood,
  }: {
    label: string;
    proj: number;
    act: number;
    varN: number;
    invertGood?: boolean;
  }) => {
    const good = invertGood ? varN <= 0.01 : varN >= -0.01;
    return (
      <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Proyectado</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{formatMoney(proj)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Real</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{formatMoney(act)}</div>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: good ? '#166534' : '#991b1b' }}>
          Δ {formatMoney(varN)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          Estado de resultados
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Proyectado vs real</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15, maxWidth: 740, lineHeight: 1.5 }}>
          Ingresos y fees según contrato frente a lo confirmado en banco. Periodo por fecha de venta.
          Sin estimaciones demo.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: days === d ? '#0f172a' : 'white',
              color: days === d ? 'white' : '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Últimos {d}d
          </button>
        ))}
        <button
          type="button"
          onClick={() => load(days)}
          style={{ marginLeft: 'auto', padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600 }}
        >
          Actualizar
        </button>
      </div>

      {period && (
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          Periodo {period.start} → {period.end} ·{' '}
          <Link to="/revenue-control" style={{ color: '#635bff', fontWeight: 600 }}>Ver caja proyectada →</Link>
        </div>
      )}

      {loading && <div style={{ padding: 24, color: '#64748b' }}>Calculando P&amp;L…</div>}
      {error && (
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!loading && projected && actual && variance && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
            <Metric label="Ingresos (bruto)" proj={projected.gross} act={actual.gross} varN={variance.gross} />
            <Metric label="Fees / comisiones" proj={projected.fees} act={actual.fees} varN={variance.fees} invertGood />
            <Metric label="Neto liquidado" proj={projected.net} act={actual.net} varN={variance.net} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
            <div style={{ padding: 18, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Ventas proyectadas</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{projected.count}</div>
            </div>
            <div style={{ padding: 18, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Confirmadas (real)</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: '#166534' }}>{actual.count}</div>
            </div>
            <div style={{ padding: 18, borderRadius: 12, border: pending > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0', background: pending > 0 ? '#fffbeb' : 'white' }}>
              <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Pendientes de confirmar</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: '#92400e' }}>{pending}</div>
            </div>
            {typeof actual.bank_credited === 'number' && (
              <div style={{ padding: 18, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Acreditado en banco</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{formatMoney(actual.bank_credited)}</div>
              </div>
            )}
          </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700 }}>Por proveedor</h2>
            {byProvider.length === 0 ? (
              <p style={{ color: '#64748b', margin: 0 }}>Sin ventas en el periodo. Sube CSV de proveedor o sincroniza Stripe/Redsys.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 6px' }}>Proveedor</th>
                      <th style={{ padding: '8px 6px' }}>Bruto proy.</th>
                      <th style={{ padding: '8px 6px' }}>Bruto real</th>
                      <th style={{ padding: '8px 6px' }}>Fees proy.</th>
                      <th style={{ padding: '8px 6px' }}>Fees real</th>
                      <th style={{ padding: '8px 6px' }}>Neto Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byProvider.map((r) => (
                      <tr key={r.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 700 }}>{r.name}</td>
                        <td style={{ padding: '8px 6px' }}>{formatMoney(r.projected.gross)}</td>
                        <td style={{ padding: '8px 6px' }}>{formatMoney(r.actual.gross)}</td>
                        <td style={{ padding: '8px 6px' }}>{formatMoney(r.projected.fees)}</td>
                        <td style={{ padding: '8px 6px' }}>{formatMoney(r.actual.fees)}</td>
                        <td style={{ padding: '8px 6px', fontWeight: 700, color: r.variance.net >= -0.01 ? '#166534' : '#991b1b' }}>
                          {formatMoney(r.variance.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(defs.projected || defs.actual) && (
            <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#475569', lineHeight: 1.55 }}>
              <div><strong>Proyectado:</strong> {defs.projected}</div>
              <div style={{ marginTop: 6 }}><strong>Real:</strong> {defs.actual}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
