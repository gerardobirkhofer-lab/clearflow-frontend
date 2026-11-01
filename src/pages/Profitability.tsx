import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });
const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

interface CostItem {
  id: number;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
}

/**
 * Cost notepad + live fee totals from provider rows when available.
 * No fake "Demo Restaurant" revenue.
 */
export default function Profitability() {
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [feeTotal, setFeeTotal] = useState(0);
  const [provCount, setProvCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('cf_local_costs');
    if (raw) {
      try {
        setCosts(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
    void loadFees();
  }, []);

  useEffect(() => {
    localStorage.setItem('cf_local_costs', JSON.stringify(costs));
  }, [costs]);

  const loadFees = async () => {
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) return;
      const res = await fetch(`${API}/api/v1/providers/?tenant_id=${tenant.id}`, { headers: getAuth() });
      if (!res.ok) return;
      const data = await res.json();
      const txs = data.transactions || [];
      setProvCount(txs.length);
      const fees = txs.reduce((s: number, t: any) => s + (Number(t.fee_amount) || 0), 0);
      setFeeTotal(fees);
    } catch (e: any) {
      setError(e?.message || null);
    }
  };

  const monthlyCostTotal = costs.reduce((sum, c) => {
    if (c.frequency === 'daily') return sum + c.amount * 30;
    if (c.frequency === 'weekly') return sum + c.amount * 4.33;
    return sum + c.amount;
  }, 0);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>Costes (piloto)</h1>
      <p style={{ color: '#64748b' }}>
        Bloc de costes locales + fees leídos de transacciones proveedor si existen.
        No inventamos ingresos de un “Demo Restaurant”.
      </p>

      <div style={{ marginBottom: 16, padding: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: 13 }}>
        Esto <strong>no</strong> es un P&amp;L firmado. Para caja usá Verificación de pagos + Informe de ensayo.
      </div>

      {error && <div style={{ color: '#991b1b', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>FEES EN MUESTRA PROVEEDOR</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{formatMoney(feeTotal)}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{provCount} filas cargadas (límite API)</div>
        </div>
        <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>COSTES MENSUALES (LOCAL)</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{formatMoney(monthlyCostTotal)}</div>
        </div>
      </div>

      <div style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Tus costes</h2>
          <button type="button" onClick={() => setShowAdd(true)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#0f172a', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
            + Añadir
          </button>
        </div>
        {costs.length === 0 ? (
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Sin costes locales todavía.</div>
        ) : (
          costs.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
              <span>{c.name} · {c.frequency}</span>
              <span>
                {formatMoney(c.amount)}{' '}
                <button type="button" onClick={() => setCosts(costs.filter((x) => x.id !== c.id))} style={{ border: 'none', background: 'none', color: '#991b1b', cursor: 'pointer' }}>
                  quitar
                </button>
              </span>
            </div>
          ))
        )}
        {showAdd && (
          <AddCost
            onCancel={() => setShowAdd(false)}
            onAdd={(name, amount, frequency) => {
              setCosts([...costs, { id: Date.now(), name, amount, frequency }]);
              setShowAdd(false);
            }}
          />
        )}
      </div>

      <Link to="/trial-report" style={{ color: '#635bff', fontWeight: 700 }}>Ir al informe de ensayo →</Link>
    </div>
  );
}

function AddCost({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, amount: number, frequency: 'daily' | 'weekly' | 'monthly') => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('0');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  return (
    <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
      <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }}>
        <option value="monthly">Mensual</option>
        <option value="weekly">Semanal</option>
        <option value="daily">Diario</option>
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => onAdd(name || 'Coste', Number(amount) || 0, frequency)} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#635bff', color: 'white', fontWeight: 600 }}>
          Guardar
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
