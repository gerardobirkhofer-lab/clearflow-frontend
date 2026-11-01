import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

/** Live stats from trial-report + dashboard — no fabricated card-mix / provider splits. */
export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<any>({});
  const [rules, setRules] = useState<Record<string, number>>({});
  const [modes, setModes] = useState<Record<string, number>>({});
  const [engine, setEngine] = useState('');

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) {
        setError('No hay tenant activo.');
        return;
      }
      const res = await fetch(
        `${API}/api/v1/reconciliation/trial-report?tenant_id=${tenant.id}&sample=5`,
        { headers: getAuth() },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.detail === 'string' ? data.detail : `Error ${res.status}`);
        return;
      }
      setTotals(data.totals || {});
      setRules(data.rules_fired_histogram || {});
      setModes(data.match_mode_histogram || {});
      setEngine(data.engine || '');
    } catch (e: any) {
      setError(e?.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>Estadísticas del motor</h1>
      <p style={{ color: '#64748b', marginTop: 0 }}>
        Solo números reales del tenant (confirmados / sugeridos / pendientes). Sin splits inventados de Visa/Mastercard.
      </p>

      <div style={{ marginBottom: 16, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: 13 }}>
        Propuesta del motor · no es un cierre firmado. {engine ? `Motor: ${engine}` : ''}
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, marginBottom: 16 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ color: '#64748b' }}>Cargando…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Banco', value: totals.bank ?? 0 },
              { label: 'Proveedor', value: totals.provider ?? 0 },
              { label: 'Confirmados', value: totals.confirmed_bank ?? 0, color: '#166534' },
              { label: 'Sugeridos', value: totals.suggested_bank ?? 0, color: '#b45309' },
              { label: 'Pendientes', value: totals.pending_bank ?? 0, color: '#991b1b' },
              { label: '% confirmado', value: `${totals.confirm_rate_pct ?? 0}%`, color: '#4338ca' },
            ].map((c) => (
              <div key={c.label} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color: c.color || '#0f172a' }}>{c.value}</div>
              </div>
            ))}
          </div>

          {(totals.bank ?? 0) === 0 && (
            <div style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', marginBottom: 20 }}>
              <div style={{ fontWeight: 700 }}>Sin movimientos todavía</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                Esto no significa 100% conciliado. Subí CSV o sincronizá Open Banking y ejecutá Run.
              </div>
              <Link to="/setup" style={{ display: 'inline-block', marginTop: 12, color: '#635bff', fontWeight: 600 }}>Ir a Setup →</Link>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Modos de match</h2>
              {Object.keys(modes).length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Sin confirmaciones con evidencia aún.</div>
              ) : (
                Object.entries(modes).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                    <span>{k}</span><strong>{v}</strong>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Reglas disparadas</h2>
              {Object.keys(rules).length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Sin reglas todavía.</div>
              ) : (
                Object.entries(rules)
                  .sort((a, b) => Number(b[1]) - Number(a[1]))
                  .slice(0, 12)
                  .map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', fontSize: 13 }}>
                      <span style={{ color: '#334155' }}>{k}</span><strong>{v}</strong>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <Link to="/trial-report" style={{ color: '#635bff', fontWeight: 700 }}>Ver informe de ensayo completo →</Link>
            <span style={{ color: '#cbd5e1' }}> · </span>
            <button type="button" onClick={() => void load()} style={{ border: 'none', background: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
              Actualizar
            </button>
          </div>
          {/* silence unused helper if tree-shaken poorly */}
          <span style={{ display: 'none' }}>{formatMoney(0)}</span>
        </>
      )}
    </div>
  );
}
