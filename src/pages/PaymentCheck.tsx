import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

interface Transaction {
  id: number;
  concept: string;
  amount: number;
  date: string;
  type: 'bank' | 'provider';
  matched: boolean;
  match_status?: string;
  match_evidence?: string | null;
  provider_name?: string;
  source?: string;
  bank_name?: string;
}

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';

function apiDetail(data: any, fallback: string) {
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ');
  }
  return fallback;
}

export default function PaymentCheck() {
  const [activeTab, setActiveTab] = useState<'unmatched' | 'matched' | 'all'>('unmatched');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const [obCount, setObCount] = useState(0);
  const [summaryCounts, setSummaryCounts] = useState({ bank: 0, pendingBank: 0, pendingProvider: 0 });
  const [error, setError] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const tenantId = tenant.id;
      if (!tenantId) {
        setError('No hay tenant activo. Inicia sesión de nuevo.');
        setTransactions([]);
        return;
      }
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      // Fast path: dashboard + capped unreconciled list (limit=50) — never the full 3k+ dump
      const [dashRes, listRes] = await Promise.all([
        fetch(`${API}/api/v1/bank-statements/dashboard?tenant_id=${tenantId}`, { headers }),
        fetch(
          `${API}/api/v1/bank-statements/?tenant_id=${tenantId}&limit=50&matched=0`,
          { headers },
        ),
      ]);

      if (!dashRes.ok && !listRes.ok) {
        const data = await dashRes.json().catch(() => ({}));
        throw new Error(apiDetail(data, `Error cargando movimientos (${dashRes.status})`));
      }

      const dashData = dashRes.ok ? await dashRes.json() : {};
      const listData = listRes.ok ? await listRes.json() : { transactions: [] };
      const s = dashData.summary || {};

      const unmatchedBank: Transaction[] = (listData.transactions?.length
        ? listData.transactions
        : dashData.discrepancies?.unmatched_bank || []
      ).map((t: any) => ({
        id: t.id,
        concept: t.concept || '—',
        amount: t.amount || 0,
        date: t.date || t.transaction_date || '',
        type: 'bank' as const,
        matched: false,
        match_status: t.match_status || 'pending',
        match_evidence: t.match_evidence,
        source: t.source || (t.filename === 'open_banking' ? 'open_banking' : 'bank'),
        bank_name: t.bank_name,
      }));
      const matchedBank: Transaction[] = (dashData.discrepancies?.matched_bank || []).map((t: any) => ({
        id: t.id,
        concept: t.concept || '—',
        amount: t.amount || 0,
        date: t.date || '',
        type: 'bank' as const,
        matched: true,
        match_status: t.match_status || 'confirmed',
        match_evidence: t.match_evidence,
        source: t.source || 'bank',
        bank_name: t.bank_name,
      }));
      const unmatchedProv: Transaction[] = (dashData.discrepancies?.unmatched_provider || []).map((t: any) => ({
        id: t.id,
        concept: t.concept || '—',
        amount: t.amount || 0,
        date: t.date || '',
        type: 'provider' as const,
        matched: false,
        match_status: 'pending',
        source: 'provider',
        provider_name: t.provider_name,
      }));
      const recent: Transaction[] = (dashData.recent_activity || []).map((t: any) => ({
        id: t.id,
        concept: t.concept || '—',
        amount: t.amount || 0,
        date: t.date || '',
        type: (t.type === 'provider' ? 'provider' : 'bank') as 'bank' | 'provider',
        matched: !!t.matched || t.match_status === 'confirmed',
        match_status: t.match_status || (t.matched ? 'confirmed' : 'pending'),
        match_evidence: t.match_evidence,
        source: t.source,
        bank_name: t.bank_name,
        provider_name: t.provider_name,
      }));

      const byKey = new Map<string, Transaction>();
      [...unmatchedBank, ...matchedBank, ...unmatchedProv, ...recent].forEach((t) => {
        byKey.set(`${t.type}-${t.id}`, t);
      });
      const all = Array.from(byKey.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      setTransactions(all);
      setObCount(
        listData.open_banking_count
        ?? s.open_banking_transactions
        ?? all.filter((t) => t.source === 'open_banking').length,
      );
      setSummaryCounts({
        bank: s.bank_transactions || listData.total_count || 0,
        pendingBank: s.matched_count != null
          ? Math.max(0, (s.bank_transactions || 0) - (s.matched_count || 0))
          : (listData.total_count || unmatchedBank.length),
        pendingProvider: unmatchedProv.length,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error cargando transacciones');
    } finally {
      setLoading(false);
    }
  };

  const runPaymentCheck = async () => {
    setRunningCheck(true);
    setRunMessage(null);
    setError(null);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) {
        setError('No hay tenant activo. Inicia sesión de nuevo.');
        return;
      }
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/v1/reconciliation/run?tenant_id=${tenant.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiDetail(data, `La verificación falló (${res.status})`));
        return;
      }
      const confirmed = data.confirmed_count ?? data.matched_count ?? 0;
      setRunMessage(
        `Auto-confirmados: ${confirmed} (ref+importe exactos). Pendientes banco: ${data.pending_bank_count ?? data.unmatched_bank_count ?? '—'} · Pendientes proveedor: ${data.pending_provider_count ?? data.unmatched_provider_count ?? '—'}`,
      );
      await fetchTransactions();
    } catch (err: any) {
      setError(err?.message || 'Error de red al ejecutar la verificación');
    } finally {
      setRunningCheck(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (activeTab === 'unmatched') return !t.matched;
    if (activeTab === 'matched') return t.matched;
    return true;
  });

  const formatMonto = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const formatFecha = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const originLabel = (tx: Transaction) => {
    if (tx.source === 'open_banking') return 'Open Banking';
    if (tx.type === 'provider') return tx.provider_name || 'Proveedor';
    if (tx.source === 'csv') return 'CSV';
    return 'Banco';
  };

  const pendingBankUi = transactions.filter((t) => t.type === 'bank' && !t.matched).length;
  const pendingProvUi = transactions.filter((t) => t.type === 'provider' && !t.matched).length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          Operaciones
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Verificación de Pagos</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Compará movimientos bancarios (Open Banking / CSV) contra informes de proveedores.
        </p>
      </div>

      <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: 13, lineHeight: 1.45 }}>
        <strong>Conciliación automática (sin confirmación tuya).</strong> ClearFlow solo marca
        <em> Conciliado automáticamente</em> cuando hay referencia e importe exactos. El resto queda
        <em> Pendiente de evidencia</em> — no hace falta que revises ítem por ítem.
      </div>

      {obCount > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, color: '#065f46', fontSize: 13, fontWeight: 600 }}>
          {obCount} movimientos de Open Banking · {summaryCounts.bank} movimientos banco en total (vista limitada a recientes / pendientes)
        </div>
      )}

      {runMessage && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, color: '#3730a3', fontSize: 13, fontWeight: 600 }}>
          {runMessage}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 13 }}>
          {error}{' '}
          <Link to="/setup" style={{ color: '#635bff', fontWeight: 600 }}>Ir a Setup</Link>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['unmatched', 'matched', 'all'] as const).map((tab) => (
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
              {tab === 'unmatched' ? 'Pendiente evidencia' : tab === 'matched' ? 'Auto-confirmado' : 'Muestra'}
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
          {runningCheck ? 'Ejecutando…' : 'Run Verificación de Pagos'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Banco sin conciliar (vista)</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{pendingBankUi}</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Proveedor sin conciliar (vista)</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{pendingProvUi}</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total faltante (vista)</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#f59e0b' }}>
            {formatMonto(transactions.filter((t) => !t.matched).reduce((sum, t) => sum + Math.abs(t.amount), 0))}
          </div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Open Banking</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#065f46' }}>{obCount}</div>
        </div>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 2fr 1fr 1fr 140px 100px',
          padding: '14px 20px',
          background: '#f8fafc',
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          borderBottom: '1px solid #e2e8f0',
        }}>
          <div></div>
          <div>Concepto</div>
          <div style={{ textAlign: 'right' }}>Monto</div>
          <div style={{ textAlign: 'right' }}>Fecha</div>
          <div style={{ textAlign: 'center' }}>Origen</div>
          <div style={{ textAlign: 'center' }}>Estado</div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando transacciones…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>
              {transactions.length === 0
                ? 'Sin movimientos cargados'
                : activeTab === 'unmatched'
                  ? 'No hay pendientes en esta muestra'
                  : 'Sin resultados en esta pestaña'}
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {transactions.length === 0
                ? 'Sincronizá Open Banking en Setup o subí un CSV. Esto no significa que esté todo conciliado.'
                : activeTab === 'unmatched'
                  ? 'Puede haber más pendientes fuera de la muestra (limit 50). Revisá totales arriba.'
                  : `No hay movimientos ${activeTab === 'matched' ? 'conciliados en la muestra' : 'en esta vista'}.`}
            </div>
            {transactions.length === 0 && (
              <Link to="/setup" style={{ display: 'inline-block', marginTop: 16, color: '#635bff', fontWeight: 600, fontSize: 13 }}>
                Ir a Setup → Banco
              </Link>
            )}
          </div>
        ) : (
          filtered.map((tx) => (
            <div key={`${tx.type}-${tx.id}`} style={{
              display: 'grid',
              gridTemplateColumns: '40px 2fr 1fr 1fr 140px 100px',
              padding: '14px 20px',
              alignItems: 'center',
              borderBottom: '1px solid #f1f5f9',
              background: !tx.matched ? '#fef2f2' : 'white',
            }}>
              <div style={{ fontSize: 18 }}>{tx.type === 'bank' ? '🏦' : '💳'}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.concept || '—'}</div>
                {(tx.provider_name || tx.bank_name) && (
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{tx.provider_name || tx.bank_name}</div>
                )}
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
                  background: tx.source === 'open_banking' ? '#d1fae5' : tx.type === 'bank' ? '#dbeafe' : '#f3e8ff',
                  color: tx.source === 'open_banking' ? '#065f46' : tx.type === 'bank' ? '#1e40af' : '#7c3aed',
                }}>
                  {originLabel(tx)}
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
                  {tx.matched || tx.match_status === 'confirmed' ? 'Auto-confirmado' : 'Pendiente evidencia'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
