import { useState, useEffect } from 'react';

interface StripeStatus {
  connected: boolean;
  status: string;
  account_id?: string;
  last_sync_at?: string;
}

export default function StripeConnect({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [tenantId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/stripe/status/${tenantId}`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const connectStripe = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/stripe/connect-url?tenant_id=${tenantId}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/stripe/sync/${tenantId}`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div style={{ padding: 24, color: '#64748b' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: status?.connected ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24 }}>💳</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Stripe</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {status?.connected ? '🟢 Connected' : '⚪ Not connected'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {status?.connected && (
            <button
              onClick={syncNow}
              disabled={syncing}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#0f172a',
                fontSize: 13,
                fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer',
                opacity: syncing ? 0.6 : 1,
              }}
            >
              {syncing ? '⏳ Syncing...' : '🔄 Sync'}
            </button>
          )}
          
          {status?.connected ? (
            <div style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#f0fdf4',
              color: '#166534',
              fontSize: 13,
              fontWeight: 600,
            }}>
              ✅ Auto-sync
            </div>
          ) : (
            <button
              onClick={connectStripe}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#635bff',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Connect Stripe
            </button>
          )}
        </div>
      </div>
      
      {status?.connected && (
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          Account: {status.account_id?.slice(0, 12)}...<br />
          Last sync: {status.last_sync_at 
            ? new Date(status.last_sync_at).toLocaleString('es-ES') 
            : 'Never — click Sync to fetch transactions'}
        </div>
      )}
    </div>
  );
}
