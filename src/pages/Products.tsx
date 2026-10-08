import { Link } from 'react-router-dom';
import BackDashboard from '../components/BackDashboard';
import ProductEditor from '../components/ProductEditor';

export default function Products() {
  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 72px' }}>
        <BackDashboard />
        <p style={banner}>Esta información es necesaria para armar Horizonte y Salud de Caja.</p>
        <h1 style={{ margin: '14px 0 8px', fontSize: 32 }}>Productos</h1>
        <p style={{ color: '#64748b' }}>Precio de venta y costo de cada producto. Se escribe una vez. Después solo se toca si cambia un precio o un costo.</p>
        <section style={card}>
          <ProductEditor />
        </section>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
          <Link to="/setup" style={link}>Setup</Link>
          <Link to="/horizonte" style={link}>Horizonte</Link>
          <Link to="/caja" style={link}>Salud de Caja</Link>
        </div>
      </div>
    </main>
  );
}

const banner = { marginTop: 18, background: '#eef2ff', color: '#312e81', borderRadius: 12, padding: '12px 14px', fontWeight: 800 };
const card = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginTop: 16 };
const link = { color: '#635bff', fontWeight: 700, textDecoration: 'none' };
