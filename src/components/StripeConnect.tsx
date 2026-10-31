import { useState, useEffect } from 'react';

interface StripeStatus {
  connected: boolean;
  status: string;
  account_id?: string;
  last_sync_at?: string;
  mode?: string;
}

export default function StripeConnect({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL;
  const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

  useEffect(() => {
    fetchStatus();
  }, [tenantId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/api/v1/stripe/status/${tenantId}`, { headers: getAuth() });
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const connectDirect = async () => {
    if (!apiKey.trim().startsWith('sk_')) {
      setError('La API key debe empezar con sk_live_ o sk_test_');
      return;
    }
    setConnecting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/v1/stripe/connect-direct`, {
        method: 'POST',
        headers: { ...getAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, api_key: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Error al conectar con Stripe');
      } else {
        setMessage(data.message || 'Stripe conectado correctamente');
        setApiKey('');
        await fetchStatus();
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setConnecting(false);
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/v1/stripe/sync/${tenantId}`, {
        method: 'POST',
        headers: getAuth(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Error al sincronizar');
      } else {
        setMessage(`Sincronizado: ${data.synced_count || 0} transacciones importadas`);
        await fetchStatus();
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    try {
      await fetch(`${API}/api/v1/stripe/disconnect/${tenantId}`, {
        method: 'POST',
        headers: getAuth(),
      });
      await fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: 24, color: '#64748b' }}>Cargando...</div>;

  return (
    <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 24 }}>💳</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Stripe</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {status?.connected ? '🟢 Conectado' : '⚪ No conectado'}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div style={{ padding: 12, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 13, marginBottom: 12 }}>
          ✅ {message}
        </div>
      )}

      {!status?.connected ? (
        <div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            Pega tu API key de Stripe para conectar directamente. La encontrás en el dashboard de Stripe → Desarrolladores → Claves API.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk_live_... o sk_test_..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              marginBottom: 12,
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={connectDirect}
            disabled={connecting || !apiKey.trim()}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: connecting || !apiKey.trim() ? '#cbd5e1' : '#635bff',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: connecting || !apiKey.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {connecting ? '⏳ Conectando...' : '🔌 Conectar Stripe'}
          </button>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
            🔒 Tu API key se guarda encriptada y solo se usa para leer transacciones. Nunca se comparte.
          </div>
        </div>
      ) : (
        <div>
          {status?.last_sync_at && (
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
              Última sincronización: {new Date(status.last_sync_at).toLocaleString('es-ES')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={syncNow}
              disabled={syncing}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#0f172a',
                fontSize: 13,
                fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer',
              }}
            >
              {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar ahora'}
            </button>
            <button
              onClick={disconnect}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Desconectar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
