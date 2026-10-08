import { useEffect, useState, type FormEvent } from 'react';

const API = import.meta.env.VITE_API_URL || '';

type Company = { id: string; name: string };
type Product = { id: number; name: string; sale_price: number; cost: number };

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json',
  };
}

function euros(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

export default function ProductEditor() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState('');

  const load = async (id: string) => {
    const response = await fetch(`${API}/api/v1/products?tenant_id=${id}`, { headers: authHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error('No se pudieron leer los productos.');
    setProducts(data.items || []);
  };

  useEffect(() => {
    fetch(`${API}/api/v1/companies`, { headers: authHeaders() })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error('No se pudo leer el grupo.');
        const items: Company[] = data.items || [];
        setCompanies(items);
        const stored = JSON.parse(localStorage.getItem('tenant') || 'null');
        const first = items.find((item) => item.id === stored?.id)?.id || items[0]?.id || '';
        setCompanyId(first);
        if (first) await load(first);
      })
      .catch((reason) => setError(reason.message));
  }, []);

  const choose = async (id: string) => {
    setCompanyId(id);
    setError('');
    try {
      await load(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron leer los productos.');
    }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch(`${API}/api/v1/products?tenant_id=${companyId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, sale_price: price, cost: cost || '0', site_id: null }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(typeof data.detail === 'string' ? data.detail : 'No se pudo guardar el producto.');
      return;
    }
    setName('');
    setPrice('');
    setCost('');
    await load(companyId);
  };

  const remove = async (id: number) => {
    setError('');
    const response = await fetch(`${API}/api/v1/products/${id}?tenant_id=${companyId}`, { method: 'DELETE', headers: authHeaders() });
    if (!response.ok) {
      setError('No se pudo quitar el producto.');
      return;
    }
    await load(companyId);
  };

  return (
    <div>
      {companies.length > 1 && (
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={label}>Sociedad</span>
          <select aria-label="Sociedad" value={companyId} onChange={(event) => choose(event.target.value)} style={field}>
            {companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      )}
      <p style={{ color: '#64748b', marginTop: 0 }}>Se carga una vez para todo el grupo. El precio y el costo sirven para Horizonte y para la caja.</p>
      {error && <p style={{ color: '#991b1b' }}>{error}</p>}
      <form onSubmit={add}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <input aria-label="Nombre del producto" value={name} placeholder="Nombre" onChange={(event) => setName(event.target.value)} style={field} />
          <input aria-label="Precio de venta" value={price} inputMode="decimal" placeholder="Precio de venta" onChange={(event) => setPrice(event.target.value)} style={field} />
          <input aria-label="Costo" value={cost} inputMode="decimal" placeholder="Costo" onChange={(event) => setCost(event.target.value)} style={field} />
        </div>
        <button type="submit" style={primary}>Añadir producto</button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
        {products.map((item) => (
          <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
            <div>
              <strong>{item.name}</strong>
              <div style={{ color: '#64748b', fontSize: 14 }}>venta {euros(item.sale_price)} · costo {euros(item.cost)}</div>
            </div>
            <button type="button" onClick={() => remove(item.id)} style={quiet}>Quitar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const label = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 6 };
const field = { padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, width: '100%', boxSizing: 'border-box' as const };
const primary = { marginTop: 12, padding: '10px 14px', borderRadius: 10, border: 'none', background: '#635bff', color: 'white', fontWeight: 800, cursor: 'pointer' };
const quiet = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer' };
