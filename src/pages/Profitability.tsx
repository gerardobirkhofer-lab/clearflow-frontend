import { useState } from 'react';
import BackButton from '../components/BackButton';

interface CostItem {
  id: number;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export default function Profitability() {
  const [selectedStore, setSelectedStore] = useState<number>(1);
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [showAddCost, setShowAddCost] = useState(false);

  const stores: any[] = [];
  const currentStore = stores.find(s => s.id === selectedStore);

  const monthlyCostTotal = costs.reduce((sum, c) => {
    if (c.frequency === 'daily') return sum + c.amount * 30;
    if (c.frequency === 'weekly') return sum + c.amount * 4.33;
    return sum + c.amount;
  }, 0);

  const revenue = currentStore?.revenue || 0;
  const providerFees = currentStore?.providerFees || 0;
  const netProfit = revenue - providerFees - monthlyCostTotal;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const addCost = (name: string, amount: number, frequency: 'daily' | 'weekly' | 'monthly') => {
    setCosts([...costs, { id: Date.now(), name, amount, frequency }]);
    setShowAddCost(false);
  };

  const removeCost = (id: number) => setCosts(costs.filter(c => c.id !== id));

  const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>📊 Business Intelligence</div>
          <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e', textTransform: 'uppercase' }}>Beta</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Profitability</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15, maxWidth: 700 }}>
          See if your store is actually making money. Revenue minus provider fees minus costs equals true profit.
        </p>
      </div>

      {stores.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>No store data yet</div>
          <div style={{ fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
            Complete your store setup and upload transaction data to see profitability analysis.
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 12 }}>Analyzing:</label>
            <select value={selectedStore} onChange={(e) => setSelectedStore(Number(e.target.value))} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white', minWidth: 220 }}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Monthly Revenue</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#166534' }}>{formatMoney(revenue)}</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Provider Fees</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>-{formatMoney(providerFees)}</div>
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

            {costs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                No costs added yet. Click "+ Add Cost" to start tracking your expenses.
              </div>
            ) : (
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
