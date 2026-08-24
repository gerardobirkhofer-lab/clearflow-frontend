import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';

interface DisputeItem {
  id: string;
  date: string;
  provider: string;
  amount: number;
  status: 'resolved' | 'pending' | 'new';
  daysOpen: number;
  description: string;
}

const DEMO_DATA: DisputeItem[] = [
  // Resueltos (éxito)
  { id: 'R001', date: '2026-08-10', provider: 'Stripe', amount: 1250.00, status: 'resolved', daysOpen: 0, description: 'Pago de reserva mesa 12 — acreditado' },
  { id: 'R002', date: '2026-08-08', provider: 'Redsys', amount: 890.50, status: 'resolved', daysOpen: 0, description: 'TPV cierre lote #4521 — acreditado' },
  { id: 'R003', date: '2026-08-05', provider: 'Stripe', amount: 2340.00, status: 'resolved', daysOpen: 0, description: 'Pedido online #8834 — acreditado' },
  
  // Pendientes (sin resolver)
  { id: 'P001', date: '2026-08-15', provider: 'Redsys', amount: 456.00, status: 'pending', daysOpen: 9, description: 'TPV cierre lote #4523 — faltante' },
  { id: 'P002', date: '2026-08-12', provider: 'Stripe', amount: 1200.00, status: 'pending', daysOpen: 12, description: 'Reserva evento privado — no llegó al banco' },
  { id: 'P003', date: '2026-08-01', provider: 'Redsys', amount: 678.25, status: 'pending', daysOpen: 23, description: 'Cierre lote #4519 — discrepancia fee' },
  
  // Nuevos (detectados en última carga)
  { id: 'N001', date: '2026-08-22', provider: 'Stripe', amount: 567.80, status: 'new', daysOpen: 2, description: 'Cargo duplicado detectado — mesa 8' },
  { id: 'N002', date: '2026-08-21', provider: 'Redsys', amount: 345.00, status: 'new', daysOpen: 3, description: 'Fee no informado — lote #4525' },
];

export default function SmartCheckStatus() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'resolved' | 'pending' | 'new'>('all');

  const resolved = DEMO_DATA.filter(d => d.status === 'resolved');
  const pending = DEMO_DATA.filter(d => d.status === 'pending');
  const newItems = DEMO_DATA.filter(d => d.status === 'new');

  const filtered = filter === 'all' ? DEMO_DATA : DEMO_DATA.filter(d => d.status === filter);

  const totalResolved = resolved.reduce((acc, r) => acc + r.amount, 0);
  const totalPending = pending.reduce((acc, p) => acc + p.amount, 0);
  const totalNew = newItems.reduce((acc, n) => acc + n.amount, 0);

  const statusConfig = {
    resolved: { label: 'Resuelto', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
    pending: { label: 'Pendiente', color: '#d97706', bg: '#fffbeb', icon: '⏳' },
    new: { label: 'Nuevo', color: '#dc2626', bg: '#fef2f2', icon: '🚨' },
  };

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
      </div>

      {/* RESUMEN CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#166534', marginBottom: 4, fontWeight: 600 }}>✅ RESUELTOS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>€{totalResolved.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{resolved.length} pagos acreditados</div>
        </div>
        <div style={{ padding: 20, background: '#fffbeb', borderRadius: 12, border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4, fontWeight: 600 }}>⏳ PENDIENTES</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>€{totalPending.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{pending.length} sin resolver</div>
        </div>
        <div style={{ padding: 20, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
          <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 4, fontWeight: 600 }}>🚨 NUEVOS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>€{totalNew.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{newItems.length} detectados hoy</div>
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
