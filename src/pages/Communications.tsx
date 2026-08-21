import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

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

export default function Communications() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) {
        setLogs([]);
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({ tenant_id: tenant.id });
      if (filterProvider !== 'all') params.append('provider', filterProvider);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/disputes/email-logs?${params}`);
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterProvider, filterStatus]);

  const totalAmount = logs.reduce((s, log) => s + (log.amount || 0), 0);
  const sentCount = logs.filter(l => l.status === 'sent').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const providers = Array.from(new Set(logs.map(l => l.provider_name)));

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    sent: { bg: '#dcfce7', text: '#166534', label: '✓ ' + t('common.sent') },
    failed: { bg: '#fee2e2', text: '#991b1b', label: '✗ ' + t('common.failed') },
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />

      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          📧 {t('nav.communications')}
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{t('communications.title')}</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          {t('communications.subtitle')}
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('communications.totalEmails')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#0f172a' }}>{logs.length}</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('communications.sentSuccessfully')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>{sentCount}</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('common.failed')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: failedCount > 0 ? '#991b1b' : '#94a3b8' }}>{failedCount}</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('communications.totalDisputedAmount')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#0f172a' }}>{formatMoney(totalAmount)}</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('communications.providersContacted')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#635bff' }}>{providers.length}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}>
          <option value="all">{t('common.all')} {t('common.provider')}</option>
          <option value="Stripe">Stripe</option>
          <option value="TPV / Redsys">TPV / Redsys</option>
          <option value="Mercado Pago">Mercado Pago</option>
          <option value="Karma">Karma</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}>
          <option value="all">{t('common.all')} {t('common.status')}</option>
          <option value="sent">✓ {t('common.sent')}</option>
          <option value="failed">✗ {t('common.failed')}</option>
        </select>
        <button
          onClick={fetchLogs}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          🔄 {t('common.refresh')}
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{logs.length} {t('common.total').toLowerCase()}</span>
      </div>

      {/* TABLE */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '50px 1.2fr 1.5fr 100px 90px 100px 120px 140px', padding: '14px 20px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
          <div>ID</div>
          <div>{t('common.provider')}</div>
          <div>{t('common.concept')}</div>
          <div style={{ textAlign: 'right' }}>{t('common.amount')}</div>
          <div style={{ textAlign: 'center' }}>{t('mismatchTracker.daysOpen')}</div>
          <div style={{ textAlign: 'center' }}>{t('common.status')}</div>
          <div style={{ textAlign: 'center' }}>{t('communications.sentAt')}</div>
          <div>{t('communications.recipient')}</div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
            <div>{t('common.loading')}</div>
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '50px 1.2fr 1.5fr 100px 90px 100px 120px 140px', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#635bff' }}>#{log.id}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{log.provider_name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.date || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{log.concept || '—'}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{log.description || t('common.noData')}</div>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700 }}>{formatMoney(log.amount)}</div>
              <div style={{ textAlign: 'center', fontWeight: 600, color: log.days_open > 14 ? '#991b1b' : '#64748b' }}>
                {log.days_open}d
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: statusColors[log.status]?.bg || '#f1f5f9',
                  color: statusColors[log.status]?.text || '#64748b',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                }}>
                  {statusColors[log.status]?.label || log.status}
                </span>
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                {log.sent_at ? new Date(log.sent_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
              <div style={{ fontSize: 12, color: '#0f172a', fontFamily: 'monospace' }}>
                {log.recipient_email}
              </div>
            </div>
          ))
        )}

        {!loading && logs.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600 }}>{t('communications.noCommunications')}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{t('communications.noCommunicationsDesc')}</div>
          </div>
        )}
      </div>
    </div>
  );
}
