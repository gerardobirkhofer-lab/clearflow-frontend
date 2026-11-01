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

export default function TrialReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) {
        setError('No hay tenant activo. Inicia sesión de nuevo.');
        return;
      }
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API}/api/v1/reconciliation/trial-report?tenant_id=${tenant.id}&sample=25`,
        { headers: { Authorization: `Bearer ${token || ''}` } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiDetail(data, `Error cargando informe (${res.status})`));
        return;
      }
      setReport(data);
    } catch (err: any) {
      setError(err?.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totals = report?.totals || {};
  const hist = report?.rules_fired_histogram || {};
  const samples = report?.confirmed_samples || [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          Piloto · motor
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>Informe de ensayo</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15, maxWidth: 640 }}>
          Resumen genérico del motor para cualquier negocio: qué se auto-confirmó, con qué reglas, y qué quedó pendiente.
        </p>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 14px', background: '#0f172a', color: '#e2e8f0', borderRadius: 8, fontSize: 13, lineHeight: 1.45 }}>
        {report?.disclaimer
          || 'Propuesta del motor con evidencia guardada. No es un cierre de caja firmado.'}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#635bff',
            color: 'white',
            fontWeight: 700,
            fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Cargando…' : 'Actualizar informe'}
        </button>
        <Link
          to="/payment-check"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: 'white',
            color: '#0f172a',
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          Ir a Verificación de pagos
        </Link>
      </div>

      {loading && !report ? (
        <div style={{ color: '#64748b', padding: 24 }}>Cargando trial-report…</div>
      ) : report ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Banco', value: totals.bank ?? 0 },
              { label: 'Proveedor', value: totals.provider ?? 0 },
              { label: 'Confirmados', value: totals.confirmed_bank ?? 0, color: '#166534' },
              { label: 'Sugeridos', value: totals.suggested_bank ?? 0, color: '#b45309' },
              { label: 'Pendientes', value: totals.pending_bank ?? 0, color: '#991b1b' },
              { label: '% confirmado', value: `${totals.confirm_rate_pct ?? 0}%`, color: '#4338ca' },
            ].map((c) => (
              <div key={c.label} style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{c.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, color: c.color || '#0f172a' }}>{c.value}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Reglas que dispararon confirmaciones</h2>
            {Object.keys(hist).length === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                Aún no hay confirmaciones con evidencia en este tenant. Subí datos y ejecutá Run en Verificación de pagos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(hist)
                  .sort((a, b) => Number(b[1]) - Number(a[1]))
                  .map(([rule, count]) => (
                    <span
                      key={rule}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: '#eef2ff',
                        color: '#3730a3',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {rule}: {String(count)}
                    </span>
                  ))}
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
              Motor: {report.engine || '—'}
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Muestra de evidencia (confirmados)</h2>
            {samples.length === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Sin muestras todavía.</div>
            ) : (
              samples.map((s: any) => (
                <div
                  key={s.bank_tx_id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    #{s.bank_tx_id} · {s.concept || '—'} ·{' '}
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(s.amount || 0)}
                  </div>
                  <div style={{ color: '#64748b', marginTop: 4 }}>
                    ref {s.reference || '—'}
                    {s.matched_at ? ` · ${new Date(s.matched_at).toLocaleString('es-ES')}` : ''}
                  </div>
                  <div style={{ color: '#4338ca', marginTop: 4, fontSize: 12 }}>
                    {s.match_status || 'confirmed'} · {s.evidence?.match_mode || '1:1'} ·{' '}
                    {(s.evidence?.rules_fired || []).join(', ') || 'sin rules_fired'}
                    {s.evidence?.amount_rule ? ` · ${s.evidence.amount_rule}` : ''}
                    {s.evidence?.legs_sum != null ? ` · sum ${s.evidence.legs_sum}` : ''}
                    {Array.isArray(s.evidence?.provider_tx_ids)
                      ? ` · providers [${s.evidence.provider_tx_ids.join(', ')}]`
                      : s.evidence?.provider_tx_id != null
                        ? ` · provider #${s.evidence.provider_tx_id}`
                        : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
