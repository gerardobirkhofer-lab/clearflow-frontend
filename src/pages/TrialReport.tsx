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
  if (data?.detail?.message) return data.detail.message;
  return fallback;
}

export default function TrialReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [closes, setCloses] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [signing, setSigning] = useState(false);
  const [allowOpen, setAllowOpen] = useState(false);
  const [signMsg, setSignMsg] = useState<string | null>(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  });

  const tenantId = () => {
    try {
      return JSON.parse(localStorage.getItem('tenant') || '{}').id as string | undefined;
    } catch {
      return undefined;
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const tid = tenantId();
      if (!tid) {
        setError('No hay tenant activo. Inicia sesión de nuevo.');
        return;
      }
      const qs = new URLSearchParams({ tenant_id: tid, sample: '25' });
      if (dateFrom) qs.set('date_from', dateFrom);
      if (dateTo) qs.set('date_to', dateTo);
      const [res, closesRes] = await Promise.all([
        fetch(`${API}/api/v1/reconciliation/trial-report?${qs}`, { headers: authHeaders() }),
        fetch(`${API}/api/v1/reconciliation/signed-closes?tenant_id=${tid}&limit=10`, {
          headers: authHeaders(),
        }),
      ]);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiDetail(data, `Error cargando informe (${res.status})`));
        return;
      }
      setReport(data);
      if (closesRes.ok) {
        const c = await closesRes.json();
        setCloses(c.closes || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  const signClose = async () => {
    const tid = tenantId();
    if (!tid || !dateFrom || !dateTo) {
      setError('Para firmar el cierre necesitás date_from y date_to.');
      return;
    }
    setSigning(true);
    setSignMsg(null);
    setError(null);
    try {
      const qs = new URLSearchParams({
        tenant_id: tid,
        date_from: dateFrom,
        date_to: dateTo,
        allow_open_items: allowOpen ? 'true' : 'false',
      });
      const res = await fetch(`${API}/api/v1/reconciliation/signed-close?${qs}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiDetail(data, `No se pudo firmar (${res.status})`));
        return;
      }
      setSignMsg(
        `Cierre #${data.id} firmado · hash ${String(data.evidence_hash || '').slice(0, 12)}…`,
      );
      await load();
    } catch (e: any) {
      setError(e?.message || 'Error de red');
    } finally {
      setSigning(false);
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
          Piloto · motor vs cliente
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>Informe de ensayo</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15, maxWidth: 640 }}>
          Separá lo que el motor auto-confirmó de lo que vos validaste. Firmá un periodo cuando no queden sugeridos.
        </p>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 14px', background: '#0f172a', color: '#e2e8f0', borderRadius: 8, fontSize: 13, lineHeight: 1.45 }}>
        {report?.disclaimer
          || 'Propuesta del motor vs validación del cliente. No es auditoría externa.'}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <label style={{ fontSize: 13 }}>
          Desde{' '}
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </label>
        <label style={{ fontSize: 13 }}>
          Hasta{' '}
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </label>
        <label style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={allowOpen} onChange={(e) => setAllowOpen(e.target.checked)} />
          Permitir cierre con pendientes
        </label>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}
      {signMsg && (
        <div style={{ marginBottom: 16, padding: 12, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#065f46', fontSize: 13 }}>
          {signMsg}
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
        <button
          type="button"
          onClick={() => void signClose()}
          disabled={signing || !dateFrom || !dateTo}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#0f172a',
            color: 'white',
            fontWeight: 700,
            fontSize: 13,
            cursor: signing || !dateFrom || !dateTo ? 'not-allowed' : 'pointer',
            opacity: signing || !dateFrom || !dateTo ? 0.6 : 1,
          }}
        >
          {signing ? 'Firmando…' : 'Firmar cierre del periodo'}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Banco', value: totals.bank ?? 0 },
              { label: 'Motor auto', value: totals.motor_confirmed_bank ?? 0, color: '#166534' },
              { label: 'Validado vos', value: totals.user_confirmed_bank ?? 0, color: '#1e40af' },
              { label: 'Sugeridos', value: totals.suggested_bank ?? 0, color: '#b45309' },
              { label: 'Rechazados', value: totals.rejected_bank ?? 0, color: '#64748b' },
              { label: 'Pendientes', value: totals.pending_bank ?? 0, color: '#991b1b' },
              { label: '% cerrado', value: `${totals.confirm_rate_pct ?? 0}%`, color: '#4338ca' },
            ].map((c) => (
              <div key={c.label} style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color: c.color || '#0f172a' }}>{c.value}</div>
              </div>
            ))}
          </div>

          {closes.length > 0 && (
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Cierres firmados</h2>
              {closes.map((c) => (
                <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <strong>#{c.id}</strong> · {c.date_from} → {c.date_to} · motor {c.motor_confirmed} · vos {c.user_confirmed}
                  <div style={{ color: '#94a3b8', fontSize: 11 }}>
                    {c.signed_by_email} · {c.signed_at ? new Date(c.signed_at).toLocaleString('es-ES') : ''} · hash {String(c.evidence_hash || '').slice(0, 16)}…
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Reglas que dispararon decisiones</h2>
            {Object.keys(hist).length === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                Aún no hay evidencia en este tenant. Subí datos y ejecutá Run en Verificación de pagos.
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
            <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Muestra de evidencia</h2>
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
                    {s.match_status || 'confirmed'} · score {s.evidence?.score ?? '—'} · {s.evidence?.match_mode || '1:1'} ·{' '}
                    {(s.evidence?.rules_fired || []).join(', ') || 'sin rules_fired'}
                    {s.evidence?.amount_rule ? ` · ${s.evidence.amount_rule}` : ''}
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
