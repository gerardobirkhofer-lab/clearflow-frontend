import { useState } from 'react';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

interface FlowStep {
  id: string;
  title: string;
  amount: number;
  status: 'ok' | 'warning' | 'error';
  icon: string;
  detail: string;
  fees?: { expected: number; actual: number };
}

export default function RevenueControl() {
  const [selectedDay, setSelectedDay] = useState('07/08/2026');

  const dailyFlows: Record<string, FlowStep[]> = {
    '07/08/2026': [
      { id: 'invoice', title: 'Facturado', amount: 18200.75, status: 'ok', icon: '📄', detail: '42 tickets · Ticket promedio €43.35' },
      { id: 'tpv', title: 'Cobrado TPV', amount: 18200.75, status: 'ok', icon: '💳', detail: 'Stripe + TPV Redsys · 38 transacciones' },
      { id: 'liquidation', title: 'Liquidado', amount: 17754.73, status: 'warning', icon: '🏦', detail: 'Stripe: T+2 · Redsys: T+1', fees: { expected: 1.5, actual: 2.45 } },
      { id: 'bank', title: 'En Banco', amount: 17754.73, status: 'ok', icon: '🏛️', detail: 'Cuenta Santander Business · Llegó el 07/08' },
    ],
    '06/08/2026': [
      { id: 'invoice', title: 'Facturado', amount: 12500.00, status: 'ok', icon: '📄', detail: '31 tickets · Ticket promedio €40.32' },
      { id: 'tpv', title: 'Cobrado TPV', amount: 12500.00, status: 'ok', icon: '💳', detail: 'Solo TPV Redsys · 28 transacciones' },
      { id: 'liquidation', title: 'Liquidado', amount: 12212.50, status: 'ok', icon: '🏦', detail: 'Redsys: T+1', fees: { expected: 2.3, actual: 2.3 } },
      { id: 'bank', title: 'En Banco', amount: 12212.50, status: 'ok', icon: '🏛️', detail: 'Cuenta Santander Business · Llegó el 06/08' },
    ],
    '01/08/2026': [
      { id: 'invoice', title: 'Facturado', amount: 15420.50, status: 'ok', icon: '📄', detail: '35 tickets · Ticket promedio €44.06' },
      { id: 'tpv', title: 'Cobrado TPV', amount: 15420.50, status: 'ok', icon: '💳', detail: 'Solo Stripe · 35 transacciones' },
      { id: 'liquidation', title: 'Liquidado', amount: 15078.03, status: 'warning', icon: '🏦', detail: 'Stripe: T+2', fees: { expected: 1.5, actual: 2.22 } },
      { id: 'bank', title: 'En Banco', amount: 15078.03, status: 'ok', icon: '🏛️', detail: 'Cuenta Santander Business · Llegó el 01/08' },
    ],
  };

  const steps = dailyFlows[selectedDay] || dailyFlows['07/08/2026'];

  const totalInvoiced = steps.find(s => s.id === 'invoice')?.amount || 0;
  const totalBanked = steps.find(s => s.id === 'bank')?.amount || 0;
  const totalGap = totalInvoiced - totalBanked;
  const feeDiscrepancy = steps.find(s => s.fees)?.fees;

  const arrowColor = (from: FlowStep, to: FlowStep) => {
    if (to.status === 'warning') return '#f59e0b';
    if (to.status === 'error') return '#ef4444';
    return '#22c55e';
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />

      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          🔁 Closing the Loop
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Revenue Control</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          From invoice to bank. Every euro tracked.
        </p>
      </div>

      {/* DAY SELECTOR */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {Object.keys(dailyFlows).map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: selectedDay === day ? '#0f172a' : 'white',
              color: selectedDay === day ? 'white' : '#64748b',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {day}
          </button>
        ))}
      </div>

      {/* FLOW VISUALIZATION */}
      <div style={{ padding: 32, borderRadius: 16, border: '1px solid #e2e8f0', background: 'white', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          {steps.map((step, index) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
              {/* Step Card */}
              <div style={{
                flex: 1,
                padding: 20,
                borderRadius: 12,
                border: `2px solid ${step.status === 'ok' ? '#bbf7d0' : step.status === 'warning' ? '#fde68a' : '#fecaca'}`,
                background: step.status === 'ok' ? '#f0fdf4' : step.status === 'warning' ? '#fefce8' : '#fef2f2',
                textAlign: 'center',
                minWidth: 180,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{step.icon}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: step.status === 'ok' ? '#166534' : step.status === 'warning' ? '#92400e' : '#991b1b' }}>
                  {formatMoney(step.amount)}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  {step.detail}
                </div>
                {step.fees && (
                  <div style={{
                    marginTop: 8,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: step.fees.actual > step.fees.expected ? '#fee2e2' : '#dcfce7',
                    fontSize: 11,
                    fontWeight: 600,
                    color: step.fees.actual > step.fees.expected ? '#991b1b' : '#166534',
                  }}>
                    Fee: {step.fees.actual}% (contrato: {step.fees.expected}%)
                    {step.fees.actual > step.fees.expected && ' ⚠️'}
                  </div>
                )}
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div style={{
                  fontSize: 24,
                  color: arrowColor(step, steps[index + 1]),
                  fontWeight: 700,
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary bar */}
        <div style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 10,
          background: totalGap > 0 ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${totalGap > 0 ? '#fecaca' : '#bbf7d0'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Facturado vs. En Banco</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: totalGap > 0 ? '#991b1b' : '#166534' }}>
              {formatMoney(totalInvoiced)} → {formatMoney(totalBanked)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>Diferencia</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: totalGap > 0 ? '#991b1b' : '#166534' }}>
              {totalGap > 0 ? '-' : ''}{formatMoney(Math.abs(totalGap))}
            </div>
          </div>
        </div>
      </div>

      {/* FEE ALERT */}
      {feeDiscrepancy && feeDiscrepancy.actual > feeDiscrepancy.expected && (
        <div style={{
          padding: 20,
          borderRadius: 12,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>🚨</span>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#991b1b' }}>
              Fee Discrepancy Detected
            </div>
          </div>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            The actual fee charged by the provider ({feeDiscrepancy.actual}%) is higher than the contracted fee ({feeDiscrepancy.expected}%).
            On this transaction alone, you were overcharged by <strong>{formatMoney(totalInvoiced * (feeDiscrepancy.actual - feeDiscrepancy.expected) / 100)}</strong>.
          </p>
        </div>
      )}

      {/* WHAT THIS MEANS */}
      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>What ClearFlow checks for you:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
          {[
            { icon: '✅', text: 'Every invoice matches a TPV collection' },
            { icon: '✅', text: 'Every TPV collection matches a bank deposit' },
            { icon: '⚠️', text: 'Fees match the contract (not higher)' },
            { icon: '⚠️', text: 'No duplicate settlements' },
            { icon: '🔍', text: 'Late settlements flagged automatically' },
            { icon: '📊', text: 'Daily report sent to your email' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span>{item.icon}</span>
              <span style={{ fontSize: 13, color: '#0f172a' }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: 'white', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
            💡 This is the <strong>Revenue Control</strong> module. In the full implementation, ClearFlow connects to your invoicing system and TPV to track every euro from sale to bank — automatically.
          </div>
        </div>
      </div>
    </div>
  );
}
