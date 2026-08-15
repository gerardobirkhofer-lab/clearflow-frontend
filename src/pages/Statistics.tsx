import { useState } from 'react';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

export default function Statistics() {
  const [period, setPeriod] = useState('30d');

  const providers = [
    { name: 'Stripe', revenue: 23166, transactions: 520, avgTicket: 44.55, pct: 65, payoutDays: 3, feePct: 3.0, color: '#635bff' },
    { name: 'TPV / Redsys', revenue: 3562, transactions: 198, avgTicket: 17.99, pct: 10, payoutDays: 7, feePct: 3.5, color: '#3b82f6' },
    { name: 'Mercado Pago', revenue: 7124, transactions: 198, avgTicket: 35.98, pct: 20, payoutDays: 5, feePct: 3.0, color: '#22c55e' },
    { name: 'Cash / Other', revenue: 1781, transactions: 89, avgTicket: 20.01, pct: 5, payoutDays: 0, feePct: 0.0, color: '#94a3b8' },
  ];

  const totalRevenue = providers.reduce((s, p) => s + p.revenue, 0);

  const providersWithWeighted = providers.map(p => {
    const weightedFee = (p.feePct * p.pct) / 100;
    const speedRisk = p.payoutDays * (p.pct / 100);
    const feeScore = p.feePct <= 2.5 ? 3 : p.feePct <= 3.2 ? 2 : 1;
    const speedScore = p.payoutDays <= 3 ? 3 : p.payoutDays <= 5 ? 2 : 1;
    const overallScore = Math.min(feeScore, speedScore);
    
    return {
      ...p,
      weightedFee,
      speedRisk,
      overallScore,
      health: overallScore === 3 ? 'healthy' : overallScore === 2 ? 'warning' : 'at-risk',
    };
  });

  const totalWeightedFee = providersWithWeighted.reduce((s, p) => s + p.weightedFee, 0);

  const cardTypes = [
    { name: 'Credit Card', value: 68, color: '#635bff' },
    { name: 'Debit Card', value: 25, color: '#3b82f6' },
    { name: 'Other', value: 7, color: '#94a3b8' },
  ];

  const monthly = [
    { month: 'Mar', stripe: 12, tpv: 8, mp: 6 },
    { month: 'Apr', stripe: 14, tpv: 7, mp: 5 },
    { month: 'May', stripe: 13, tpv: 9, mp: 7 },
    { month: 'Jun', stripe: 15, tpv: 8, mp: 6 },
    { month: 'Jul', stripe: 15.4, tpv: 8.9, mp: 7.1 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <BackButton />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
            📊 Intelligence
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Statistics</h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
            Understand where your money comes from and how fast it arrives.
          </p>
        </div>

        {/* PERIOD FILTER */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {['7d','30d','90d','YTD'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: period === p ? '#0f172a' : 'white',
              color: period === p ? 'white' : '#64748b',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{p === 'YTD' ? 'Year to Date' : `Last ${p}`}</button>
          ))}
        </div>

        {/* PROVIDER HEALTH SCORECARD */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Provider Health Scorecard</h2>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 100px', padding: '14px 20px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
              <div>Provider</div>
              <div style={{ textAlign: 'right' }}>Volume %</div>
              <div style={{ textAlign: 'right' }}>Fee %</div>
              <div style={{ textAlign: 'right' }}>Weighted Cost</div>
              <div style={{ textAlign: 'right' }}>Payout</div>
              <div style={{ textAlign: 'right' }}>Speed Risk</div>
              <div style={{ textAlign: 'center' }}>Health</div>
            </div>
            {providersWithWeighted.map(p => (
              <div key={p.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 100px', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>{p.pct}%</div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{p.feePct}%</div>
                <div style={{ textAlign: 'right', fontWeight: 700, color: p.weightedFee > 1.5 ? '#991b1b' : p.weightedFee > 0.5 ? '#92400e' : '#166534' }}>
                  {p.weightedFee.toFixed(2)}%
                </div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{p.payoutDays}d</div>
                <div style={{ textAlign: 'right', fontWeight: 600, color: p.speedRisk > 0.5 ? '#991b1b' : p.speedRisk > 0.2 ? '#92400e' : '#166534' }}>
                  {p.speedRisk.toFixed(2)}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                    background: p.health === 'healthy' ? '#dcfce7' : p.health === 'warning' ? '#fef3c7' : '#fee2e2',
                    color: p.health === 'healthy' ? '#166534' : p.health === 'warning' ? '#92400e' : '#991b1b',
                    textTransform: 'uppercase',
                  }}>
                    {p.health === 'healthy' ? '🟢 Healthy' : p.health === 'warning' ? '🟡 Watch' : '🔴 At Risk'}
                  </span>
                </div>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 100px', padding: '14px 20px', background: '#f8fafc', fontWeight: 700, fontSize: 14 }}>
              <div style={{ color: '#64748b' }}>Total Weighted Cost</div>
              <div></div><div></div>
              <div style={{ textAlign: 'right', color: '#0f172a' }}>{totalWeightedFee.toFixed(2)}%</div>
              <div></div><div></div><div></div>
            </div>
          </div>

          {/* INSIGHT CARD */}
          <div style={{ padding: 20, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ fontSize: 24 }}>💡</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Negotiation Insight</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                Stripe represents <strong>65%</strong> of your volume with a weighted cost of <strong>1.95%</strong>. 
                A 0.2% fee reduction would save you approximately <strong>{formatMoney(totalRevenue * 0.002)}</strong> per period. 
                TPV/Redsys is slow (7 days) but only 10% of volume — focus your negotiation energy on Stripe first.
              </div>
            </div>
          </div>
        </div>

        {/* TOP STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Revenue</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{formatMoney(totalRevenue)}</div>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Transactions</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>1,005</div>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg Ticket</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{formatMoney(34.54)}</div>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg Collection</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>3.8 days</div>
          </div>
        </div>

        {/* REVENUE BY PROVIDER TABLE */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Revenue by Provider</h2>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px', padding: '14px 20px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
              <div>Provider</div>
              <div style={{ textAlign: 'right' }}>Revenue</div>
              <div style={{ textAlign: 'right' }}>Txns</div>
              <div style={{ textAlign: 'right' }}>Avg Ticket</div>
              <div style={{ textAlign: 'right' }}>Share</div>
              <div style={{ textAlign: 'center' }}>Payout</div>
            </div>
            {providers.map(p => (
              <div key={p.name} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>{formatMoney(p.revenue)}</div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{p.transactions}</div>
                <div style={{ textAlign: 'right', color: '#64748b' }}>{formatMoney(p.avgTicket)}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${p.pct}%`, height: '100%', background: p.color }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.pct}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: p.payoutDays <= 3 ? '#dcfce7' : p.payoutDays <= 5 ? '#fef3c7' : '#fee2e2', color: p.payoutDays <= 3 ? '#166534' : p.payoutDays <= 5 ? '#92400e' : '#991b1b' }}>
                    {p.payoutDays}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHARTS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* CARD TYPE BREAKDOWN */}
          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Card Type Breakdown</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: `conic-gradient(${cardTypes.map((c,i) => `${c.color} ${i===0?0:cardTypes.slice(0,i).reduce((s,x)=>s+x.value,0)}% ${cardTypes.slice(0,i+1).reduce((s,x)=>s+x.value,0)}%`).join(', ')})` }} />
              <div>
                {cardTypes.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MONTHLY TREND */}
          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Monthly Trend (€k)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
              {monthly.map(m => {
                const total = m.stripe + m.tpv + m.mp;
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ width: '100%', height: (m.stripe/total)*100, background: '#635bff', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                      <div style={{ width: '100%', height: (m.tpv/total)*100, background: '#3b82f6', minHeight: 4 }} />
                      <div style={{ width: '100%', height: (m.mp/total)*100, background: '#22c55e', borderRadius: '0 0 4px 4px', minHeight: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{m.month}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
              <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#635bff' }} />Stripe</span>
              <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6' }} />TPV</span>
              <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e' }} />MP</span>
            </div>
          </div>
        </div>

        {/* BOTTOM INSIGHT */}
        <div style={{ padding: 20, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ fontSize: 20 }}>💡</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Insight</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Stripe represents 65% of revenue with 3-day payouts — healthy cash flow. TPV is 10% but takes 7 days — consider negotiating faster settlement or pushing more customers to online payment.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
