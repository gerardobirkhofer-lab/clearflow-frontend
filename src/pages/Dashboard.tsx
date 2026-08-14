import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ExportModal from '../components/ExportModal';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

interface CashFlowDay {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

interface MismatchSummary {
  provider: string;
  collectionMismatch: number;
  collectionTickets: number;
  feeDiscrepancy: number;
  feeTickets: number;
  solvedAmount: number;
  solvedTickets: number;
  pendingAmount: number;
  pendingTickets: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [selectedStore, setSelectedStore] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');

  const stores = [
    { id: 'all', name: 'All Stores' },
    { id: '1', name: 'Pura Zona Norte' },
    { id: '2', name: 'Pura Online Shop' },
  ];

  const stats = {
    totalSales: 35620,
    pendingPayouts: 8420,
    matchedTransactions: 1149,
    unmatchedTransactions: 23,
    avgTicket: 30.52,
    resolvedThisMonth: 3,
  };

  const mismatchSummary: MismatchSummary[] = [
    { provider: 'Stripe', collectionMismatch: 65, collectionTickets: 2, feeDiscrepancy: 30, feeTickets: 1, solvedAmount: 50, solvedTickets: 1, pendingAmount: 45, pendingTickets: 2 },
    { provider: 'TPV / Redsys', collectionMismatch: 2820, collectionTickets: 2, feeDiscrepancy: 0, feeTickets: 0, solvedAmount: 15, solvedTickets: 1, pendingAmount: 2805, pendingTickets: 1 },
    { provider: 'Mercado Pago', collectionMismatch: 5, collectionTickets: 1, feeDiscrepancy: 8, feeTickets: 1, solvedAmount: 5, solvedTickets: 1, pendingAmount: 8, pendingTickets: 1 },
  ];

  const totalCollectionMismatch = mismatchSummary.reduce((s, m) => s + m.collectionMismatch, 0);
  const totalFeeDiscrepancy = mismatchSummary.reduce((s, m) => s + m.feeDiscrepancy, 0);
  const totalSolved = mismatchSummary.reduce((s, m) => s + m.solvedAmount, 0);
  const totalPending = mismatchSummary.reduce((s, m) => s + m.pendingAmount, 0);
  const totalTickets = mismatchSummary.reduce((s, m) => s + m.collectionTickets + m.feeTickets, 0);
  const totalSolvedTickets = mismatchSummary.reduce((s, m) => s + m.solvedTickets, 0);
  const totalPendingTickets = mismatchSummary.reduce((s, m) => s + m.pendingTickets, 0);

  const cashFlow: CashFlowDay[] = [
    { date: 'Aug 1', inflow: 1200, outflow: 800, balance: 400 },
    { date: 'Aug 2', inflow: 1500, outflow: 900, balance: 600 },
    { date: 'Aug 3', inflow: 1100, outflow: 700, balance: 400 },
    { date: 'Aug 4', inflow: 1800, outflow: 1000, balance: 800 },
    { date: 'Aug 5', inflow: 1300, outflow: 850, balance: 450 },
    { date: 'Aug 6', inflow: 1600, outflow: 950, balance: 650 },
    { date: 'Aug 7', inflow: 1400, outflow: 800, balance: 600 },
  ];

  const recentTransactions = [
    { id: 1, concept: 'Stripe Payout', amount: 15420, date: '2026-08-07', status: 'matched', type: 'inflow' },
    { id: 2, concept: 'TPV Settlement', amount: 8930, date: '2026-08-06', status: 'matched', type: 'inflow' },
    { id: 3, concept: 'Bank Fee', amount: -45, date: '2026-08-06', status: 'matched', type: 'outflow' },
    { id: 4, concept: 'Mercado Pago', amount: 7144, date: '2026-08-05', status: 'unmatched', type: 'inflow' },
    { id: 5, concept: 'Rent Payment', amount: -1500, date: '2026-08-01', status: 'matched', type: 'outflow' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontFamily: 'sans-serif', color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Loading snapshot...</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>Fetching your latest data</div>
        </div>
      </div>
    );
  }

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
            📈 Overview
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Dashboard</h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
            Real-time view of your cash position across all stores.
          </p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#0f172a', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          📥 Export
        </button>
      </div>

      {showExport && (
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          title="Dashboard Transaction Report"
          filename="clearflow_dashboard"
          data={recentTransactions}
          columns={[
            { key: 'concept', label: 'Concept' },
            { key: 'amount', label: 'Amount (€)' },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status' },
            { key: 'type', label: 'Type' },
          ]}
        />
      )}

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          {['7d', '30d', '90d', 'YTD'].map(r => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: timeRange === r ? '#0f172a' : 'white',
              color: timeRange === r ? 'white' : '#64748b',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{r === 'YTD' ? 'Year to Date' : `Last ${r}`}</button>
          ))}
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Sales</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>{formatMoney(stats.totalSales)}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>+12% vs last period</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending Payouts</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#92400e' }}>{formatMoney(stats.pendingPayouts)}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>3 providers awaiting</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Matched</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>{stats.matchedTransactions}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>98% reconciliation rate</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Unmatched</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{stats.unmatchedTransactions}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Needs attention</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg Ticket</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{formatMoney(stats.avgTicket)}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Across all providers</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resolved This Month</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>{stats.resolvedThisMonth}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Mismatches closed</div>
        </div>
      </div>

      {/* MISMATCH OVERVIEW SECTION */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Mismatch Overview</h2>
            <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>Collection mismatches and fee discrepancies by provider</p>
          </div>
          <Link to="/mismatch-tracker" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#635bff', fontSize: 13, fontWeight: 600 }}>
  Open Tracker →
</Link>        </div>

        {/* MISMATCH SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #fee2e2', background: '#fef2f2' }}>
            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>🔴 Collection Mismatches</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{formatMoney(totalCollectionMismatch)}</div>
            <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>{totalTickets} tickets total</div>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #fee2e2', background: '#fef2f2' }}>
            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>🔴 Fee Discrepancies</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{formatMoney(totalFeeDiscrepancy)}</div>
            <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>Overcharged fees</div>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #dcfce7', background: '#f0fdf4' }}>
            <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>🟢 Solved</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#166534' }}>{formatMoney(totalSolved)}</div>
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>{totalSolvedTickets} tickets closed</div>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #fef3c7', background: '#fffbeb' }}>
            <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>🟡 Pending Recovery</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#92400e' }}>{formatMoney(totalPending)}</div>
            <div style={{ fontSize: 12, color: '#a16207', marginTop: 4 }}>{totalPendingTickets} tickets open</div>
          </div>
        </div>

        {/* MISMATCH DETAIL TABLE */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 1fr 80px 1fr 80px 1fr 80px', padding: '14px 20px', background: '#f8fafc', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0', gap: 8 }}>
            <div>Provider</div>
            <div style={{ textAlign: 'right', color: '#991b1b' }}>Collection Mismatch</div>
            <div style={{ textAlign: 'center', color: '#991b1b' }}>Tickets</div>
            <div style={{ textAlign: 'right', color: '#991b1b' }}>Fee Discrepancy</div>
            <div style={{ textAlign: 'center', color: '#991b1b' }}>Tickets</div>
            <div style={{ textAlign: 'right', color: '#166534' }}>Solved</div>
            <div style={{ textAlign: 'center', color: '#166534' }}>Tickets</div>
            <div style={{ textAlign: 'right', color: '#92400e' }}>Pending</div>
            <div style={{ textAlign: 'center', color: '#92400e' }}>Tickets</div>
          </div>
          {mismatchSummary.map(m => (
            <div key={m.provider} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 1fr 80px 1fr 80px 1fr 80px', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{m.provider}</div>
              <div style={{ textAlign: 'right', fontWeight: 800, color: '#991b1b', fontSize: 14 }}>{formatMoney(m.collectionMismatch)}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>{m.collectionTickets}</span>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 800, color: '#991b1b', fontSize: 14 }}>{m.feeDiscrepancy > 0 ? formatMoney(m.feeDiscrepancy) : '—'}</div>
              <div style={{ textAlign: 'center' }}>
                {m.feeTickets > 0 ? (
                  <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>{m.feeTickets}</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                )}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 800, color: '#166534', fontSize: 14 }}>{m.solvedAmount > 0 ? formatMoney(m.solvedAmount) : '—'}</div>
              <div style={{ textAlign: 'center' }}>
                {m.solvedTickets > 0 ? (
                  <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534' }}>{m.solvedTickets}</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                )}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 800, color: '#92400e', fontSize: 14 }}>{m.pendingAmount > 0 ? formatMoney(m.pendingAmount) : '—'}</div>
              <div style={{ textAlign: 'center' }}>
                {m.pendingTickets > 0 ? (
                  <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>{m.pendingTickets}</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                )}
              </div>
            </div>
          ))}
          {/* TOTAL ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 1fr 80px 1fr 80px 1fr 80px', padding: '14px 20px', background: '#f8fafc', fontWeight: 800, fontSize: 14, gap: 8, borderTop: '2px solid #e2e8f0' }}>
            <div style={{ color: '#0f172a' }}>Total</div>
            <div style={{ textAlign: 'right', color: '#991b1b' }}>{formatMoney(totalCollectionMismatch)}</div>
            <div style={{ textAlign: 'center', color: '#991b1b' }}>{mismatchSummary.reduce((s, m) => s + m.collectionTickets, 0)}</div>
            <div style={{ textAlign: 'right', color: '#991b1b' }}>{formatMoney(totalFeeDiscrepancy)}</div>
            <div style={{ textAlign: 'center', color: '#991b1b' }}>{mismatchSummary.reduce((s, m) => s + m.feeTickets, 0)}</div>
            <div style={{ textAlign: 'right', color: '#166534' }}>{formatMoney(totalSolved)}</div>
            <div style={{ textAlign: 'center', color: '#166534' }}>{totalSolvedTickets}</div>
            <div style={{ textAlign: 'right', color: '#92400e' }}>{formatMoney(totalPending)}</div>
            <div style={{ textAlign: 'center', color: '#92400e' }}>{totalPendingTickets}</div>
          </div>
        </div>
      </div>

      {/* CASH FLOW CHART */}
      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 32 }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700 }}>Cash Flow (Last 7 Days)</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, paddingBottom: 30 }}>
          {cashFlow.map((day, i) => {
            const maxVal = Math.max(...cashFlow.map(d => Math.max(d.inflow, d.outflow)));
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 160 }}>
                  <div style={{ width: 16, height: `${(day.inflow / maxVal) * 140}px`, background: '#166534', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                  <div style={{ width: 16, height: `${(Math.abs(day.outflow) / maxVal) * 140}px`, background: '#991b1b', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                </div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{day.date}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#166534' }} />Inflow</span>
          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#991b1b' }} />Outflow</span>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>Recent Transactions</h2>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 100px', padding: '12px 16px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
            <div>Concept</div>
            <div style={{ textAlign: 'right' }}>Amount</div>
            <div style={{ textAlign: 'right' }}>Date</div>
            <div style={{ textAlign: 'center' }}>Type</div>
            <div style={{ textAlign: 'center' }}>Status</div>
          </div>
          {recentTransactions.map(tx => (
            <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 100px', padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.concept}</div>
              <div style={{ textAlign: 'right', fontWeight: 700, color: tx.amount >= 0 ? '#166534' : '#991b1b' }}>
                {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: '#64748b' }}>{tx.date}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: tx.type === 'inflow' ? '#dcfce7' : '#fee2e2', color: tx.type === 'inflow' ? '#166534' : '#991b1b' }}>
                  {tx.type === 'inflow' ? 'In' : 'Out'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: tx.status === 'matched' ? '#dcfce7' : '#fef3c7', color: tx.status === 'matched' ? '#166534' : '#92400e' }}>
                  {tx.status === 'matched' ? '✅ Matched' : '⚠️ Unmatched'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}