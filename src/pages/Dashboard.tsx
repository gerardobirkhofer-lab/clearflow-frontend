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
  const [smartCheckDate, setSmartCheckDate] = useState<string | null>(null);

  useEffect(() => {
    const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
    if (!tenantData.id) {
      setError(t('dashboard.errorLoading'));
      setLoading(false);
      return;
    }
    setTenant(tenantData);
    fetchData(tenantData.id);
  }, []);

  const loadFromLocalStorage = () => {
    const raw = localStorage.getItem('lastSmartCheck');
    if (!raw) return false;
    try {
      const sc = JSON.parse(raw);
      const result = sc.result || sc;
      const date = sc.date || sc.createdAt || result.date || '';
      setSmartCheckDate(date || null);
      const totalItems = (result.matched || 0) + (result.mismatches || 0) + (result.disputes || 0);
      setSummary({
        total_collected: result.totalAmount || result.total_collected || 0,
        total_sales: result.totalAmount || result.total_sales || 0,
        matched_bank: result.matched || 0,
        matched_provider: 0,
        pending_bank: result.mismatches || 0,
        pending_provider: result.disputes || 0,
        bank_transactions: (result.matched || 0) + (result.mismatches || 0),
        provider_transactions: (result.matched || 0) + (result.disputes || 0),
        collection_rate: totalItems > 0 ? ((result.matched || 0) / totalItems * 100) : 0,
      });
      setRecent([]);
      return true;
    } catch {
      return false;
    }
  };

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

      const hasData = dashData.summary && (
        (dashData.summary.bank_transactions || 0) > 0 ||
        (dashData.summary.provider_transactions || 0) > 0 ||
        (dashData.recent_activity || []).length > 0
      );

      if (!hasData) throw new Error('No dashboard data');

      setSummary({ ...dashData.summary, ...recData });
      setSmartCheckDate(null);

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
      const loaded = loadFromLocalStorage();
      if (!loaded) {
        setError(err.message);
      }
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

      {smartCheckDate && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, color: '#4338ca', fontSize: 13, fontWeight: 600 }}>
          📊 Último SmartCheck: {new Date(smartCheckDate).toLocaleDateString('es-ES')}
        </div>
      )}

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

      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>⚡ Acciones Rápidas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Link to="/mismatch-tracker" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #fee2e2', background: '#fef2f2', color: '#991b1b', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Ver Discrepancias
          </Link>
          <Link to="/dispute-tracker" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #ffedd5', background: '#fff7ed', color: '#9a3412', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔴 Ver Disputas Abiertas
          </Link>
          <Link to="/communications" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📧 Ver Comunicaciones
          </Link>
          <Link to="/reports" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #d1fae5', background: '#f0fdf4', color: '#166534', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Ver Informes
          </Link>
          <Link to="/revenue-control" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #e9d5ff', background: '#faf5ff', color: '#7e22ce', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            💰 Revenue Control (Beta)
          </Link>
          <Link to="/statistics" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #ccfbf1', background: '#f0fdfa', color: '#0f766e', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📈 Statistics
          </Link>
          <Link to="/profitability" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #fef08a', background: '#fefce8', color: '#854d0e', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📉 Profitability
          </Link>
        </div>
      </div>
    </div>
  );
}
