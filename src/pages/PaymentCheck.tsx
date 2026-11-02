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
  reference?: string;
}

function parseEvidence(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
  } catch {
    return null;
  }
}

function evidenceSummary(raw: string | null | undefined): string {
  const ev = parseEvidence(raw);
  if (!ev) return '';
  const rules = Array.isArray(ev.rules_fired) ? (ev.rules_fired as string[]).join(', ') : '';
  const amountRule = ev.amount_rule ? `importe=${ev.amount_rule}` : '';
  const parts = [rules, amountRule].filter(Boolean);
  return parts.join(' · ');
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionBusy, setActionBusy] = useState<number | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const dateQs = () => {
    const p = new URLSearchParams();
    if (dateFrom) p.set('date_from', dateFrom);
    if (dateTo) p.set('date_to', dateTo);
    const s = p.toString();
    return s ? `&${s}` : '';
  };

  const mapBank = (t: any, matchedDefault: boolean): Transaction => ({
    id: t.id,
    concept: t.concept || '—',
    amount: t.amount || 0,
    date: t.date || t.transaction_date || '',
    type: 'bank',
    matched:
      matchedDefault ||
      !!t.matched ||
      t.match_status === 'confirmed' ||
      t.match_status === 'user_confirmed',
    match_status: t.match_status || (matchedDefault || t.matched ? 'confirmed' : 'pending'),
    match_evidence: t.match_evidence,
    source: t.source || (t.filename === 'open_banking' ? 'open_banking' : 'csv'),
    bank_name: t.bank_name,
    reference: t.reference,
  });

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

      // Fast path: dashboard + capped lists — never the full 3k+ dump
      const [dashRes, pendingRes, matchedRes] = await Promise.all([
        fetch(`${API}/api/v1/bank-statements/dashboard?tenant_id=${tenantId}`, { headers }),
        fetch(
          `${API}/api/v1/bank-statements/?tenant_id=${tenantId}&limit=50&matched=0${dateQs()}`,
          { headers },
        ),
        fetch(
          `${API}/api/v1/bank-statements/?tenant_id=${tenantId}&limit=50&matched=1${dateQs()}`,
          { headers },
        ),
      ]);

      if (!dashRes.ok && !pendingRes.ok) {
        const data = await dashRes.json().catch(() => ({}));
        throw new Error(apiDetail(data, `Error cargando movimientos (${dashRes.status})`));
      }

      const dashData = dashRes.ok ? await dashRes.json() : {};
      const pendingData = pendingRes.ok ? await pendingRes.json() : { transactions: [] };
      const matchedData = matchedRes.ok ? await matchedRes.json() : { transactions: [] };
      const s = dashData.summary || {};

      const unmatchedBank: Transaction[] = (pendingData.transactions?.length
        ? pendingData.transactions
        : dashData.discrepancies?.unmatched_bank || []
      ).map((t: any) => mapBank(t, false));
      const matchedBank: Transaction[] = (matchedData.transactions?.length
        ? matchedData.transactions
        : dashData.discrepancies?.matched_bank || []
      ).map((t: any) => mapBank(t, true));
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
        match_evidence: t.match_evidence,
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
        reference: t.reference,
      }));

      const byKey = new Map<string, Transaction>();
      [...unmatchedBank, ...matchedBank, ...unmatchedProv, ...recent].forEach((t) => {
        byKey.set(`${t.type}-${t.id}`, t);
      });
      const all = Array.from(byKey.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      setTransactions(all);
      setObCount(
        pendingData.open_banking_count
        ?? s.open_banking_transactions
        ?? all.filter((t) => t.source === 'open_banking').length,
      );
      setSummaryCounts({
        bank: s.bank_transactions || pendingData.total_count || 0,
        pendingBank: s.matched_count != null
          ? Math.max(0, (s.bank_transactions || 0) - (s.matched_count || 0))
          : (pendingData.total_count || unmatchedBank.length),
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
      const headers = { Authorization: `Bearer ${token || ''}` };

      // Prefer async job (progress) — fall back to sync if endpoint missing
      let data: any = null;
      const asyncRes = await fetch(
        `${API}/api/v1/reconciliation/run-async?tenant_id=${tenant.id}${dateQs()}`,
        { method: 'POST', headers },
      );
      if (asyncRes.ok) {
        const started = await asyncRes.json();
        const jobId = started.job_id;
        setRunMessage('Motor en marcha… 0%');
        for (let i = 0; i < 90; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const jobRes = await fetch(
            `${API}/api/v1/reconciliation/jobs/${jobId}?tenant_id=${tenant.id}`,
            { headers },
          );
          const job = await jobRes.json().catch(() => ({}));
          if (!jobRes.ok) {
            setError(apiDetail(job, 'Error consultando job'));
            return;
          }
          setRunMessage(`Motor en marcha… ${job.progress ?? 0}% (${job.status})`);
          if (job.status === 'done') {
            data = job.result || {};
            break;
          }
          if (job.status === 'error') {
            setError(job.error || 'El job de conciliación falló');
            return;
          }
        }
        if (!data) {
          setError('Timeout esperando el job. Probá de nuevo o usá menos datos.');
          return;
        }
      } else {
        const res = await fetch(
          `${API}/api/v1/reconciliation/run?tenant_id=${tenant.id}${dateQs()}`,
          { method: 'POST', headers },
        );
        data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(apiDetail(data, `La verificación falló (${res.status})`));
          return;
        }
      }

      const confirmed = data.confirmed_count ?? data.matched_count ?? 0;
      const oneN = data.confirmed_1n_bank_count ?? 0;
      const suggested = data.suggested_count ?? 0;
      const rejects = data.reject_reason_counts
        ? Object.entries(data.reject_reason_counts)
            .slice(0, 3)
            .map(([k, v]) => `${k}:${v}`)
            .join(' · ')
        : '';
      setRunMessage(
        `Confirmados: ${confirmed}`
        + (oneN ? ` (de ellos 1:N: ${oneN} abonos)` : '')
        + (suggested ? ` · Sugeridos (no confirmados): ${suggested}` : '')
        + ` · Pendientes banco: ${data.pending_bank_count ?? '—'}`
        + ` · Pendientes proveedor: ${data.pending_provider_count ?? '—'}`
        + (rejects ? ` · Motivos: ${rejects}` : '')
        + ` · motor ${data.engine || ''}`.trim(),
      );
      await fetchTransactions();
    } catch (err: any) {
      setError(err?.message || 'Error de red al ejecutar la verificación');
    } finally {
      setRunningCheck(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (activeTab === 'unmatched') return !t.matched; // includes suggested + pending + rejected
    if (activeTab === 'matched') {
      return (
        !!t.matched ||
        t.match_status === 'confirmed' ||
        t.match_status === 'user_confirmed'
      );
    }
    return true;
  });

  const actOnSuggestion = async (bankId: number, action: 'confirm' | 'reject') => {
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    if (!tenant.id) return;
    setActionBusy(bankId);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(
        `${API}/api/v1/reconciliation/suggestions/${bankId}/${action}?tenant_id=${tenant.id}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(apiDetail(data, `No se pudo ${action === 'confirm' ? 'confirmar' : 'rechazar'}`));
        return;
      }
      setRunMessage(
        action === 'confirm'
          ? `Sugerencia #${bankId} validada por vos (user_confirmed).`
          : `Sugerencia #${bankId} rechazada.`,
      );
      await fetchTransactions();
    } catch (e: any) {
      setError(e?.message || 'Error de red');
    } finally {
      setActionBusy(null);
    }
  };

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
        <strong>Motor v5 · 1:1 y 1:N + score.</strong> Auto-confirma con evidencia fuerte. Casi-igual (≤€1) →
        <em> sugerido</em> — vos Confirmás o Rechazás. Ventana de fechas opcional abajo.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <label style={{ fontSize: 13, color: '#475569' }}>
          Desde{' '}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ marginLeft: 4, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
          />
        </label>
        <label style={{ fontSize: 13, color: '#475569' }}>
          Hasta{' '}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ marginLeft: 4, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
          />
        </label>
        <button
          type="button"
          onClick={() => void fetchTransactions()}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: 'white',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Aplicar filtro
        </button>
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
          gridTemplateColumns: '40px 2fr 1fr 1fr 140px 120px',
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
          filtered.map((tx) => {
            const rowKey = `${tx.type}-${tx.id}`;
            const open = expandedId === rowKey;
            const ev = parseEvidence(tx.match_evidence);
            const isSuggested = tx.match_status === 'suggested';
            const canExpand = !!tx.match_evidence;
            return (
              <div key={rowKey}>
                <div
                  onClick={() => canExpand && setExpandedId(open ? null : rowKey)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 2fr 1fr 1fr 140px 120px',
                    padding: '14px 20px',
                    alignItems: 'center',
                    borderBottom: open ? 'none' : '1px solid #f1f5f9',
                    background: isSuggested ? '#fffbeb' : !tx.matched ? '#fef2f2' : 'white',
                    cursor: canExpand ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ fontSize: 18 }}>{tx.type === 'bank' ? '🏦' : '💳'}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.concept || '—'}</div>
                    {(tx.provider_name || tx.bank_name || tx.reference) && (
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {[tx.provider_name || tx.bank_name, tx.reference ? `ref ${tx.reference}` : '']
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                    {canExpand && !open && evidenceSummary(tx.match_evidence) && (
                      <div style={{ fontSize: 11, color: '#6366f1', marginTop: 2 }}>
                        {evidenceSummary(tx.match_evidence)} · ver evidencia
                      </div>
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
                      background:
                        tx.match_status === 'user_confirmed'
                          ? '#dbeafe'
                          : tx.matched || tx.match_status === 'confirmed'
                            ? '#dcfce7'
                            : isSuggested
                              ? '#fef3c7'
                              : tx.match_status === 'rejected'
                                ? '#f1f5f9'
                                : '#fee2e2',
                      color:
                        tx.match_status === 'user_confirmed'
                          ? '#1e40af'
                          : tx.matched || tx.match_status === 'confirmed'
                            ? '#166534'
                            : isSuggested
                              ? '#92400e'
                              : tx.match_status === 'rejected'
                                ? '#64748b'
                                : '#991b1b',
                    }}>
                      {tx.match_status === 'user_confirmed'
                        ? 'Validado'
                        : tx.matched || tx.match_status === 'confirmed'
                          ? 'Auto'
                          : isSuggested
                            ? 'Sugerido'
                            : tx.match_status === 'rejected'
                              ? 'Rechazado'
                              : 'Pendiente'}
                    </span>
                  </div>
                </div>
                {open && ev && (
                  <div style={{
                    padding: '12px 20px 16px 60px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    fontSize: 12,
                    color: '#334155',
                    lineHeight: 1.5,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>Evidencia de auto-confirmación</div>
                    <div>Motor: {String(ev.engine || '—')} · modo: {String(ev.match_mode || '1:1')}</div>
                    <div>Reglas: {Array.isArray(ev.rules_fired) ? (ev.rules_fired as string[]).join(', ') : '—'}</div>
                    <div>Importe banco: {String(ev.bank_amount ?? '—')} · proveedor: {String(ev.provider_amount ?? '—')}
                      {ev.provider_net != null ? ` · neto: ${String(ev.provider_net)}` : ''}
                      {ev.legs_sum != null ? ` · suma legs: ${String(ev.legs_sum)}` : ''}
                      {ev.provider_fee != null ? ` · fee: ${String(ev.provider_fee)}` : ''}
                    </div>
                    <div>Diff importe: {String(ev.amount_diff ?? '—')} · días: {String(ev.day_diff ?? 'n/d')} · score: {String(ev.score ?? '—')}</div>
                    <div>Confirmado por: {String(ev.confirmed_by || ev.suggested_by || 'system_auto')} · {String(ev.confirmed_at || ev.suggested_at || '')}</div>
                    {Array.isArray(ev.provider_tx_ids) && (ev.provider_tx_ids as unknown[]).length > 0 ? (
                      <div>Provider txs: {(ev.provider_tx_ids as unknown[]).join(', ')}</div>
                    ) : ev.provider_tx_id != null ? (
                      <div>Provider tx: {String(ev.provider_tx_id)}</div>
                    ) : null}
                    {isSuggested && tx.type === 'bank' && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          disabled={actionBusy === tx.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void actOnSuggestion(tx.id, 'confirm');
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#166534',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Confirmar sugerencia
                        </button>
                        <button
                          type="button"
                          disabled={actionBusy === tx.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void actOnSuggestion(tx.id, 'reject');
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#991b1b',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
