import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

/** Real export / summary only — demo Pura datasets removed. */
export default function Reports() {
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [purgeMsg, setPurgeMsg] = useState<string | null>(null);

  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');

  useEffect(() => {
    void loadSummary();
  }, []);

  const loadSummary = async () => {
    setError(null);
    try {
      if (!tenant.id) {
        setError('No hay tenant activo.');
        return;
      }
      const res = await fetch(`${API}/api/v1/data/summary?tenant_id=${tenant.id}`, { headers: getAuth() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.detail === 'string' ? data.detail : `Error ${res.status}`);
        return;
      }
      setSummary(data);
    } catch (e: any) {
      setError(e?.message || 'Error de red');
    }
  };

  const download = async (format: 'json' | 'csv') => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/v1/data/export?tenant_id=${tenant.id}&format=${format}&limit=5000`,
        { headers: getAuth() },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.detail === 'string' ? data.detail : `Export falló (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clearflow_export_${tenant.id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || 'Error descargando');
    } finally {
      setBusy(false);
    }
  };

  const purge = async () => {
    const ok = window.confirm(
      '¿Borrar TODOS los movimientos banco/proveedor de este tenant? Irreversible. El login y el tenant se conservan.',
    );
    if (!ok) return;
    const typed = window.prompt('Escribí DELETE para confirmar:');
    if (typed !== 'DELETE') {
      setPurgeMsg('Cancelado — hay que escribir DELETE exactamente.');
      return;
    }
    setBusy(true);
    setPurgeMsg(null);
    try {
      const res = await fetch(`${API}/api/v1/data/purge`, {
        method: 'POST',
        headers: { ...getAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE', tenant_id: tenant.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.detail === 'string' ? data.detail : `Purge falló (${res.status})`);
        return;
      }
      setPurgeMsg(
        `Borrados: banco ${data.deleted?.bank_transactions ?? 0}, proveedor ${data.deleted?.provider_transactions ?? 0}.`,
      );
      await loadSummary();
    } catch (e: any) {
      setError(e?.message || 'Error en purge');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>Datos e informes</h1>
      <p style={{ color: '#64748b' }}>
        Export real de tu partición (tenant). Las plantillas demo “Pura / Ago 2026” fueron retiradas.
      </p>

      <div style={{ marginBottom: 16, padding: 12, background: '#0f172a', color: '#e2e8f0', borderRadius: 8, fontSize: 13, lineHeight: 1.45 }}>
        {summary?.disclaimer
          || 'Partición lógica por tenant_id en la nube ClearFlow — no es DB dedicada / BYO.'}
      </div>

      {error && (
        <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, marginBottom: 12 }}>{error}</div>
      )}
      {purgeMsg && (
        <div style={{ padding: 12, background: '#ecfdf5', color: '#065f46', borderRadius: 8, marginBottom: 12 }}>{purgeMsg}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Banco', value: summary?.bank_transactions ?? '—' },
          { label: 'Proveedor', value: summary?.provider_transactions ?? '—' },
          { label: 'Confirmados', value: summary?.confirmed_bank ?? '—' },
          { label: 'Pendientes', value: summary?.pending_bank ?? '—' },
        ].map((c) => (
          <div key={c.label} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Exportar</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 0 }}>
          Incluye movimientos y <code>match_evidence</code> (hasta 5.000 filas por tabla).
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={busy || !tenant.id}
            onClick={() => void download('json')}
            style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#635bff', color: 'white', fontWeight: 700, cursor: 'pointer' }}
          >
            Descargar JSON
          </button>
          <button
            type="button"
            disabled={busy || !tenant.id}
            onClick={() => void download('csv')}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
          >
            Descargar CSV
          </button>
          <Link to="/trial-report" style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#3730a3', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
            Informe de ensayo →
          </Link>
        </div>
      </div>

      <div style={{ padding: 20, border: '1px solid #fecaca', borderRadius: 12, background: '#fef2f2' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16, color: '#991b1b' }}>Borrar datos del tenant</h2>
        <p style={{ fontSize: 13, color: '#7f1d1d', marginTop: 0 }}>
          Purge de movimientos y jobs. No borra el usuario ni el registro del tenant. Irreversible.
        </p>
        <button
          type="button"
          disabled={busy || !tenant.id}
          onClick={() => void purge()}
          style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#991b1b', color: 'white', fontWeight: 700, cursor: 'pointer' }}
        >
          Purge (pedir confirmación)
        </button>
      </div>
    </div>
  );
}
