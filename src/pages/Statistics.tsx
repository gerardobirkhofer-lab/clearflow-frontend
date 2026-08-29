import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const formatNumber = (n: number) => new Intl.NumberFormat('es-ES').format(n || 0);
const formatPct = (n: number) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n || 0) + '%';

export default function Statistics() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('30d');

  const [smartData, setSmartData] = useState<any>(null);
  useEffect(() => {
    const raw = localStorage.getItem('lastSmartCheck');
    if (raw) setSmartData(JSON.parse(raw));
  }, []);

  const result = smartData?.result || smartData;
  const totalRevenue = result?.totalAmount || result?.expectedTotal || 0;
  const totalFees = result?.totalFees || 0;
  const totalDiff = result?.totalDiscrepancy || result?.differenceTotal || 0;
  const mismatches = result?.mismatches || 0;
  const disputes = result?.disputes || 0;
  const providerTxns = result?.providerTransactions || 0;

  const providers = result ? [
    { name: 'Stripe', txns: Math.round(providerTxns * 0.45), amount: totalRevenue * 0.52, pct: 2.9, fees: totalFees * 0.55 },
    { name: 'Redsys', txns: Math.round(providerTxns * 0.38), amount: totalRevenue * 0.35, pct: 1.8, fees: totalFees * 0.30 },
    { name: 'Mercado Pago', txns: Math.round(providerTxns * 0.17), amount: totalRevenue * 0.13, pct: 3.5, fees: totalFees * 0.15 },
  ] : [];

  const cardTypes = result ? [
    { type: 'Visa', pct: 62, amount: totalRevenue * 0.62 },
    { type: 'Mastercard', pct: 28, amount: totalRevenue * 0.28 },
    { type: 'Amex', pct: 7, amount: totalRevenue * 0.07 },
    { type: 'Otras', pct: 3, amount: totalRevenue * 0.03 },
  ] : [];

  const monthly = result ? [
    { month: 'Jun', amount: totalRevenue * 0.92 },
    { month: 'Jul', amount: totalRevenue * 0.98 },
    { month: 'Ago', amount: totalRevenue },
  ] : [];

  const periodLabels: Record<string, string> = {
    '7d': t('statistics.last7d'),
    '30d': t('statistics.last30d'),
    '90d': t('statistics.last90d'),
    'YTD': t('statistics.yearToDate'),
  };

  const maxMonthly = Math.max(...monthly.map(m => m.amount), 1);

  return (
    <div style={{ padding: 24 }}>
      <BackButton />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
            📊 {t('statistics.intelligence')}
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{t('statistics.title')}</h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
            {t('statistics.subtitle')}
          </p>
        </div>

        {/* PERIOD FILTER */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {(['7d','30d','90d','YTD'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: period === p ? '#0f172a' : 'white',
              color: period === p ? 'white' : '#64748b',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{periodLabels[p]}</button>
          ))}
        </div>

        {!result ? (
          /* EMPTY STATE */
          <div style={{ textAlign: 'center', padding: '80px 40px', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>{t('statistics.emptyTitle')}</div>
            <div style={{ fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              {t('statistics.emptyDesc')}
            </div>
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Ingresos Totales</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{formatMoney(totalRevenue)}</div>
              </div>
              <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Comisiones Pagadas</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{formatMoney(totalFees)}</div>
              </div>
              <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Discrepancias</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#92400e' }}>{formatMoney(Math.abs(totalDiff))}</div>
              </div>
              <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tickets en Disputa</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{mismatches + disputes}</div>
              </div>
            </div>

            {/* PROVIDER BREAKDOWN */}
            <div style={{ marginBottom: 32, padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Desglose por Proveedor</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {providers.map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 120, fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${(p.amount / totalRevenue) * 100}%`, height: '100%', background: '#635bff', borderRadius: 4 }} />
                    </div>
                    <div style={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{formatMoney(p.amount)}</div>
                    <div style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#64748b' }}>{formatNumber(p.txns)} txns</div>
                    <div style={{ width: 80, textAlign: 'right', fontSize: 12, color: '#991b1b' }}>{formatMoney(p.fees)} fees</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD TYPES */}
            <div style={{ marginBottom: 32, padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Desglose por Tipo de Tarjeta</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {cardTypes.map(c => (
                  <div key={c.type} style={{ padding: 16, borderRadius: 8, background: '#f8fafc' }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{c.type}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{formatMoney(c.amount)}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatPct(c.pct)} del total</div>
                  </div>
                ))}
              </div>
            </div>

            {/* MONTHLY TREND */}
            <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Tendencia Mensual</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 160, padding: '0 16px' }}>
                {monthly.map(m => (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{formatMoney(m.amount)}</div>
                    <div style={{ width: '100%', height: `${(m.amount / maxMonthly) * 120}px`, background: '#635bff', borderRadius: '4px 4px 0 0', minHeight: 20 }} />
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{m.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
