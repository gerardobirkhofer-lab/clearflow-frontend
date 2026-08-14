import { useState } from 'react';

interface CostItem {
  id: number;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export default function Profitability() {
  const [selectedStore, setSelectedStore] = useState<number>(1);
  const [costs, setCosts] = useState<CostItem[]>([
    { id: 1, name: 'Rent', amount: 1500, frequency: 'monthly' },
    { id: 2, name: 'Salaries', amount: 4200, frequency: 'monthly' },
    { id: 3, name: 'Electricity', amount: 300, frequency: 'monthly' },
    { id: 4, name: 'Water', amount: 80, frequency: 'monthly' },
    { id: 5, name: 'Cleaning', amount: 200, frequency: 'monthly' },
  ]);
  const [showAddCost, setShowAddCost] = useState(false);

  const stores = [
    { id: 1, name: 'Pura Zona Norte', revenue: 15420, providerFees: 462 },
    { id: 2, name: 'Pura Online Shop', revenue: 8930, providerFees: 268 },
  ];

  const currentStore = stores.find(s => s.id === selectedStore) || stores[0];

  const monthlyCostTotal = costs.reduce((sum, c) => {
    if (c.frequency === 'daily') return sum + c.amount * 30;
    if (c.frequency === 'weekly') return sum + c.amount * 4.33;
    return sum + c.amount;
  }, 0);

  const netProfit = currentStore.revenue - currentStore.providerFees - monthlyCostTotal;
  const margin = currentStore.revenue > 0 ? (netProfit / currentStore.revenue) * 100 : 0;

  const addCost = (name: string, amount: number, frequency: 'daily' | 'weekly' | 'monthly') => {
    setCosts([...costs, { id: Date.now(), name, amount, frequency }]);
    setShowAddCost(false);
  };

  const removeCost = (id: number) => setCosts(costs.filter(c => c.id !== id));

  const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>📊 Business Intelligence</div>
          <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e', textTransform: 'uppercase' }}>Beta</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Profitability</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15, maxWidth: 700 }}>
          See if your store is actually making money. Revenue minus provider fees minus costs equals true profit.
          <span style={{ color: '#94a3b8' }}> This is an optional beta feature — no tax calculations included.</span>
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 12 }}>Analyzing:</label>
        <select value={selectedStore} onChange={(e) => setSelectedStore(Number(e.target.value))} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white', minWidth: 220 }}>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Monthly Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#166534' }}>{formatMoney(currentStore.revenue)}</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Provider Fees</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>-{formatMoney(currentStore.providerFees)}</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Costs</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>-{formatMoney(monthlyCostTotal)}</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Profit</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: netProfit >= 0 ? '#166534' : '#991b1b' }}>{netProfit >= 0 ? '' : '-'}{formatMoney(Math.abs(netProfit))}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{margin.toFixed(1)}% margin</div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', borderRadius: 12, marginBottom: 32, background: margin >= 20 ? '#f0fdf4' : margin >= 5 ? '#fffbeb' : '#fef2f2', border: `1px solid ${margin >= 20 ? '#bbf7d0' : margin >= 5 ? '#fde68a' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 24 }}>{margin >= 20 ? '✅' : margin >= 5 ? '⚠️' : '🔴'}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{margin >= 20 ? 'Healthy margin — keep it up!' : margin >= 5 ? 'Tight margin — watch your costs.' : 'Losing money — review costs immediately.'}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{margin >= 20 ? 'Your store is profitable and sustainable.' : margin >= 5 ? 'You are profitable but one bad month could hurt.' : 'Revenue does not cover costs. Consider renegotiating rent or cutting expenses.'}</div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Monthly Costs</h2>
          <button onClick={() => setShowAddCost(true)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#635bff', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Cost</button>
        </div>

        {showAddCost && (
          <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: 16 }}>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); addCost(fd.get('name') as string, Number(fd.get('amount')), fd.get('frequency') as 'daily'|'weekly'|'monthly'); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Cost Name</label><input name="name" required placeholder="Rent, Salaries, etc." style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Amount (€)</label><input name="amount" type="number" required placeholder="1500" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Frequency</label><select name="frequency" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="daily">Daily</option></select></div>
                <div style={{ display: 'flex', gap: 8 }}><button type="submit" style={{ padding: '10px 16px', borderRadius: 6, border: 'none', background: '#635bff', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Add</button><button type="button" onClick={() => setShowAddCost(false)} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Cancel</button></div>
              </div>
            </form>
          </div>
        )}

        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 60px', padding: '14px 20px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
            <div>Cost</div><div style={{ textAlign: 'right' }}>Amount</div><div style={{ textAlign: 'center' }}>Frequency</div><div style={{ textAlign: 'right' }}>Monthly Equiv.</div><div></div>
          </div>
          {costs.map(cost => {
            const monthly = cost.frequency === 'daily' ? cost.amount * 30 : cost.frequency === 'weekly' ? cost.amount * 4.33 : cost.amount;
            return (
              <div key={cost.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 60px', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 600 }}>{cost.name}</div>
                <div style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(cost.amount)}</div>
                <div style={{ textAlign: 'center' }}><span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#64748b', textTransform: 'capitalize' }}>{cost.frequency}</span></div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>{formatMoney(monthly)}</div>
                <div style={{ textAlign: 'right' }}><button onClick={() => removeCost(cost.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>🗑</button></div>
              </div>
            );
          })}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 60px', padding: '14px 20px', background: '#f8fafc', fontWeight: 700, fontSize: 14 }}>
            <div style={{ color: '#64748b' }}>Total Monthly Costs</div><div></div><div></div><div style={{ textAlign: 'right', color: '#991b1b' }}>{formatMoney(monthlyCostTotal)}</div><div></div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          <strong>Legal Notice:</strong> ClearFlow S.L. acts solely as a data processor under GDPR Article 28. You (the data controller) retain full ownership of your business data. We process your data only to provide the reconciliation service you requested. We do not perform tax analysis, financial auditing, or regulatory reporting on your behalf. If you require a Data Processing Agreement (DPA), contact us at dpa@clearflow.app.
        </div>
      </div>
    </div>
  );
}
