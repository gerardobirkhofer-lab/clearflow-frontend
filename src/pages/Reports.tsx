import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ExportModal from '../components/ExportModal';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
const formatNumber = (n: number) => new Intl.NumberFormat('es-ES').format(n);
const formatPct = (n: number) => new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n) + '%';

interface ReportCard {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  filename: string;
  data: any[];
  columns: { key: string; label: string }[];
  dateField: string;
}

export default function Reports() {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<ReportCard | null>(null);

  const stores = [
    { id: 'all', name: t('reports.store') + ' ' + t('common.all') },
    { id: '1', name: 'Pura Zona Norte' },
    { id: '2', name: 'Pura Online Shop' },
  ];

  // --- PROVIDER HEALTH DATA (weighted) ---
  const providerHealthData = [
    { provider: 'Stripe', volumePct: 65, feePct: 3.0, weightedCost: 1.95, payoutDays: 3, speedRisk: 1.95, health: 'Healthy', recommendation: 'Negotiate 0.2% reduction = €712/year savings', date: '2026-08-01' },
    { provider: 'Mercado Pago', volumePct: 20, feePct: 3.0, weightedCost: 0.60, payoutDays: 5, speedRisk: 1.00, health: 'Watch', recommendation: 'Acceptable but monitor fee increases', date: '2026-08-01' },
    { provider: 'TPV / Redsys', volumePct: 10, feePct: 3.5, weightedCost: 0.35, payoutDays: 7, speedRisk: 0.70, health: 'At Risk', recommendation: 'Push for faster settlement or reduce volume', date: '2026-08-01' },
    { provider: 'Cash / Other', volumePct: 5, feePct: 0.0, weightedCost: 0.00, payoutDays: 0, speedRisk: 0.00, health: 'Healthy', recommendation: 'No fees — encourage where possible', date: '2026-08-01' },
  ];

  // --- OTHER DEMO DATASETS ---
  const dashboardSummaryData = [
    { metric: 'Ventas Totales', value: '€35.620,00', change: '+12%', period: 'Ago 2026' },
    { metric: 'Payouts Pendientes', value: '€8.420,00', change: '-3%', period: 'Ago 2026' },
    { metric: 'Transacciones Conciliadas', value: '1.149', change: '+5%', period: 'Ago 2026' },
    { metric: 'Transacciones No Conciliadas', value: '23', change: '-8%', period: 'Ago 2026' },
    { metric: 'Ticket Promedio', value: '€30,52', change: '+2%', period: 'Ago 2026' },
    { metric: 'Balance Cash Flow', value: '€4.150,00', change: '+18%', period: 'Ago 2026' },
  ];

  const profitabilityData = [
    { store: 'Pura Zona Norte', revenue: 15420, fees: 462, costs: 6280, net: 8678, margin: '56,3%', date: '2026-08-01' },
    { store: 'Pura Online Shop', revenue: 8930, fees: 268, costs: 3100, net: 5562, margin: '62,3%', date: '2026-08-01' },
    { store: 'Pura Zona Norte', revenue: 14800, fees: 444, costs: 6280, net: 8076, margin: '54,6%', date: '2026-07-01' },
    { store: 'Pura Online Shop', revenue: 9200, fees: 276, costs: 3100, net: 5824, margin: '63,3%', date: '2026-07-01' },
  ];

  const mismatchData = [
    { id: 'TX-001', concept: 'Stripe Payout #4821', expected: 5420, received: 5385, difference: -35, provider: 'Stripe', store: 'Pura Zona Norte', status: 'sin resolver', date: '2026-08-07' },
    { id: 'TX-002', concept: 'TPV Settlement Aug 5', expected: 3200, received: 3180, difference: -20, provider: 'TPV / Redsys', store: 'Pura Zona Norte', status: 'sin resolver', date: '2026-08-06' },
    { id: 'TX-003', concept: 'Mercado Pago Batch', expected: 2100, received: 2095, difference: -5, provider: 'Mercado Pago', store: 'Pura Online Shop', status: 'resuelto', date: '2026-08-05' },
    { id: 'TX-004', concept: 'Stripe Payout #4819', expected: 4800, received: 4770, difference: -30, provider: 'Stripe', store: 'Pura Online Shop', status: 'en disputa', date: '2026-08-04' },
    { id: 'TX-005', concept: 'TPV Settlement Aug 3', expected: 2800, received: 0, difference: -2800, provider: 'TPV / Redsys', store: 'Pura Zona Norte', status: 'sin resolver', date: '2026-08-03' },
  ];

  const feeAnalysisData = [
    { provider: 'Stripe', cardType: 'Tarjeta de Crédito', transactions: 342, gross: 15420, feeAmount: 462, feePct: '3,0%', avgTicket: 45.09, payoutDays: 3, date: '2026-08-07' },
    { provider: 'Stripe', cardType: 'Tarjeta de Débito', transactions: 89, gross: 3200, feeAmount: 96, feePct: '3,0%', avgTicket: 35.96, payoutDays: 3, date: '2026-08-07' },
    { provider: 'TPV / Redsys', cardType: 'Tarjeta de Crédito', transactions: 310, gross: 6200, feeAmount: 186, feePct: '3,0%', avgTicket: 20.00, payoutDays: 7, date: '2026-08-06' },
    { provider: 'TPV / Redsys', cardType: 'Tarjeta de Débito', transactions: 210, gross: 2730, feeAmount: 82, feePct: '3,0%', avgTicket: 13.00, payoutDays: 7, date: '2026-08-06' },
    { provider: 'Mercado Pago', cardType: 'Tarjeta de Crédito', transactions: 150, gross: 5200, feeAmount: 156, feePct: '3,0%', avgTicket: 34.67, payoutDays: 5, date: '2026-08-05' },
    { provider: 'Mercado Pago', cardType: 'Tarjeta de Débito', transactions: 48, gross: 1944, feeAmount: 58, feePct: '3,0%', avgTicket: 40.50, payoutDays: 5, date: '2026-08-05' },
  ];

  const reconciliationData = [
    { date: '2026-08-07', concept: 'Stripe Payout #4821', bankAmount: 5385, providerAmount: 5420, difference: -35, status: 'sin coincidir', bank: 'Santander', provider: 'Stripe', store: 'Pura Zona Norte' },
    { date: '2026-08-06', concept: 'TPV Settlement', bankAmount: 3180, providerAmount: 3200, difference: -20, status: 'sin coincidir', bank: 'BBVA', provider: 'TPV / Redsys', store: 'Pura Zona Norte' },
    { date: '2026-08-06', concept: 'Bank Fee', bankAmount: -45, providerAmount: 0, difference: -45, status: 'coincide', bank: 'Santander', provider: 'N/A', store: 'Pura Zona Norte' },
    { date: '2026-08-05', concept: 'Mercado Pago Batch', bankAmount: 2095, providerAmount: 2095, difference: 0, status: 'coincide', bank: 'Santander', provider: 'Mercado Pago', store: 'Pura Online Shop' },
    { date: '2026-08-04', concept: 'Stripe Payout #4819', bankAmount: 4770, providerAmount: 4770, difference: 0, status: 'coincide', bank: 'BBVA', provider: 'Stripe', store: 'Pura Online Shop' },
  ];

  const reports: ReportCard[] = [
    {
      id: 'dashboard',
      icon: '📊',
      titleKey: 'reports.dashboardSummary',
      descKey: 'reports.dashboardSummaryDesc',
      filename: 'clearflow_dashboard_summary',
      data: dashboardSummaryData,
      columns: [
        { key: 'metric', label: 'Métrica' },
        { key: 'value', label: 'Valor' },
        { key: 'change', label: 'Cambio' },
        { key: 'period', label: 'Período' },
      ],
      dateField: 'period',
    },
    {
      id: 'profitability',
      icon: '💰',
      titleKey: 'reports.profitability',
      descKey: 'reports.profitabilityDesc',
      filename: 'clearflow_profitability',
      data: profitabilityData,
      columns: [
        { key: 'store', label: 'Tienda' },
        { key: 'date', label: 'Mes' },
        { key: 'revenue', label: 'Ingresos (€)' },
        { key: 'fees', label: 'Comisiones (€)' },
        { key: 'costs', label: 'Costos (€)' },
        { key: 'net', label: 'Beneficio Neto (€)' },
        { key: 'margin', label: 'Margen' },
      ],
      dateField: 'date',
    },
    {
      id: 'mismatch',
      icon: '🔍',
      titleKey: 'reports.mismatch',
      descKey: 'reports.mismatchDesc',
      filename: 'clearflow_mismatches',
      data: mismatchData,
      columns: [
        { key: 'id', label: 'Ref ID' },
        { key: 'date', label: 'Fecha' },
        { key: 'store', label: 'Tienda' },
        { key: 'provider', label: 'Proveedor' },
        { key: 'concept', label: 'Concepto' },
        { key: 'expected', label: 'Esperado (€)' },
        { key: 'received', label: 'Recibido (€)' },
        { key: 'difference', label: 'Dif. (€)' },
        { key: 'status', label: 'Estado' },
      ],
      dateField: 'date',
    },
    {
      id: 'fees',
      icon: '💳',
      titleKey: 'reports.fees',
      descKey: 'reports.feesDesc',
      filename: 'clearflow_fee_analysis',
      data: feeAnalysisData,
      columns: [
        { key: 'provider', label: 'Proveedor' },
        { key: 'cardType', label: 'Tipo de Tarjeta' },
        { key: 'date', label: 'Fecha' },
        { key: 'transactions', label: 'Trans.' },
        { key: 'gross', label: 'Bruto (€)' },
        { key: 'feeAmount', label: 'Comisiones (€)' },
        { key: 'feePct', label: '% Comisión' },
        { key: 'avgTicket', label: 'Ticket Prom.' },
        { key: 'payoutDays', label: 'Liquidación (d)' },
      ],
      dateField: 'date',
    },
    {
      id: 'reconciliation',
      icon: '🏦',
      titleKey: 'reports.reconciliation',
      descKey: 'reports.reconciliationDesc',
      filename: 'clearflow_reconciliation',
      data: reconciliationData,
      columns: [
        { key: 'date', label: 'Fecha' },
        { key: 'store', label: 'Tienda' },
        { key: 'bank', label: 'Banco' },
        { key: 'provider', label: 'Proveedor' },
        { key: 'concept', label: 'Concepto' },
        { key: 'bankAmount', label: 'Banco (€)' },
        { key: 'providerAmount', label: 'Proveedor (€)' },
        { key: 'difference', label: 'Dif. (€)' },
        { key: 'status', label: 'Estado' },
      ],
      dateField: 'date',
    },
    {
      id: 'health',
      icon: '📈',
      titleKey: 'reports.health',
      descKey: 'reports.healthDesc',
      filename: 'clearflow_provider_health',
      data: providerHealthData,
      columns: [
        { key: 'provider', label: 'Proveedor' },
        { key: 'volumePct', label: '% Volumen' },
        { key: 'feePct', label: '% Comisión' },
        { key: 'weightedCost', label: 'Costo Ponderado %' },
        { key: 'payoutDays', label: 'Liquidación (d)' },
        { key: 'speedRisk', label: 'Riesgo Velocidad' },
        { key: 'health', label: 'Salud' },
        { key: 'recommendation', label: 'Recomendación' },
      ],
      dateField: 'date',
    },
  ];

  const active = reports.find(r => r.id === activeReport);

  const formatCell = (row: any, key: string) => {
    const val = row[key];
    if (typeof val === 'string') return val;
    if (typeof val === 'number') {
      const k = key.toLowerCase();
      if (k.includes('pct') || k.includes('margin') || k.includes('change')) {
        return formatPct(val);
      }
      if (k.includes('days') || k.includes('transactions') || k.includes('txns')) {
        return formatNumber(val);
      }
      return formatMoney(val);
    }
    return String(val ?? '-');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          📥 {t('reports.title')}
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{t('reports.title')}</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          {t('reports.subtitle')}
        </p>
      </div>

      {/* STORE FILTER */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 12 }}>{t('reports.store')}</label>
        <select style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white', minWidth: 220 }}>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* REPORT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {reports.map(report => (
          <div key={report.id} style={{ padding: 28, borderRadius: 16, border: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>{report.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{t(report.titleKey)}</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, marginBottom: 20, flex: 1 }}>{t(report.descKey)}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{report.data.length} {t('reports.records')}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setViewingReport(report)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: 'white', color: '#0f172a', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                👁️ {t('reports.view') || 'Ver'}
              </button>
              <button
                onClick={() => setActiveReport(report.id)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: '#0f172a', color: 'white', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                📥 {t('reports.download')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DISCLAIMER */}
      <div style={{ marginTop: 32, padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          <strong>{t('reports.usage')}:</strong> {t('reports.usageDesc')}
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewingReport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 960,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                {viewingReport.icon} {t(viewingReport.titleKey)}
              </h2>
              <button
                onClick={() => setViewingReport(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}
              >
                ✕ {t('common.close')}
              </button>
            </div>

            <div style={{ overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {viewingReport.columns.map(col => (
                      <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewingReport.data.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {viewingReport.columns.map(col => (
                        <td key={col.key} style={{ padding: '10px 16px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                          {formatCell(row, col.key)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setViewingReport(null)}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => { setActiveReport(viewingReport.id); setViewingReport(null); }}
                style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0f172a', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                📥 {t('reports.download')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {active && (
        <ExportModal
          isOpen={!!activeReport}
          onClose={() => setActiveReport(null)}
          title={t(active.titleKey)}
          filename={active.filename}
          data={active.data}
          columns={active.columns}
          dateField={active.dateField}
        />
      )}
    </div>
  );
}
