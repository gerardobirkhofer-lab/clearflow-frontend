import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';

const API = import.meta.env.VITE_API_URL;
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

function settlementLine(match: any) {
  const base = `${match.bank?.concept || 'Transacción'} — conciliado con ${match.provider?.provider_name || 'proveedor'}`;
  const settlement = match.settlement;
  if (!settlement) return base;
  if (settlement.fee_difference > 0.01) {
    return `${base}. Llegó ${settlement.fee_difference.toFixed(2)} € por debajo del contrato`;
  }
  if (settlement.days_late > 0) {
    return `${base}. Llegó ${settlement.days_late} días más tarde de lo pactado`;
  }
  return `${base}. La comisión y el plazo coinciden con el contrato`;
}

function openLine(row: any) {
  const base = `${row.concept || 'Pago de proveedor'} — sin coincidencia en el banco`;
  if (row.expected_net == null) return base;
  const when = row.expected_date ? ` el ${row.expected_date}` : '';
  return `${base}. Según el contrato deberían llegar ${Number(row.expected_net).toFixed(2)} €${when}`;
}

interface DisputeItem {
  id: string;
  date: string;
  provider: string;
  amount: number;
  status: 'resolved' | 'pending' | 'new';
  daysOpen: number;
  description: string;
}

interface ReconciliationData {
  matched: any[];
  unmatched_bank: any[];
  unmatched_provider: any[];
  summary: {
    total_bank: number;
    total_provider: number;
    matched_count: number;
    unmatched_bank_count: number;
    unmatched_provider_count: number;
  };
}

export default function SmartCheckStatus() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'resolved' | 'pending' | 'new'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DisputeItem[]>([]);
  const [summary, setSummary] = useState({
    totalResolved: 0,
    totalPending: 0,
    totalNew: 0,
    resolvedCount: 0,
    pendingCount: 0,
    newCount: 0,
  });
  const [lastCheckDate, setLastCheckDate] = useState<string | null>(null);
  const [days, setDays] = useState<Array<{ day: string; matched_count: number; open_bank_count: number; open_provider_count: number }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
    const tenantId = tenantData.id;

    if (!tenantId) {
      setError('No hay cuenta configurada. Inicia sesión y ejecuta un SmartCheck.');
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const recRes = await fetch(`${API}/api/v1/reconciliation/status?tenant_id=${tenantId}`, {
        headers: getAuth(),
      });
      if (!recRes.ok) {
        throw new Error('No se pudo leer la conciliación');
      }
      const recData: ReconciliationData = await recRes.json();
      setLastCheckDate(new Date().toISOString());
      const daysRes = await fetch(`${API}/api/v1/reconciliation/days?tenant_id=${tenantId}`, { headers: getAuth() });
      if (daysRes.ok) {
        const daysData = await daysRes.json();
        setDays(daysData.items || []);
      }

      const allItems: DisputeItem[] = [
        ...(recData.matched || []).map((m: any) => ({
          id: `M${m.bank?.id || m.provider?.id}`,
          date: (m.bank?.date || m.provider?.date || '').split('T')[0],
          provider: m.provider?.provider_name || 'Proveedor',
          amount: m.bank?.amount || 0,
          status: 'resolved' as const,
          daysOpen: 0,
          description: settlementLine(m),
        })),
        ...(recData.unmatched_bank || []).map((b: any) => ({
          id: `UB${b.id}`,
          date: (b.date || '').split('T')[0],
          provider: 'Banco',
          amount: b.amount || 0,
          status: 'pending' as const,
          daysOpen: 0,
          description: `${b.concept || 'Movimiento bancario'} — sin contrapartida en proveedores`,
        })),
        ...(recData.unmatched_provider || []).map((p: any) => ({
          id: `UP${p.id}`,
          date: (p.date || '').split('T')[0],
          provider: p.provider_name || 'Proveedor',
          amount: p.amount || 0,
          status: 'new' as const,
          daysOpen: 0,
          description: openLine(p),
        })),
      ];

      setItems(allItems);
      updateSummary(allItems);
    } catch (err: any) {
      setItems([]);
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const updateSummary = (allItems: DisputeItem[]) => {
    const resolved = allItems.filter(d => d.status === 'resolved');
    const pending = allItems.filter(d => d.status === 'pending');
    const newItems = allItems.filter(d => d.status === 'new');

    setSummary({
      totalResolved: resolved.reduce((acc, r) => acc + r.amount, 0),
      totalPending: pending.reduce((acc, p) => acc + p.amount, 0),
      totalNew: newItems.reduce((acc, n) => acc + n.amount, 0),
      resolvedCount: resolved.length,
      pendingCount: pending.length,
      newCount: newItems.length,
    });
  };

  const filtered = filter === 'all' ? items : items.filter(d => d.status === filter);

  const statusConfig = {
    resolved: { label: 'Resuelto', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
    pending: { label: 'Pendiente', color: '#d97706', bg: '#fffbeb', icon: '⏳' },
    new: { label: 'Nuevo', color: '#dc2626', bg: '#fef2f2', icon: '🚨' },
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '100px 20px', fontFamily: 'sans-serif', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <p>Cargando estado de reconciliación...</p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <BackButton />
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: '#991b1b' }}>No hay datos disponibles</h2>
        <p style={{ color: '#64748b' }}>{error}</p>
        <button onClick={() => navigate('/smartcheck-wizard')} style={{ marginTop: 20, padding: '12px 24px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          🔁 Ir a SmartCheck
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          📋 Estado SmartCheck
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Estado de tus Cobros</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Todo lo que se resolvió, lo que sigue abierto y lo nuevo que detectamos.
        </p>
        {lastCheckDate && (
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Última actualización: {new Date(lastCheckDate).toLocaleString('es-ES')}
          </p>
        )}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Comprobación continua</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Cada día queda guardado. Lo ya conciliado no se vuelve a abrir. Lo que sigue abierto se mira otra vez.</div>
          {days.length === 0 ? (
            <div style={{ fontSize: 14, color: '#94a3b8' }}>Todavía no hay un día guardado.</div>
          ) : days.map((day) => (
            <div key={day.day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
              <span>{day.day}</span>
              <span>{day.matched_count} conciliadas · {day.open_bank_count + day.open_provider_count} abiertas</span>
            </div>
          ))}
        </div>
      </div>

      {/* RESUMEN CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#166534', marginBottom: 4, fontWeight: 600 }}>✅ RESUELTOS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>€{summary.totalResolved.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{summary.resolvedCount} pagos acreditados</div>
        </div>
        <div style={{ padding: 20, background: '#fffbeb', borderRadius: 12, border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4, fontWeight: 600 }}>⏳ PENDIENTES</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>€{summary.totalPending.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{summary.pendingCount} sin resolver</div>
        </div>
        <div style={{ padding: 20, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 4, fontWeight: 600 }}>🚨 NUEVOS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>€{summary.totalNew.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{summary.newCount} detectados hoy</div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['all', 'resolved', 'pending', 'new'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: filter === f ? '#0f172a' : 'white',
              color: filter === f ? 'white' : '#64748b',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {f === 'all' ? 'Todos' : f === 'resolved' ? 'Resueltos' : f === 'pending' ? 'Pendientes' : 'Nuevos'}
          </button>
        ))}
      </div>

      {/* LISTA */}
      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map(item => {
          const cfg = statusConfig[item.status];
          return (
            <div key={item.id} style={{
              padding: 16,
              borderRadius: 12,
              background: 'white',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{ fontSize: 24 }}>{cfg.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{item.provider}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    background: cfg.bg,
                    color: cfg.color,
                  }}>{cfg.label}</span>
                  {item.daysOpen > 0 && (
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>+{item.daysOpen}d</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{item.description}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.date}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: cfg.color }}>
                €{item.amount.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p>No hay items en esta categoría.</p>
        </div>
      )}
    </div>
  );
}
