import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Tenant {
  id: number;
  name: string;
  type: string;
}

export default function TenantSelector() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantType, setNewTenantType] = useState('store');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('store');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetch(`http://localhost:8000/api/v1/tenants/?user_id=${user.id}`)
      .then(r => r.json())
      .then(data => {
        setTenants(data.tenants || []);
        setLoading(false);
      });
  }, []);

  const createTenant = async () => {
    if (!newTenantName) return;
    const res = await fetch('http://localhost:8000/api/v1/tenants/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTenantName, type: newTenantType, owner_user_id: user.id }),
    });
    const data = await res.json();
    setTenants(prev => [...prev, data]);
    setNewTenantName('');
  };

  const selectTenant = (tenant: Tenant) => {
    localStorage.setItem('tenant', JSON.stringify(tenant));
    navigate('/dashboard');
  };

  const startEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setEditName(tenant.name);
    setEditType(tenant.type);
  };

  const saveEdit = async (tenantId: number) => {
    const res = await fetch(`http://localhost:8000/api/v1/tenants/${tenantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, type: editType }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTenants(prev => prev.map(t => t.id === tenantId ? updated : t));
      setEditingId(null);
    }
  };

  const deleteTenant = async (tenantId: number) => {
    if (!confirm('Are you sure you want to delete this store/client?')) return;
    const res = await fetch(`http://localhost:8000/api/v1/tenants/${tenantId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setTenants(prev => prev.filter(t => t.id !== tenantId));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Welcome back, {user.name}</h1>
      <p style={{ color: '#64748b', marginBottom: 40 }}>Select which store or client you're working with today.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {tenants.map(t => (
          <div
            key={t.id}
            style={{
              padding: 24,
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              background: 'white',
              transition: 'all 0.2s',
            }}
          >
            {editingId === t.id ? (
              <div>
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
                  <option value="store">Physical Store</option>
                  <option value="online">Online Store</option>
                  <option value="client">Client (Accountant)</option>
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
                <div onClick={() => selectTenant(t)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', textTransform: 'capitalize', marginTop: 4 }}>{t.type}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => startEdit(t)}
                    style={{ flex: 1, padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deleteTenant(t.id)}
                    style={{ flex: 1, padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        <div style={{
          padding: 24,
          borderRadius: 12,
          border: '2px dashed #cbd5e1',
          background: '#f8fafc',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>➕</div>
          <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 12 }}>Add New Store/Client</div>
          <input
            value={newTenantName}
            onChange={e => setNewTenantName(e.target.value)}
            placeholder="Name (e.g. Tienda Norte)"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 8, fontSize: 14 }}
          />
          <select
            value={newTenantType}
            onChange={e => setNewTenantType(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 8, fontSize: 14 }}
          >
            <option value="store">Physical Store</option>
            <option value="online">Online Store</option>
            <option value="client">Client (Accountant)</option>
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
    </div>
  );
}
