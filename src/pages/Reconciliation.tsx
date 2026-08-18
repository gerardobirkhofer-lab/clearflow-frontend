import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

interface Match {
  bank: { id: number; concept: string; amount: number; date: string | null };
  provider: { id: number; provider_name: string; concept: string; amount: number; date: string | null };
  score: number;
}

interface Unmatched {
  id: number;
  concept: string;
  amount: number;
  date: string | null;
  provider_name?: string;
}

export default function Reconciliation() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [providerFile, setProviderFile] = useState<File | null>(null);
  const [providerName, setProviderName] = useState('stripe');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  useEffect(() => {
    const t = JSON.parse(localStorage.getItem('tenant') || '{}');
    if (!t.id) {
      navigate('/tenants');
      return;
    }
    setTenant(t);
    fetchStatus(t.id);
  }, []);

  const fetchStatus = async (tenantId: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reconciliation/status?tenant_id=${tenantId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (!res.ok) {
        console.error('Status endpoint error:', res.status);
        return;
      }
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const uploadProvider = async () => {
    if (!providerFile || !tenant) return;
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', providerFile);
    formData.append('tenant_id', tenant.id);
    formData.append('provider_name', providerName);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/providers/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setUploadResult(`✅ ${data.message}`);
      setProviderFile(null);
      fetchStatus(tenant.id);
    } catch (err: any) {
      setUploadResult(`❌ ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const runReconciliation = async () => {
    if (!tenant) return;
    setRunning(true);
    setResult(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reconciliation/run?tenant_id=${tenant.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reconciliation failed');
      setResult(data);
      fetchStatus(tenant.id);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES');
  };

  const pendingCount = (status?.pending_bank || 0) + (status?.pending_provider || 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <BackButton />
      <h1 style={{ marginBottom: 8 }}>Reconciliation</h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>
        Match your bank transactions with provider reports to find discrepancies.
      </p>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{status?.bank_transactions ?? 0}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Bank Transactions</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{status?.provider_transactions ?? 0}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Provider Transactions</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{status?.matched_bank ?? 0}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Matched</div>
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{pendingCount}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Pending</div>
        </div>
      </div>

      {/* Upload Provider Report */}
      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Upload Provider Report</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <select
            value={providerName}
            onChange={e => setProviderName(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
          >
            <option value="stripe">Stripe</option>
            <option value="tpv">TPV / Card Terminal</option>
            <option value="paypal">PayPal</option>
            <option value="bizum">Bizum</option>
            <option value="transferencia">Bank Transfer</option>
          </select>
          <input
            type="file"
            accept=".csv"
            onChange={e => setProviderFile(e.target.files?.[0] || null)}
            style={{ fontSize: 14 }}
          />
          <button
            onClick={uploadProvider}
            disabled={!providerFile || uploading}
            style={{
              padding: '10px 20px',
              background: providerFile && !uploading ? '#635bff' : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: providerFile && !uploading ? 'pointer' : 'not-allowed',
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {uploadResult && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: uploadResult.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
            color: uploadResult.startsWith('✅') ? '#166534' : '#991b1b',
            fontSize: 14,
          }}>
            {uploadResult}
          </div>
        )}
      </div>

      {/* Run Reconciliation */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <button
          onClick={runReconciliation}
          disabled={running}
          style={{
            padding: '14px 40px',
            background: running ? '#cbd5e1' : '#635bff',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(99, 91, 255, 0.3)',
          }}
        >
          {running ? '⏳ Running Reconciliation...' : '⚡ Run Reconciliation'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div>
          {/* Matched */}
          {result.matched.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: '#166534', marginBottom: 16 }}>
                ✅ Matched ({result.matched.length})
              </h3>
              {result.matched.map((m: Match, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border: '1px solid #bbf7d0',
                    background: '#f0fdf4',
                    marginBottom: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.bank.concept}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Bank: {formatDate(m.bank.date)} · Provider: {m.provider.provider_name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#166534' }}>{formatAmount(m.bank.amount)}</div>
                    <div style={{ fontSize: 11, color: '#22c55e' }}>Score: {m.score}/7</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unmatched Bank */}
          {result.unmatched_bank.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: '#991b1b', marginBottom: 16 }}>
                ⚠️ Unmatched Bank Transactions ({result.unmatched_bank.length})
              </h3>
              {result.unmatched_bank.map((tx: Unmatched) => (
                <div
                  key={tx.id}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    marginBottom: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.concept || '—'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{formatDate(tx.date)}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#991b1b' }}>{formatAmount(tx.amount)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Unmatched Provider */}
          {result.unmatched_provider.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: '#92400e', marginBottom: 16 }}>
                ⚠️ Unmatched Provider Transactions ({result.unmatched_provider.length})
              </h3>
              {result.unmatched_provider.map((tx: Unmatched) => (
                <div
                  key={tx.id}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border: '1px solid #fde68a',
                    background: '#fefce8',
                    marginBottom: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.concept || '—'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {tx.provider_name} · {formatDate(tx.date)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#92400e' }}>{formatAmount(tx.amount)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div style={{
            padding: 20,
            borderRadius: 12,
            background: '#f8fafc',
            textAlign: 'center',
            marginTop: 24,
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>
              Summary: {result.summary.matched_count} matched, {result.summary.unmatched_bank_count} unmatched bank, {result.summary.unmatched_provider_count} unmatched provider
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
