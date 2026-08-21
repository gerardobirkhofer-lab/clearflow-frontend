import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ExportModal from '../components/ExportModal';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const API = import.meta.env.VITE_API_URL;
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

interface Tx {
  id: number;
  concept: string;
  amount: number;
  date: string | null;
  status: string;
  type: string;
  provider_name?: string;
  matched?: boolean;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [summary, setSummary] = useState<any>({});
  const [recent, setRecent] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const t = JSON.parse(localStorage.getItem('tenant') || '{}');
    if (!t.id) {
      setError(t('dashboard.errorLoading'));
      setLoading(false);
      return;
    }
    setTenant(t);
    fetchData(t.id);
  }, []);

  const fetchData = async (tenantId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, recRes] = await Promise.all([
        fetch(`${API}/api/v1/bank-statements/dashboard?tenant_id=${tenantId}`, { headers: getAuth() }),
        fetch(`${API}/api/v1/reconciliation/status?tenant_id=${tenantId}`, { headers: getAuth() }),
      ]);

      if (!dashRes.ok) throw new Error(`Dashboard error: ${dashRes.status}`);
      if (!recRes.ok) throw new Error(`Reconciliation error: ${recRes.status}`);

      const dashData = await dashRes.json();
      const recData = await recRes.json();

      setSummary({ ...dashData.summary, ...recData });

      // Normalize recent activity for display
      const activity = (dashData.recent_activity || [])
        .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 10)
        .map((item: any) => ({
          id: item.id,
          concept: item.concept || '—',
          amount: item.amount || 0,
          date: item.date ? item.date.split('T')[0] : '—',
          status: item.matched ? 'matched' : 'unmatched',
          type: item.type || (item.provider_name ? 'provider' : 'bank'),
          provider_name: item.provider_name,
        }));
      setRecent(activity);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontFamily: 'sans-serif', color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{t('dashboard.loadingSnapshot')}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>{t('dashboard.fetchingData')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: '#991b1b' }}>{t('dashboard.errorLoading')}</h2>
        <p style={{ color: '#64748b' }}>{error}</p>
        <button onClick={() => tenant?.id && fetchData(tenant.id)} style={{ marginTop: 20, padding: '10px 24px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {t('dashboard.retry')}
        </button>
      </div>
    );
  }

  const s = summary;
  const totalTx = (s.bank_transactions || 0) + (s.provider_transactions || 0);
  const matchedTx = (s.matched_bank || 0) + (s.matched_provider || 0);
  const pendingTx = (s.pending_bank || 0) + (s.pending_provider || 0);
  const collectionRate = s.collection_rate || (totalTx ? (matchedTx / totalTx * 100) : 0);

  const tierColors: Record<string, { bg: string; color: string }> = {
    starter: { bg: '#f1f5f9', color: '#64748b' },
    pro: { bg: '#ede9fe', color: '#635bff' },
    enterprise: { bg: '#fef3c7', color: '#92400e' },
  };
  const currentTier = tenant?.tier || 'starter';
  const tierStyle = tierColors[currentTier] || tierColors.starter;

  const rangeLabels: Record<string, string> = {
    '7d': t('dashboard.last7d'),
    '30d': t('dashboard.last30d'),
    '90d': t('dashboard.last90d'),
    'YTD': t('dashboard.yearToDate'),
  };

  return (
    <div className="print-full" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-full { max-width: 100% !important; padding: 20px !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
            📈 {t('dashboard.overview')}
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{t('dashboard.title')}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>
              {tenant?.name ? `${tenant.name} — ` : ''}{t('dashboard.subtitle')}
            </p>
            <span style={{
              background: tierStyle.bg, color: tierStyle.color,
              padding: '3px 10px', borderRadius: 12,
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {currentTier}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowExport(true)}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          📥 {t('common.export')}
        </button>
      </div>

      {showExport && (
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          title="Dashboard Transaction Report"
          filename="clearflow_dashboard"
          data={recent}
          columns={[
            { key: 'concept', label: t('common.concept') },
            { key: 'amount', label: t('common.amount') },
            { key: 'date', label: t('common.date') },
            { key: 'status', label: t('common.status') },
            { key: 'type', label: t('common.type') },
          ]}
        />
      )}

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['7d', '30d', '90d', 'YTD'].map(r => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: timeRange === r ? '#0f172a' : 'white',
              color: timeRange === r ? 'white' : '#64748b',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{rangeLabels[r]}</button>
          ))}
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.totalCollected')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>{formatMoney(s.total_collected)}</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.totalSales')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>{formatMoney(s.total_sales)}</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.matched')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>{matchedTx}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{collectionRate.toFixed(0)}% {t('dashboard.rate')}</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.unmatched')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{pendingTx}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{t('dashboard.needsAttention')}</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.bankTxns')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{s.bank_transactions || 0}</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.providerTxns')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{s.provider_transactions || 0}</div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t('dashboard.recentActivity')}</h2>
          <Link to="/reconciliation" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#635bff', fontSize: 13, fontWeight: 600 }}>
            {t('dashboard.reconcile')} →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div>{t('dashboard.noTransactions')}</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>
              <Link to="/bank-upload" style={{ color: '#635bff' }}>{t('dashboard.uploadBankStatement')}</Link> {t('dashboard.toGetStarted')}
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 100px', padding: '12px 16px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
              <div>{t('common.concept')}</div>
              <div style={{ textAlign: 'right' }}>{t('common.amount')}</div>
              <div style={{ textAlign: 'right' }}>{t('common.date')}</div>
              <div style={{ textAlign: 'center' }}>{t('common.type')}</div>
              <div style={{ textAlign: 'center' }}>{t('common.status')}</div>
            </div>
            {recent.map(tx => (
              <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 100px', padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {tx.concept}
                  {tx.provider_name && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>({tx.provider_name})</span>}
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, color: tx.amount >= 0 ? '#166534' : '#991b1b' }}>
                  {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, color: '#64748b' }}>{tx.date}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: tx.type === 'bank' ? '#dbeafe' : '#fef3c7', color: tx.type === 'bank' ? '#1e40af' : '#92400e' }}>
                    {tx.type === 'bank' ? `🏦 ${t('dashboard.bank')}` : `💳 ${t('dashboard.providerShort')}`}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: tx.status === 'matched' ? '#dcfce7' : '#fef3c7', color: tx.status === 'matched' ? '#166534' : '#92400e' }}>
                    {tx.status === 'matched' ? '✅ ' + t('dashboard.matched') : '⚠️ ' + t('dashboard.unmatched')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
