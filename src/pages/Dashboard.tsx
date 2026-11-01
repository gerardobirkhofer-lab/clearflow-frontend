import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ExportModal from '../components/ExportModal';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
// Force Railway API in production — Vercel env var may be stale
const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';
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
  source?: string;
  bank_name?: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [summary, setSummary] = useState<any>({});
  const [recent, setRecent] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      const dashRes = await fetch(
        `${API}/api/v1/bank-statements/dashboard?tenant_id=${tenantId}`,
        { headers: getAuth() },
      );
      if (!dashRes.ok) throw new Error(`Dashboard error: ${dashRes.status}`);

      const dashData = await dashRes.json();

      let recData: any = {};
      try {
        const recRes = await fetch(
          `${API}/api/v1/reconciliation/status?tenant_id=${tenantId}`,
          { headers: getAuth() },
        );
        if (recRes.ok) recData = await recRes.json();
      } catch {
        // Reconciliation status is optional for the dashboard snapshot
      }

      setSummary({ ...(dashData.summary || {}), ...recData });
      setSmartCheckDate(null);

      const activity = (dashData.recent_activity || [])
        .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 25)
        .map((item: any) => ({
          id: item.id,
          concept: item.concept || '—',
          amount: item.amount || 0,
          date: item.date ? String(item.date).split('T')[0] : '—',
          status: (item.match_status === 'confirmed' || item.matched) ? 'matched' : 'unmatched',
          type: item.type || (item.provider_name ? 'provider' : 'bank'),
          provider_name: item.provider_name,
          matched: !!item.matched || item.match_status === 'confirmed',
          source: item.source,
          bank_name: item.bank_name,
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
  const bankTxCount = s.bank_transactions || s.bank_count || 0;
  const providerTxCount = s.provider_transactions || s.provider_count || 0;
  const obCount = s.open_banking_transactions || 0;
  // Prefer reconciliation status (confirmed/pending) when present — same truth as Payment Check
  const matchedCount = s.confirmed_bank ?? s.matched_bank ?? s.matched_count ?? 0;
  const pendingCount = s.pending_bank ?? s.pending_count ?? Math.max(0, bankTxCount - matchedCount);
  const contractualCount = s.contractual_discrepancies ?? 0;
  const gatewayDevCount = s.gateway_fee_deviations ?? 0;
  const collectionRate = bankTxCount ? (matchedCount / bankTxCount * 100) : (s.collection_rate || 0);
  const hasMovements = bankTxCount > 0 || providerTxCount > 0 || recent.length > 0;

  const tierColors: Record<string, { bg: string; color: string }> = {
    starter: { bg: '#f1f5f9', color: '#64748b' },
    pro: { bg: '#ede9fe', color: '#635bff' },
    enterprise: { bg: '#fef3c7', color: '#92400e' },
  };
  const currentTier = tenant?.tier || 'starter';
  const tierStyle = tierColors[currentTier] || tierColors.starter;

  const sourceLabel = (tx: Tx) => {
    if (tx.source === 'open_banking') return 'Open Banking';
    if (tx.source === 'csv') return 'CSV';
    if (tx.type === 'provider') return tx.provider_name || 'Proveedor';
    return tx.type === 'bank' ? 'Banco' : 'Proveedor';
  };

  return (
    <div className="print-full" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
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

      <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: 13, lineHeight: 1.45 }}>
        <strong>Propuesta del motor · no es un cierre firmado.</strong> Solo se confirman pares si el apunte bancario
        cuadra con el neto recalculado desde el contrato (no el neto de la pasarela). Lo dudoso o desviado queda
        <em> Pendiente</em> o como <em>Discrepancia contractual</em>.{' '}
        <Link to="/trial-report" style={{ color: '#635bff', fontWeight: 700 }}>Ver informe de ensayo →</Link>
      </div>

      {contractualCount > 0 && (
        <div style={{ marginBottom: 16, padding: '12px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b', fontSize: 13, lineHeight: 1.45, fontWeight: 600 }}>
          {contractualCount} discrepancia(s) contractual(es) bloqueada(s): el banco no encaja con las reglas de comisión del contrato.
          Alta automática denegada para proteger al cliente.
        </div>
      )}

      {obCount > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#065f46', fontSize: 13, fontWeight: 600 }}>
          🏦 {obCount} movimientos sincronizados por Open Banking
        </div>
      )}

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
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Confirmados</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>{matchedCount}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{collectionRate.toFixed(0)}% del banco</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pendientes</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{pendingCount}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>sin evidencia suficiente</div>
        </div>
        <div style={{
          padding: 24,
          borderRadius: 12,
          border: contractualCount > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
          background: contractualCount > 0 ? '#fef2f2' : 'white',
        }}>
          <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Discrepancias contractuales
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{contractualCount}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            {gatewayDevCount > 0
              ? `${gatewayDevCount} desviación(es) vs pasarela`
              : 'banco ≠ neto del contrato'}
          </div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.bankTxns')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{bankTxCount}</div>
          {obCount > 0 && (
            <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>{obCount} Open Banking</div>
          )}
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('dashboard.providerTxns')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{providerTxCount}</div>
        </div>
      </div>

      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🏦 Movimientos recientes</h2>
          <Link to="/payment-check" style={{ fontSize: 13, fontWeight: 600, color: '#635bff', textDecoration: 'none' }}>
            Ver verificación de pagos →
          </Link>
        </div>

        {!hasMovements ? (
          <div style={{ padding: '28px 12px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Todavía no hay movimientos</div>
            <div style={{ fontSize: 14, marginBottom: 16 }}>
              Conectá el banco en Setup (Open Banking) o subí un extracto CSV.
            </div>
            <Link
              to="/setup"
              style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 8, background: '#635bff', color: 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
            >
              Ir a Setup → Banco
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 120px 110px',
              padding: '10px 12px',
              background: '#f8fafc',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
              minWidth: 640,
            }}>
              <div>Concepto</div>
              <div style={{ textAlign: 'right' }}>Monto</div>
              <div style={{ textAlign: 'right' }}>Fecha</div>
              <div style={{ textAlign: 'center' }}>Origen</div>
              <div style={{ textAlign: 'center' }}>Estado</div>
            </div>
            {recent.map((tx) => (
              <div
                key={`${tx.type}-${tx.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 120px 110px',
                  padding: '12px',
                  alignItems: 'center',
                  borderBottom: '1px solid #f1f5f9',
                  minWidth: 640,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.concept}</div>
                  {tx.bank_name && (
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{tx.bank_name}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: tx.amount >= 0 ? '#166534' : '#991b1b' }}>
                  {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, color: '#64748b' }}>{tx.date || '—'}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    background: tx.source === 'open_banking' ? '#d1fae5' : tx.type === 'bank' ? '#dbeafe' : '#f3e8ff',
                    color: tx.source === 'open_banking' ? '#065f46' : tx.type === 'bank' ? '#1e40af' : '#7c3aed',
                  }}>
                    {sourceLabel(tx)}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    background: tx.matched ? '#dcfce7' : '#fee2e2',
                    color: tx.matched ? '#166534' : '#991b1b',
                  }}>
                    {tx.matched || tx.status === 'matched' ? 'Confirmado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>⚡ Acciones Rápidas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Link to="/trial-report" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#3730a3', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            🧪 Informe de ensayo
          </Link>
          <Link to="/payment-check" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚡ Verificación de Pagos
          </Link>
          <Link to="/setup" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #d1fae5', background: '#ecfdf5', color: '#065f46', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏦 Banco / Open Banking
          </Link>
          <Link to="/hub" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏠 Camino piloto
          </Link>
        </div>
      </div>
    </div>
  );
}
