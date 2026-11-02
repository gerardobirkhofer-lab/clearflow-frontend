import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

interface EmailLog {
  id: number;
  provider_name: string;
  amount: number;
  currency: string;
  concept: string;
  description: string;
  date: string;
  days_open: number;
  recipient_email: string;
  status: 'sent' | 'failed';
  error_message: string | null;
  sent_at: string;
}

interface OutboxItem {
  id: number;
  kind: string;
  status: string;
  dispute_id: number | null;
  provider_name: string;
  to_email: string | null;
  subject: string;
  body_text: string;
  amount: number;
  needs_recipient: boolean;
  created_at: string | null;
  error_message?: string | null;
}

export default function Communications() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'pending' | 'sent'>('pending');
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<OutboxItem | null>(null);
  const [overrideEmail, setOverrideEmail] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const tenantId = () => {
    try {
      return JSON.parse(localStorage.getItem('tenant') || '{}').id;
    } catch {
      return null;
    }
  };

  const fetchOutbox = async () => {
    const tid = tenantId();
    if (!tid) {
      setOutbox([]);
      return;
    }
    const res = await fetch(`${API}/api/v1/email-outbox/?tenant_id=${tid}`, { headers: getAuth() });
    if (!res.ok) {
      setOutbox([]);
      return;
    }
    const data = await res.json();
    setOutbox(data.items || []);
  };

  const fetchLogs = async () => {
    const tid = tenantId();
    if (!tid) {
      setLogs([]);
      return;
    }
    const params = new URLSearchParams({ tenant_id: tid });
    const res = await fetch(`${API}/api/v1/disputes/email-logs?${params}`, { headers: getAuth() });
    const data = await res.json().catch(() => ({}));
    setLogs(res.ok && data.logs ? data.logs : []);
  };

  const refresh = async () => {
    setLoading(true);
    setActionMsg(null);
    try {
      await Promise.all([fetchOutbox(), fetchLogs()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const pending = outbox.filter((i) => i.status === 'pending_approval' || i.status === 'failed');
  const archived = outbox.filter((i) => ['rejected', 'cancelled', 'sent', 'approved'].includes(i.status));

  const approve = async (item: OutboxItem) => {
    const tid = tenantId();
    if (!tid) return;
    setBusyId(item.id);
    setActionMsg(null);
    try {
      const q = new URLSearchParams({ tenant_id: tid });
      if (overrideEmail.trim()) q.set('to_email', overrideEmail.trim());
      const res = await fetch(`${API}/api/v1/email-outbox/${item.id}/approve?${q}`, {
        method: 'POST',
        headers: getAuth(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
      setActionMsg(data.message || 'Autorizado');
      setSelected(null);
      await refresh();
    } catch (e: any) {
      setActionMsg(e.message || 'No se pudo autorizar el envío');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (item: OutboxItem) => {
    const tid = tenantId();
    if (!tid) return;
    setBusyId(item.id);
    setActionMsg(null);
    try {
      const res = await fetch(
        `${API}/api/v1/email-outbox/${item.id}/reject?tenant_id=${tid}`,
        { method: 'POST', headers: getAuth() },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
      setActionMsg(data.message || 'Rechazado');
      setSelected(null);
      await refresh();
    } catch (e: any) {
      setActionMsg(e.message || 'No se pudo rechazar');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          📧 {t('nav.communications')}
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Comunicaciones</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15, maxWidth: 720, lineHeight: 1.5 }}>
          ClearFlow prepara el email a tu liquidadora o banco. <strong>Tú lo lees y autorizas</strong>.
          Si no quieres enviarlo, recházalo: nuestro trabajo (detectar y documentar) ya está hecho.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setTab('pending')}
          style={{
            padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: tab === 'pending' ? '#0f172a' : 'white',
            color: tab === 'pending' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Pendientes de autorización ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          style={{
            padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: tab === 'sent' ? '#0f172a' : 'white',
            color: tab === 'sent' ? 'white' : '#64748b', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Historial enviado ({logs.length})
        </button>
        <button
          type="button"
          onClick={refresh}
          style={{ marginLeft: 'auto', padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600 }}
        >
          Actualizar
        </button>
      </div>

      {actionMsg && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', fontSize: 13 }}>
          {actionMsg}
        </div>
      )}

      {loading && <div style={{ padding: 24, color: '#64748b' }}>Cargando…</div>}

      {tab === 'pending' && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.1fr' : '1fr', gap: 16 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', overflow: 'hidden' }}>
            {pending.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontWeight: 600 }}>No hay borradores pendientes</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  Cuando el motor detecte una discrepancia contractual, el borrador aparecerá aquí.
                </div>
                {archived.length > 0 && (
                  <div style={{ fontSize: 12, marginTop: 12, color: '#94a3b8' }}>
                    {archived.length} borrador(es) ya resueltos (enviados / rechazados).
                  </div>
                )}
              </div>
            ) : (
              pending.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    setOverrideEmail(item.to_email || '');
                  }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '14px 18px',
                    border: 'none', borderBottom: '1px solid #f1f5f9',
                    background: selected?.id === item.id ? '#f5f3ff' : 'white', cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.subject}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    {item.provider_name || 'Proveedor'} · {formatMoney(item.amount)} · {item.status}
                    {item.needs_recipient ? ' · falta email' : ''}
                  </div>
                </button>
              ))
            )}
          </div>

          {selected && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', padding: 20 }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                Vista previa — autorización del cliente
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>{selected.subject}</div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                Destinatario
              </label>
              <input
                value={overrideEmail}
                onChange={(e) => setOverrideEmail(e.target.value)}
                placeholder="reclamaciones@proveedor.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12, fontSize: 14 }}
              />
              <pre style={{
                whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace', fontSize: 12,
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14,
                maxHeight: 360, overflow: 'auto', lineHeight: 1.45, margin: '0 0 16px',
              }}>
                {selected.body_text}
              </pre>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => approve(selected)}
                  style={{
                    padding: '12px 18px', borderRadius: 8, border: 'none', background: '#166534',
                    color: 'white', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Autorizar y enviar
                </button>
                <button
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => reject(selected)}
                  style={{
                    padding: '12px 18px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2',
                    color: '#991b1b', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  No enviar
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, lineHeight: 1.45 }}>
                Al pulsar «No enviar», ClearFlow no contacta al proveedor. La discrepancia permanece en el dashboard.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'sent' && !loading && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', overflow: 'hidden' }}>
          {logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              Aún no hay emails enviados (solo tras tu autorización).
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 100px 100px 1fr',
                  gap: 8,
                  padding: '14px 18px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: 13,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{log.provider_name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 11 }}>{log.concept || '—'}</div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.recipient_email}</div>
                <div style={{ fontWeight: 700 }}>{formatMoney(log.amount)}</div>
                <div style={{ color: log.status === 'sent' ? '#166534' : '#991b1b', fontWeight: 700 }}>
                  {log.status}
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  {log.sent_at ? new Date(log.sent_at).toLocaleString('es-ES') : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
