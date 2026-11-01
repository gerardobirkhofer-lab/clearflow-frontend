import { useEffect, useMemo, useState } from 'react';

interface Institution {
  id: string;
  name: string;
  logo?: string | null;
}

interface Connection {
  institution_id: string;
  provider: string;
  status: string;
  last_sync_at?: string | null;
  extra?: {
    account_ids?: string[];
    last_sync_count?: number;
    status_detail?: string;
  };
}

interface Props {
  tenantId: string;
}

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';

const authHeaders = (extra: Record<string, string> = {}) => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  ...extra,
});

function apiDetail(data: any, fallback: string) {
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ');
  }
  return fallback;
}

function friendlySyncError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('token') || lower.includes('unauthorized') || lower.includes('expired') || lower.includes('401')) {
    return 'La autorización del banco caducó. Volvé a conectar el banco (no hace falta borrar datos ya sincronizados).';
  }
  if (lower.includes('not configured') || lower.includes('503')) {
    return 'Open Banking no está configurado en el servidor.';
  }
  if (lower.includes('no connected')) {
    return 'No hay banco conectado para este negocio. Conectá primero.';
  }
  return raw;
}

function friendlyBankName(id: string, name: string): string {
  if (id === 'demo' || id.includes('demobank') || /demo bank/i.test(name)) {
    return 'Banco demo (prueba)';
  }
  return name.replace(/\s*\(sandbox alias\)/i, '').trim() || name;
}

function statusLabel(status?: string): string {
  switch ((status || '').toLowerCase()) {
    case 'connected':
      return 'Conectado';
    case 'pending':
      return 'Pendiente de autorización';
    case 'needs_reconnect':
    case 'expired':
    case 'revoked':
      return 'Hay que reconectar el banco';
    default:
      return status || 'Sin conexión';
  }
}

export default function OpenBankingConnect({ tenantId }: Props) {
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedBank, setSelectedBank] = useState('demo');
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [providerName, setProviderName] = useState('Tink');

  const needsReconnect = connections.some((c) =>
    ['needs_reconnect', 'expired', 'revoked'].includes((c.status || '').toLowerCase()),
  );
  const connected = connections.some((c) => c.status === 'connected') && !needsReconnect;
  const activeConnection =
    connections.find((c) => (c.status || '').toLowerCase() === 'needs_reconnect')
    || connections.find((c) => c.status === 'connected')
    || connections[0];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ob = params.get('open_banking');
    if (ob === 'ok') {
      setMessage(
        `Banco conectado${params.get('accounts') ? ` (${params.get('accounts')} cuentas)` : ''}. Ya puedes sincronizar movimientos.`,
      );
      // Replace history so browser Back does not return to Tink
      window.history.replaceState({}, '', '/setup');
    } else if (ob === 'error') {
      setError(params.get('error') || 'Error en la autorización bancaria');
      window.history.replaceState({}, '', '/setup');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [tenantId]);

  const bootstrap = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, instRes, connRes] = await Promise.all([
        fetch(`${API}/api/v1/open-banking/status`),
        fetch(`${API}/api/v1/open-banking/institutions?country=ES`),
        fetch(`${API}/api/v1/open-banking/connections/${tenantId}`, {
          headers: authHeaders(),
        }),
      ]);
      if (connRes.status === 401 || connRes.status === 403) {
        setError('Sesión inválida o sin acceso a este negocio. Volvé a iniciar sesión.');
      }

      if (statusRes.ok) {
        const status = await statusRes.json();
        setConfigured(!!status.configured);
        setProviderName(status.provider_display || status.provider || 'Open Banking');
      }

      if (instRes.ok) {
        const data = await instRes.json();
        const raw: Institution[] = data.institutions || [];
        // One clean demo entry for the pitch; drop duplicate alias rows
        const cleaned: Institution[] = [];
        let demoAdded = false;
        for (const inst of raw) {
          const isDemo =
            inst.id === 'demo' ||
            inst.id.includes('demobank') ||
            /demo bank/i.test(inst.name || '');
          if (isDemo) {
            if (demoAdded) continue;
            cleaned.push({ id: 'demo', name: 'Banco demo (prueba)', logo: inst.logo });
            demoAdded = true;
            continue;
          }
          cleaned.push({ ...inst, name: friendlyBankName(inst.id, inst.name) });
        }
        setInstitutions(cleaned);
        if (cleaned.some((i) => i.id === 'demo')) setSelectedBank('demo');
        else if (cleaned[0]) setSelectedBank(cleaned[0].id);
      } else if (instRes.status === 503) {
        setConfigured(false);
      }

      if (connRes.ok) {
        const data = await connRes.json();
        setConnections(data.connections || []);
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar Open Banking');
    } finally {
      setLoading(false);
    }
  };

  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return institutions.slice(0, 40);
    return institutions
      .filter((b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q))
      .slice(0, 40);
  }, [institutions, search]);

  const connectBank = async () => {
    if (!selectedBank) {
      setError('Selecciona un banco');
      return;
    }
    setConnecting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/v1/open-banking/link`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          tenant_id: tenantId,
          institution_id: selectedBank,
          country: 'ES',
          redirect_after: `${window.location.origin}/setup`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(apiDetail(data, 'No se pudo crear el enlace bancario'));
        return;
      }
      if (!data.link) {
        setError('El servidor no devolvió un enlace de autorización');
        return;
      }
      setMessage('Redirigiendo al banco…');
      window.location.href = data.link;
    } catch (err: any) {
      setError(err?.message || 'Error de conexión');
    } finally {
      setConnecting(false);
    }
  };

  const syncNow = async () => {
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/v1/open-banking/sync/${tenantId}?days=90`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(friendlySyncError(apiDetail(data, 'Error al sincronizar movimientos')));
        await bootstrap();
        return;
      }
      const count = data.synced_count ?? 0;
      const accounts = data.accounts ?? 0;
      if (accounts === 0 && count === 0) {
        setError('La sincronización no vio cuentas. Reconectá el banco e intentá de nuevo.');
        return;
      }
      setMessage(
        count > 0
          ? `Sincronizado: ${count} movimientos nuevos de ${accounts} cuentas`
          : `Sincronización OK: no hay movimientos nuevos (${accounts} cuentas). Los anteriores siguen en Dashboard.`,
      );
      await bootstrap();
    } catch (err: any) {
      setError(friendlySyncError(err?.message || 'Error de conexión al sincronizar'));
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 16, color: '#64748b' }}>
        Cargando conexión bancaria…
      </div>
    );
  }

  return (
    <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 24 }}>🏦</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Conexión bancaria (Open Banking)</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {needsReconnect
              ? '🟠 Hay que reconectar'
              : connected
                ? '🟢 Conectado'
                : configured
                  ? '⚪ Listo para conectar'
                  : '⚪ No configurado en el servidor'}
            {' · '}
            {providerName}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#64748b', marginTop: 0, marginBottom: 16 }}>
        Conecta la cuenta del negocio con consentimiento PSD2 (aprox. 90 días) y sincroniza movimientos automáticamente.
        Para la demo usa <strong>Banco demo (prueba)</strong>.
      </p>

      {needsReconnect && (
        <div style={{ padding: 12, borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: 13, marginBottom: 12, lineHeight: 1.45 }}>
          <strong>La autorización del banco caducó o falló.</strong> Pulsá{' '}
          <em>Reconectar banco</em> abajo. Los movimientos ya sincronizados <strong>no se borran</strong>.
        </div>
      )}

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>
          ⚠️ {error}
          {needsReconnect || /caduc|reconect|token|401/i.test(error) ? (
            <div style={{ marginTop: 8 }}>
              Usá el botón <strong>Reconectar banco</strong> — no hace falta borrar datos.
            </div>
          ) : null}
        </div>
      )}

      {message && (
        <div style={{ padding: 12, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 13, marginBottom: 12 }}>
          ✅ {message}
        </div>
      )}

      {!configured && (
        <div style={{ padding: 12, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 13 }}>
          La conexión bancaria no está configurada en el servidor. Revisa las variables de Tink en Railway.
        </div>
      )}

      {configured && (
        <>
          {activeConnection && (
            <div style={{ padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14, fontSize: 13 }}>
              <div>
                <strong>Estado:</strong> {statusLabel(activeConnection.status)}
                {activeConnection.extra?.account_ids?.length
                  ? ` · ${activeConnection.extra.account_ids.length} cuentas`
                  : ''}
              </div>
              {activeConnection.last_sync_at && (
                <div style={{ color: '#64748b', marginTop: 4 }}>
                  Última sincronización: {new Date(activeConnection.last_sync_at).toLocaleString('es-ES')}
                  {typeof activeConnection.extra?.last_sync_count === 'number'
                    ? ` · ${activeConnection.extra.last_sync_count} movimientos`
                    : ''}
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Buscar banco (España)</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Santander, BBVA, demo…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: 8 }}
            />
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}
            >
              {filteredBanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={connectBank}
              disabled={connecting || !selectedBank}
              style={{
                flex: 1,
                minWidth: 180,
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                background: connecting ? '#cbd5e1' : '#0f172a',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: connecting ? 'not-allowed' : 'pointer',
              }}
            >
              {connecting
                ? '⏳ Abriendo banco…'
                : needsReconnect
                  ? '🔗 Reconectar banco'
                  : connected
                    ? '🔗 Reconectar / añadir banco'
                    : '🔗 Conectar banco'}
            </button>

            <button
              onClick={syncNow}
              disabled={syncing || !connected}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: syncing || !connected ? '#f8fafc' : 'white',
                color: '#0f172a',
                fontSize: 14,
                fontWeight: 600,
                cursor: syncing || !connected ? 'not-allowed' : 'pointer',
              }}
            >
              {syncing ? '⏳ Sincronizando…' : '🔄 Sincronizar movimientos'}
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
            🔒 ClearFlow no ve la contraseña del banco. La autorización la hace el banco (vía Tink) con tu consentimiento.
          </div>
        </>
      )}
    </div>
  );
}
