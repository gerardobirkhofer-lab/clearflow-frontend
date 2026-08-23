import { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';

interface Transaction {
  id: number;
  concept: string;
  amount: number;
  date: string;
  type: 'bank' | 'provider';
  matched: boolean;
  provider_name?: string;
}

export default function PaymentCheck() {
  const [activeTab, setActiveTab] = useState<'unmatched' | 'matched' | 'all'>('unmatched');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-statements/dashboard?tenant_id=${tenant.id || 1}`, {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      const data = await res.json();
      const bank = (data.discrepancies?.unmatched_bank || []).map((t: any) => ({ ...t, type: 'bank' as const }));
      const prov = (data.discrepancies?.unmatched_provider || []).map((t: any) => ({ ...t, type: 'provider' as const }));
      setTransactions([...bank, ...prov]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runPaymentCheck = async () => {
    setRunningCheck(true);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reconciliation/run?tenant_id=${tenant.id || 1}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      await fetchTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setRunningCheck(false);
    }
  };

  const filtered = transactions.filter(t => {
    if (activeTab === 'unmatched') return !t.matched;
    if (activeTab === 'matched') return t.matched;
    return true;
  });

  const formatMonto = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const formatFecha = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Fecha(dateStr).toLocaleFechaString('es-ES');
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          ⚡ Operaciones
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Verificación de Pagos</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Compará transacciones bancarias contra informes de proveedores. Corregí discrepancias.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['unmatched', 'matched', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: activeTab === tab ? '#0f172a' : 'white',
                color: activeTab === tab ? 'white' : '#64748b',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'unmatched' ? '⚠️ Sin conciliar' : tab === 'matched' ? '✅ Conciliado' : '📋 Todas'}
            </button>
          ))}
        </div>

        <button
          onClick={runPaymentCheck}
          disabled={runningCheck}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: '#635bff',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: runningCheck ? 'not-allowed' : 'pointer',
            opacity: runningCheck ? 0.7 : 1,
          }}
        >
          {runningCheck ? '⏳ Ejecutando...' : '⚡ Run Verificación de Pagos'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Banco sin conciliar</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>
            {transactions.filter(t => t.type === 'bank' && !t.matched).length}
          </div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Proveedor sin conciliar</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>
            {transactions.filter(t => t.type === 'provider' && !t.matched).length}
          </div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total faltante</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#f59e0b' }}>
            {formatMonto(transactions.filter(t => !t.matched).reduce((sum, t) => sum + Math.abs(t.amount), 0))}
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 2fr 1fr 1fr 120px 100px',
          padding: '14px 20px',
          background: '#f8fafc',
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div></div>
          <div>Concepto</div>
          <div style={{ textAlign: 'right' }}>Monto</div>
          <div style={{ textAlign: 'right' }}>Fecha</div>
          <div style={{ textAlign: 'center' }}>Origen</div>
          <div style={{ textAlign: 'center' }}>Estado</div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando transacciones...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>¡Todo limpio!</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>No {activeTab} transactions found.</div>
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={`${tx.type}-${tx.id}`} style={{
              display: 'grid',
              gridTemplateColumns: '40px 2fr 1fr 1fr 120px 100px',
              padding: '14px 20px',
              alignItems: 'center',
              borderBottom: '1px solid #f1f5f9',
              background: !tx.matched ? '#fef2f2' : 'white'
            }}>
              <div style={{ fontSize: 18 }}>{tx.type === 'bank' ? '🏦' : '💳'}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.concept || '—'}</div>
                {tx.provider_name && <div style={{ fontSize: 11, color: '#94a3b8' }}>{tx.provider_name}</div>}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: tx.amount >= 0 ? '#166534' : '#991b1b' }}>
                {tx.amount >= 0 ? '+' : ''}{formatMonto(tx.amount)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: '#64748b' }}>{formatFecha(tx.date)}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  background: tx.type === 'bank' ? '#dbeafe' : '#f3e8ff',
                  color: tx.type === 'bank' ? '#1e40af' : '#7c3aed',
                }}>
                  {tx.type === 'bank' ? 'Bank' : 'Provider'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  background: tx.matched ? '#dcfce7' : '#fee2e2',
                  color: tx.matched ? '#166534' : '#991b1b',
                }}>
                  {tx.matched ? 'Matched' : 'Unmatched'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
