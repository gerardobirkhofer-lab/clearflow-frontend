import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Tenant {
  id: string;
  name: string;
  type: string;
}

export default function TenantSelector() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantType, setNewTenantType] = useState('store');
  const [loading, setCargando... useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('store');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const savedTenant = JSON.parse(localStorage.getItem('tenant') || 'null');

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenants/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(data => {
        setTenants(data.items || []);
        setCargando...lse);
      });
  }, []);

  const createTenant = async () => {
    if (!newTenantName) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenants/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ name: newTenantName, type: newTenantType }),
    });
    const data = await res.json();
    setTenants(prev => [...prev, data]);
    setNewTenantName('');
  };

  const selectTenant = (tenant: Tenant) => {
    localStorage.setItem('tenant', JSON.stringify(tenant));
    navigate('/dashboard');
  };

  const goToDashboard = () => {
    if (tenants.length > 0) {
      // Si no hay tenant guardado, guarda el primero
      if (!savedTenant) {
        localStorage.setItem('tenant', JSON.stringify(tenants[0]));
      }
      navigate('/dashboard');
    }
  };

  const startEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setEditName(tenant.name);
    setEditType(tenant.type);
  };

  const saveEdit = async (tenantId: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenants/${tenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ name: editName, type: editType }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTenants(prev => prev.map(t => t.id === tenantId ? updated : t));
      setEditingId(null);
    }
  };

  const deleteTenant = async (tenantId: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta tienda/cliente?')) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenants/${tenantId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    if (res.ok) {
      setTenants(prev => prev.filter(t => t.id !== tenantId));
      // Si borró el tenant guardado, limpiarlo
      if (savedTenant && savedTenant.id === tenantId) {
        localStorage.removeItem('tenant');
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: 28 }}>Bienvenido de nuevo, {user.name || 'Usuario'}</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>
            {tenants.length === 0 
              ? "Configurá tu primera tienda para comenzar." 
              : "Seleccioná una tienda para entrar a tu panel."}
          </p>
        </div>
        
        {/* BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {savedTenant && (
            <button
              onClick={goToDashboard}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#635bff',
                border: '1px solid #635bff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↩ Volver a {savedTenant.name}
            </button>
          )}
          {tenants.length > 0 && (
            <button
              onClick={goToDashboard}
              style={{
                padding: '10px 24px',
                background: '#635bff',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(99,91,255,0.3)',
              }}
            >
                            Ir al Panel →
            </button>
          )}
        </div>
      </div>

      {/* GRID DE TIENDAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
        {tenants.map(t => (
          <div
            key={t.id}
            onClick={() => editingId !== t.id && selectTenant(t)}
            style={{
              padding: 24,
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              background: 'white',
              cursor: editingId === t.id ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (editingId !== t.id) e.currentTarget.style.borderColor = '#635bff'; }}
            onMouseLeave={e => { if (editingId !== t.id) e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            {editingId === t.id ? (
              <div onClick={e => e.stopPropagation()}>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 8, fontSize: 14 }}
                />
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 8, fontSize: 14 }}
                >
                  <option value="store">Tienda Física</option>
                  <option value="online">Tienda Online</option>
                  <option value="client">Cliente (Contador)</option>
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => saveEdit(t.id)}
                    style={{ flex: 1, padding: '8px', background: '#635bff', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ flex: 1, padding: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 36 }}>{t.type === 'online' ? '🌐' : t.type === 'client' ? '🏢' : '🏪'}</div>
                  <span style={{ fontSize: 12, color: '#635bff', fontWeight: 600 }}>Clic para entrar →</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 13, color: '#64748b', textTransform: 'capitalize', marginBottom: 16 }}>{t.type}</div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={e => { e.stopPropagation(); startEdit(t); }}
                    style={{ flex: 1, padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteTenant(t.id); }}
                    style={{ flex: 1, padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {/* CARD PARA CREAR NUEVA TIENDA */}
        <div style={{
          padding: 24,
          borderRadius: 12,
          border: '2px dashed #cbd5e1',
          background: '#f8fafc',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>➕</div>
          <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 12 }}>Agregar Nueva Tienda/Cliente</div>
          <input
            value={newTenantName}
            onChange={e => setNewTenantName(e.target.value)}
            placeholder="Nombre (ej. Tienda Norte)"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 8, fontSize: 14 }}
          />
          <select
            value={newTenantType}
            onChange={e => setNewTenantType(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 8, fontSize: 14 }}
          >
            <option value="store">Tienda Física</option>
            <option value="online">Tienda Online</option>
            <option value="client">Cliente (Contador)</option>
          </select>
          <button
            onClick={createTenant}
            disabled={!newTenantName}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: newTenantName ? '#635bff' : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: newTenantName ? 'pointer' : 'not-allowed',
            }}
          >
            Create
          </button>
        </div>
      </div>

      {/* MENSAJE SI NO HAY TIENDAS */}
      {tenants.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>Aún no hay tiendas</div>
          <div style={{ color: '#64748b', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
            Creá tu primera tienda o cliente arriba para empezar a rastrear pagos, conciliar transacciones y monitorear tu flujo de caja.
          </div>
        </div>
      )}
    </div>
  );
}
