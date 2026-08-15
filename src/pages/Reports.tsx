import { useState } from 'react';
import ExportModal from '../components/ExportModal';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

interface ReportCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  filename: string;
  data: any[];
  columns: { key: string; label: string }[];
  dateField: string;
}

export default function Reports() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const stores = [
    { id: 'all', name: 'All Stores' },
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
    { metric: 'Total Sales', value: '€35,620.00', change: '+12%', period: 'Aug 2026' },
    { metric: 'Pending Payouts', value: '€8,420.00', change: '-3%', period: 'Aug 2026' },
    { metric: 'Matched Transactions', value: '1,149', change: '+5%', period: 'Aug 2026' },
    { metric: 'Unmatched Transactions', value: '23', change: '-8%', period: 'Aug 2026' },
    { metric: 'Average Ticket', value: '€30.52', change: '+2%', period: 'Aug 2026' },
    { metric: 'Cash Flow Balance', value: '€4,150.00', change: '+18%', period: 'Aug 2026' },
  ];

  const profitabilityData = [
    { store: 'Pura Zona Norte', revenue: 15420, fees: 462, costs: 6280, net: 8678, margin: '56.3%', date: '2026-08-01' },
    { store: 'Pura Online Shop', revenue: 8930, fees: 268, costs: 3100, net: 5562, margin: '62.3%', date: '2026-08-01' },
    { store: 'Pura Zona Norte', revenue: 14800, fees: 444, costs: 6280, net: 8076, margin: '54.6%', date: '2026-07-01' },
    { store: 'Pura Online Shop', revenue: 9200, fees: 276, costs: 3100, net: 5824, margin: '63.3%', date: '2026-07-01' },
  ];

  const mismatchData = [
    { id: 'TX-001', concept: 'Stripe Payout #4821', expected: 5420, received: 5385, difference: -35, provider: 'Stripe', store: 'Pura Zona Norte', status: 'unresolved', date: '2026-08-07' },
    { id: 'TX-002', concept: 'TPV Settlement Aug 5', expected: 3200, received: 3180, difference: -20, provider: 'TPV / Redsys', store: 'Pura Zona Norte', status: 'unresolved', date: '2026-08-06' },
    { id: 'TX-003', concept: 'Mercado Pago Batch', expected: 2100, received: 2095, difference: -5, provider: 'Mercado Pago', store: 'Pura Online Shop', status: 'resolved', date: '2026-08-05' },
    { id: 'TX-004', concept: 'Stripe Payout #4819', expected: 4800, received: 4770, difference: -30, provider: 'Stripe', store: 'Pura Online Shop', status: 'disputed', date: '2026-08-04' },
    { id: 'TX-005', concept: 'TPV Settlement Aug 3', expected: 2800, received: 0, difference: -2800, provider: 'TPV / Redsys', store: 'Pura Zona Norte', status: 'unresolved', date: '2026-08-03' },
  ];

  const feeAnalysisData = [
    { provider: 'Stripe', cardType: 'Credit Card', transactions: 342, gross: 15420, feeAmount: 462, feePct: '3.0%', avgTicket: 45.09, payoutDays: 3, date: '2026-08-07' },
    { provider: 'Stripe', cardType: 'Debit Card', transactions: 89, gross: 3200, feeAmount: 96, feePct: '3.0%', avgTicket: 35.96, payoutDays: 3, date: '2026-08-07' },
    { provider: 'TPV / Redsys', cardType: 'Credit Card', transactions: 310, gross: 6200, feeAmount: 186, feePct: '3.0%', avgTicket: 20.00, payoutDays: 7, date: '2026-08-06' },
    { provider: 'TPV / Redsys', cardType: 'Debit Card', transactions: 210, gross: 2730, feeAmount: 82, feePct: '3.0%', avgTicket: 13.00, payoutDays: 7, date: '2026-08-06' },
    { provider: 'Mercado Pago', cardType: 'Credit Card', transactions: 150, gross: 5200, feeAmount: 156, feePct: '3.0%', avgTicket: 34.67, payoutDays: 5, date: '2026-08-05' },
    { provider: 'Mercado Pago', cardType: 'Debit Card', transactions: 48, gross: 1944, feeAmount: 58, feePct: '3.0%', avgTicket: 40.50, payoutDays: 5, date: '2026-08-05' },
  ];

  const reconciliationData = [
    { date: '2026-08-07', concept: 'Stripe Payout #4821', bankAmount: 5385, providerAmount: 5420, difference: -35, status: 'unmatched', bank: 'Santander', provider: 'Stripe', store: 'Pura Zona Norte' },
    { date: '2026-08-06', concept: 'TPV Settlement', bankAmount: 3180, providerAmount: 3200, difference: -20, status: 'unmatched', bank: 'BBVA', provider: 'TPV / Redsys', store: 'Pura Zona Norte' },
    { date: '2026-08-06', concept: 'Bank Fee', bankAmount: -45, providerAmount: 0, difference: -45, status: 'matched', bank: 'Santander', provider: 'N/A', store: 'Pura Zona Norte' },
    { date: '2026-08-05', concept: 'Mercado Pago Batch', bankAmount: 2095, providerAmount: 2095, difference: 0, status: 'matched', bank: 'Santander', provider: 'Mercado Pago', store: 'Pura Online Shop' },
    { date: '2026-08-04', concept: 'Stripe Payout #4819', bankAmount: 4770, providerAmount: 4770, difference: 0, status: 'matched', bank: 'BBVA', provider: 'Stripe', store: 'Pura Online Shop' },
  ];

  const reports: ReportCard[] = [
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Dashboard Summary Report',
      description: 'Key metrics, totals, and period-over-period changes across all stores.',
      filename: 'clearflow_dashboard_summary',
      data: dashboardSummaryData,
      columns: [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' },
        { key: 'change', label: 'Change' },
        { key: 'period', label: 'Period' },
      ],
      dateField: 'period',
    },
    {
      id: 'profitability',
      icon: '💰',
      title: 'Profitability Report',
      description: 'Revenue, provider fees, operating costs, and net margin per store.',
      filename: 'clearflow_profitability',
      data: profitabilityData,
      columns: [
        { key: 'store', label: 'Store' },
        { key: 'date', label: 'Month' },
        { key: 'revenue', label: 'Revenue (€)' },
        { key: 'fees', label: 'Fees (€)' },
        { key: 'costs', label: 'Costs (€)' },
        { key: 'net', label: 'Net Profit (€)' },
        { key: 'margin', label: 'Margin' },
      ],
      dateField: 'date',
    },
    {
      id: 'mismatch',
      icon: '🔍',
      title: 'Mismatch & Discrepancy Report',
      description: 'All unmatched transactions, missing payouts, and fee discrepancies with status tracking.',
      filename: 'clearflow_mismatches',
      data: mismatchData,
      columns: [
        { key: 'id', label: 'Ref ID' },
        { key: 'date', label: 'Date' },
        { key: 'store', label: 'Store' },
        { key: 'provider', label: 'Provider' },
        { key: 'concept', label: 'Concept' },
        { key: 'expected', label: 'Expected (€)' },
        { key: 'received', label: 'Received (€)' },
        { key: 'difference', label: 'Diff (€)' },
        { key: 'status', label: 'Status' },
      ],
      dateField: 'date',
    },
    {
      id: 'fees',
      icon: '💳',
      title: 'Fee Analysis by Provider & Card',
      description: 'Breakdown of fees per provider, card type, transaction count, and payout timing.',
      filename: 'clearflow_fee_analysis',
      data: feeAnalysisData,
      columns: [
        { key: 'provider', label: 'Provider' },
        { key: 'cardType', label: 'Card Type' },
        { key: 'date', label: 'Date' },
        { key: 'transactions', label: 'Txns' },
        { key: 'gross', label: 'Gross (€)' },
        { key: 'feeAmount', label: 'Fees (€)' },
        { key: 'feePct', label: 'Fee %' },
        { key: 'avgTicket', label: 'Avg Ticket' },
        { key: 'payoutDays', label: 'Payout (d)' },
      ],
      dateField: 'date',
    },
    {
      id: 'reconciliation',
      icon: '🏦',
      title: 'Bank Reconciliation Detail',
      description: 'Line-by-line matching between bank statements and provider reports per store and bank account.',
      filename: 'clearflow_reconciliation',
      data: reconciliationData,
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'store', label: 'Store' },
        { key: 'bank', label: 'Bank' },
        { key: 'provider', label: 'Provider' },
        { key: 'concept', label: 'Concept' },
        { key: 'bankAmount', label: 'Bank (€)' },
        { key: 'providerAmount', label: 'Provider (€)' },
        { key: 'difference', label: 'Diff (€)' },
        { key: 'status', label: 'Status' },
      ],
      dateField: 'date',
    },
    {
      id: 'health',
      icon: '📈',
      title: 'Provider Health Scorecard',
      description: 'Weighted fee analysis, payout speed risk, and health indicators per provider for negotiation insights.',
      filename: 'clearflow_provider_health',
      data: providerHealthData,
      columns: [
        { key: 'provider', label: 'Provider' },
        { key: 'volumePct', label: 'Volume %' },
        { key: 'feePct', label: 'Fee %' },
        { key: 'weightedCost', label: 'Weighted Cost %' },
        { key: 'payoutDays', label: 'Payout (d)' },
        { key: 'speedRisk', label: 'Speed Risk' },
        { key: 'health', label: 'Health' },
        { key: 'recommendation', label: 'Recommendation' },
      ],
      dateField: 'date',
    },
  ];

  const active = reports.find(r => r.id === activeReport);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          📥 Download Center
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Reports</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Generate and download professional reports for your accountant, your bank, or your payment providers.
        </p>
      </div>

      {/* STORE FILTER */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 12 }}>Store:</label>
        <select style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white', minWidth: 220 }}>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* REPORT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {reports.map(report => (
          <div key={report.id} style={{ padding: 28, borderRadius: 16, border: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>{report.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{report.title}</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, marginBottom: 20, flex: 1 }}>{report.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{report.data.length} records</span>
              <button
                onClick={() => setActiveReport(report.id)}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: '#0f172a', color: 'white', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DISCLAIMER */}
      <div style={{ marginTop: 32, padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          <strong>Report Usage:</strong> These reports are generated from your uploaded data and are intended for internal analysis, accountant review, or formal disputes with payment providers. 
          All amounts are shown in EUR. For multi-currency reports, ensure your bank accounts are configured in Setup.
        </div>
      </div>

      {/* EXPORT MODAL */}
      {active && (
        <ExportModal
          isOpen={!!activeReport}
          onClose={() => setActiveReport(null)}
          title={active.title}
          filename={active.filename}
          data={active.data}
          columns={active.columns}
          dateField={active.dateField}
        />
      )}
    </div>
  );
}