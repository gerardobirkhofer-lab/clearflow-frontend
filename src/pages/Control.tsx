import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';

function apiDetail(data: any, fallback: string) {
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ');
  }
  return fallback;
}

/** One Control Run — Detail + Reconstruct. */
export default function Control() {
  const [doctrine, setDoctrine] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/v1/control/doctrine`)
      .then((r) => r.json())
      .then(setDoctrine)
      .catch(() => {});
  }, []);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) {
        setError('No hay tenant activo.');
        return;
      }
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API}/api/v1/control/run?tenant_id=${tenant.id}&detail=true&reconstruct=true&create_disputes=true`,
        { method: 'POST', headers: { Authorization: `Bearer ${token || ''}` } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiDetail(data, `Control falló (${res.status})`));
        return;
      }
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Error de red');
    } finally {
      setRunning(false);
    }
  };

  const detail = result?.detail;
  const recon = result?.reconstruct;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>Control de caja</h1>
      <p style={{ color: '#64748b', marginTop: 0 }}>
        Un solo run · dos estrategias. Banco + wallet + facturación + contrato. Siempre documentado.
      </p>

      <div style={{ padding: 14, background: '#0f172a', color: '#e2e8f0', borderRadius: 10, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
        {doctrine?.rule || result?.doctrine || 'Con detalle → Detail. Sin detalle → Reconstruct desde contrato.'}
        <div style={{ marginTop: 8, color: '#94a3b8' }}>
          Claves: {(doctrine?.keys || ['banco', 'wallet', 'facturador', 'contrato']).join(' · ')}
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, marginBottom: 12 }}>{error}</div>
      )}

      <button
        type="button"
        onClick={() => void run()}
        disabled={running}
        style={{
          padding: '12px 22px',
          borderRadius: 8,
          border: 'none',
          background: '#635bff',
          color: 'white',
          fontWeight: 800,
          fontSize: 14,
          cursor: running ? 'not-allowed' : 'pointer',
          opacity: running ? 0.7 : 1,
          marginBottom: 20,
        }}
      >
        {running ? 'Ejecutando control…' : 'Run Control (Detail + Reconstruct)'}
      </button>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Strategy Detail</div>
              {detail ? (
                <>
                  <div>Confirmados: <strong>{detail.confirmed_count ?? detail.matched_count ?? 0}</strong></div>
                  <div>1:N abonos: <strong>{detail.confirmed_1n_bank_count ?? 0}</strong></div>
                  <div>Sugeridos: <strong>{detail.suggested_count ?? 0}</strong></div>
                  <div>Pendientes banco: <strong>{detail.pending_bank_count ?? 0}</strong></div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{detail.engine}</div>
                </>
              ) : (
                <div style={{ color: '#94a3b8' }}>No ejecutado</div>
              )}
            </div>
            <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Strategy Reconstruct</div>
              {recon?.status === 'skipped' ? (
                <div style={{ color: '#92400e', fontSize: 13 }}>{recon.reason}<br />{recon.hint}</div>
              ) : recon ? (
                <>
                  <div>Confirmados por contrato: <strong>{recon.confirmed_by_contract ?? 0}</strong></div>
                  <div>Discrepancias abiertas: <strong style={{ color: '#991b1b' }}>{recon.discrepancies_opened ?? 0}</strong></div>
                  <div>Wallet pendientes: <strong>{recon.wallet_pending_verification ?? 0}</strong></div>
                  <div>Ventas consideradas: <strong>{recon.sales_considered ?? 0}</strong></div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{recon.note}</div>
                </>
              ) : (
                <div style={{ color: '#94a3b8' }}>No ejecutado</div>
              )}
            </div>
          </div>

          {Array.isArray(recon?.samples) && recon.samples.length > 0 && (
            <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Muestra de evidencia (Reconstruct)</div>
              {recon.samples.map((s: any, i: number) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: '#334155' }}>
                  <strong>{s.decision || s.strategy}</strong>
                  {s.expected ? ` · neto esp. ${s.expected.net} · gross ${s.expected.gross}` : ''}
                  {s.bank_tx_id != null ? ` · bank #${s.bank_tx_id}` : ''}
                  {s.provider_tx_id != null ? ` · sale #${s.provider_tx_id}` : ''}
                  {s.reject_reason ? ` · ${s.reject_reason}` : ''}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 20, fontSize: 13 }}>
        <Link to="/setup-wizard" style={{ color: '#635bff', fontWeight: 600 }}>Contratos / Setup →</Link>
        {' · '}
        <Link to="/trial-report" style={{ color: '#635bff', fontWeight: 600 }}>Informe ensayo →</Link>
        {' · '}
        <Link to="/payment-check" style={{ color: '#635bff', fontWeight: 600 }}>Verificación pagos →</Link>
      </div>
    </div>
  );
}
