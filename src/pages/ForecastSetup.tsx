import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

type Site = { id: string; name: string; active: boolean };
type Company = { id: string; name: string; sites: Site[] };
type Expense = {
  id: number;
  kind_label: string;
  concept: string;
  amount: number;
  due_day: number | null;
  due_on: string | null;
  site_id: string | null;
};
type SaleMonth = { id: number; site_id: string; year: number; month: number; amount: number; source: string };
type Product = { id: number; site_id: string | null; name: string; sale_price: number; cost: number };

const KINDS = [
  { value: 'rent', label: 'Alquiler' },
  { value: 'salary', label: 'Sueldos' },
  { value: 'wage', label: 'Jornales' },
  { value: 'supplier', label: 'Proveedores' },
  { value: 'tax', label: 'Impuestos' },
  { value: 'other', label: 'Otro' },
];

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json',
  };
}

function euros(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function detail(data: { detail?: unknown }, fallback: string) {
  return typeof data.detail === 'string' ? data.detail : fallback;
}

export default function ForecastSetup() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [months, setMonths] = useState<SaleMonth[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [kind, setKind] = useState('rent');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [dueOn, setDueOn] = useState('');
  const [expenseSite, setExpenseSite] = useState('');
  const [repeat, setRepeat] = useState<'month' | 'once'>('month');
  const [saleSite, setSaleSite] = useState('');
  const [saleYear, setSaleYear] = useState(String(new Date().getFullYear() - 1));
  const [saleMonth, setSaleMonth] = useState(String(new Date().getMonth() + 1));
  const [saleAmount, setSaleAmount] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productSite, setProductSite] = useState('');

  const company = companies.find((item) => item.id === companyId);
  const sites = (company?.sites || []).filter((site) => site.active);
  const siteName = (id: string | null) => sites.find((site) => site.id === id)?.name || company?.sites.find((site) => site.id === id)?.name || 'Todos los locales';

  const loadCompany = async (id: string) => {
    const [expenseRes, monthRes, productRes] = await Promise.all([
      fetch(`${API}/api/v1/expenses?tenant_id=${id}`, { headers: authHeaders() }),
      fetch(`${API}/api/v1/sale-months?tenant_id=${id}`, { headers: authHeaders() }),
      fetch(`${API}/api/v1/products?tenant_id=${id}`, { headers: authHeaders() }),
    ]);
    const expenseBody = await expenseRes.json();
    const monthBody = await monthRes.json();
    const productBody = await productRes.json();
    if (!expenseRes.ok || !monthRes.ok || !productRes.ok) {
      throw new Error('No se pudo leer el seteo.');
    }
    setExpenses(expenseBody.items || []);
    setMonths(monthBody.items || []);
    setProducts(productBody.items || []);
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
        if (first) await loadCompany(first);
      })
      .catch((reason) => setError(reason.message));
  }, []);

  const chooseCompany = async (id: string) => {
    setCompanyId(id);
    setError('');
    try {
      await loadCompany(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo leer el seteo.');
    }
  };

  const addExpense = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (sites.length > 1 && !expenseSite) {
      setError('Elige el local de ese gasto.');
      return;
    }
    if (repeat === 'month' && !dueDay) {
      setError('Escribe el día del mes en que se paga.');
      return;
    }
    if (repeat === 'once' && !dueOn) {
      setError('Elige el día concreto.');
      return;
    }
    const response = await fetch(`${API}/api/v1/expenses?tenant_id=${companyId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        kind,
        concept,
        amount,
        due_day: repeat === 'month' ? dueDay : null,
        due_on: repeat === 'once' ? dueOn : null,
        site_id: expenseSite || sites[0]?.id || null,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(detail(data, 'No se pudo guardar el gasto.'));
      return;
    }
    setConcept('');
    setAmount('');
    setDueDay('');
    setDueOn('');
    await loadCompany(companyId);
  };

  const removeExpense = async (id: number) => {
    setError('');
    const response = await fetch(`${API}/api/v1/expenses/${id}?tenant_id=${companyId}`, { method: 'DELETE', headers: authHeaders() });
    if (!response.ok) {
      setError('No se pudo quitar el gasto.');
      return;
    }
    await loadCompany(companyId);
  };

  const addMonth = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const siteId = saleSite || sites[0]?.id;
    if (!siteId) {
      setError('Hace falta un local para guardar el mes.');
      return;
    }
    const response = await fetch(`${API}/api/v1/sale-months?tenant_id=${companyId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ site_id: siteId, year: Number(saleYear), month: Number(saleMonth), amount: saleAmount }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(detail(data, 'No se pudo guardar el mes.'));
      return;
    }
    setSaleAmount('');
    await loadCompany(companyId);
  };

  const addProduct = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch(`${API}/api/v1/products?tenant_id=${companyId}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: productName,
        sale_price: productPrice,
        cost: productCost || '0',
        site_id: productSite || null,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(detail(data, 'No se pudo guardar el producto.'));
      return;
    }
    setProductName('');
    setProductPrice('');
    setProductCost('');
    await loadCompany(companyId);
  };

  const removeProduct = async (id: number) => {
    setError('');
    const response = await fetch(`${API}/api/v1/products/${id}?tenant_id=${companyId}`, { method: 'DELETE', headers: authHeaders() });
    if (!response.ok) {
      setError('No se pudo quitar el producto.');
      return;
    }
    await loadCompany(companyId);
  };

  const years = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px 72px' }}>
        <Link to="/panel" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>Volver al chequeo</Link>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 18 }}>Aparte del alta</div>
        <h1 style={{ margin: '8px 0 0', fontSize: 32 }}>Seteo</h1>
        <p style={{ color: '#64748b' }}>Gastos de los próximos 12 meses, ventas pasadas y lo que cuesta cada producto. Con eso Horizonte dice si gana.</p>
        {companies.length > 1 && (
          <label style={{ display: 'block', marginTop: 12 }}>
            <span style={label}>Sociedad</span>
            <select aria-label="Sociedad" value={companyId} onChange={(event) => chooseCompany(event.target.value)} style={field}>
              {companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        )}
        {error && <p style={{ color: '#991b1b' }}>{error}</p>}

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Gastos</h2>
          <p style={muted}>Día, importe y descripción. Si se repite, entra cada mes en ese día. Si es un día concreto, entra solo esa fecha.</p>
          <form onSubmit={addExpense}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {KINDS.map((item) => (
                <button key={item.value} type="button" aria-pressed={kind === item.value} onClick={() => setKind(item.value)} style={chip(kind === item.value)}>{item.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" aria-pressed={repeat === 'month'} onClick={() => setRepeat('month')} style={chip(repeat === 'month')}>Cada mes</button>
              <button type="button" aria-pressed={repeat === 'once'} onClick={() => setRepeat('once')} style={chip(repeat === 'once')}>Un día concreto</button>
            </div>
            <div style={grid}>
              <input aria-label="Descripción del gasto" value={concept} placeholder="Descripción, por ejemplo nómina" onChange={(event) => setConcept(event.target.value)} style={field} />
              <input aria-label="Importe del gasto" value={amount} inputMode="decimal" placeholder="Importe" onChange={(event) => setAmount(event.target.value)} style={field} />
              {repeat === 'month' ? (
                <input aria-label="Día de pago" value={dueDay} inputMode="numeric" placeholder="Día, del 1 al 31" onChange={(event) => setDueDay(event.target.value)} style={field} />
              ) : (
                <input aria-label="Fecha del gasto" type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} style={field} />
              )}
              {sites.length > 1 && (
                <select aria-label="Local del gasto" value={expenseSite} onChange={(event) => setExpenseSite(event.target.value)} style={field}>
                  <option value="">Local</option>
                  {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              )}
            </div>
            <button type="submit" style={{ ...primary, marginTop: 12 }}>Añadir gasto</button>
          </form>
          <ul style={list}>
            {expenses.map((item) => (
              <li key={item.id} style={row}>
                <div>
                  <strong>{item.concept}</strong>
                  <div style={muted}>{item.kind_label} · {euros(item.amount)} · {item.due_on ? item.due_on : item.due_day ? `día ${item.due_day} de cada mes` : 'sin día'} · {siteName(item.site_id)}</div>
                </div>
                <button type="button" onClick={() => removeExpense(item.id)} style={quiet}>Quitar</button>
              </li>
            ))}
          </ul>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Ventas pasadas</h2>
          <p style={muted}>Un mes y su importe, por local. Sirve el cierre del TPV, aunque el número venga neto de alguna comisión. Si ese mes ya existe, se sustituye.</p>
          <form onSubmit={addMonth}>
            <div style={grid}>
              {sites.length > 1 && (
                <select aria-label="Local de las ventas" value={saleSite} onChange={(event) => setSaleSite(event.target.value)} style={field}>
                  <option value="">Local</option>
                  {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              )}
              <select aria-label="Año" value={saleYear} onChange={(event) => setSaleYear(event.target.value)} style={field}>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <select aria-label="Mes" value={saleMonth} onChange={(event) => setSaleMonth(event.target.value)} style={field}>
                {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
              </select>
              <input aria-label="Importe del mes" value={saleAmount} inputMode="decimal" placeholder="Importe del mes" onChange={(event) => setSaleAmount(event.target.value)} style={field} />
            </div>
            <button type="submit" style={{ ...primary, marginTop: 12 }}>Guardar mes</button>
          </form>
          <ul style={list}>
            {months.map((item) => (
              <li key={item.id} style={row}>
                <div>
                  <strong>{MONTHS[item.month - 1]} {item.year}</strong>
                  <div style={muted}>{siteName(item.site_id)} · {euros(item.amount)} · {item.source === 'api' ? 'enviado por su sistema' : 'escrito aquí'}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Productos</h2>
          <p style={muted}>Precio de venta y lo que cuesta hacerlo. El facturador suele tener el precio. El costo sale del escandallo del TPV, o se escribe aquí.</p>
          <form onSubmit={addProduct}>
            <div style={grid}>
              <input aria-label="Nombre del producto" value={productName} placeholder="Nombre" onChange={(event) => setProductName(event.target.value)} style={field} />
              <input aria-label="Precio de venta" value={productPrice} inputMode="decimal" placeholder="Precio de venta" onChange={(event) => setProductPrice(event.target.value)} style={field} />
              <input aria-label="Costo" value={productCost} inputMode="decimal" placeholder="Costo" onChange={(event) => setProductCost(event.target.value)} style={field} />
              {sites.length > 0 && (
                <select aria-label="Local del producto" value={productSite} onChange={(event) => setProductSite(event.target.value)} style={field}>
                  <option value="">Todos los locales</option>
                  {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              )}
            </div>
            <button type="submit" style={{ ...primary, marginTop: 12 }}>Añadir producto</button>
          </form>
          <ul style={list}>
            {products.map((item) => (
              <li key={item.id} style={row}>
                <div>
                  <strong>{item.name}</strong>
                  <div style={muted}>{siteName(item.site_id)} · venta {euros(item.sale_price)} · costo {euros(item.cost)}</div>
                </div>
                <button type="button" onClick={() => removeProduct(item.id)} style={quiet}>Quitar</button>
              </li>
            ))}
          </ul>
        </section>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
          <Link to="/caja" style={link}>Salud de Caja</Link>
          <Link to="/horizonte" style={link}>Horizonte</Link>
          <Link to="/ajustar" style={link}>Cambiar/Ajustar setup</Link>
        </div>
      </div>
    </main>
  );
}

const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginTop: 16 };
const muted = { color: '#64748b', fontSize: 14, margin: '4px 0 0' };
const label = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 6 };
const field = { padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, width: '100%', boxSizing: 'border-box' as const };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 12 };
const primary = { padding: '10px 14px', borderRadius: 10, border: 'none', background: '#635bff', color: 'white', fontWeight: 800, cursor: 'pointer' };
const quiet = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer' };
const list = { listStyle: 'none', padding: 0, margin: '16px 0 0' };
const row = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px solid #f1f5f9' };
const link = { color: '#635bff', fontWeight: 700, textDecoration: 'none' };

function chip(on: boolean) {
  return {
    padding: '8px 12px',
    borderRadius: 999,
    border: on ? '1px solid #635bff' : '1px solid #e2e8f0',
    background: on ? '#eef2ff' : 'white',
    color: on ? '#4338ca' : '#334155',
    fontWeight: 700,
    cursor: 'pointer',
  };
}
