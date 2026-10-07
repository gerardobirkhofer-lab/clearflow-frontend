import { Link } from 'react-router-dom';

export default function Horizon() {
  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 72px' }}>
        <Link to="/panel" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>Volver al chequeo</Link>
        <div style={{ marginTop: 18, fontSize: 13, color: '#635bff', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>En breve</div>
        <h1 style={{ margin: '8px 0 0', fontSize: 32 }}>Horizonte</h1>
        <p style={{ color: '#334155', lineHeight: 1.5 }}>
          Aquí se verá si, con la temporada, las fiestas y los festivos de años anteriores, y con los contratos de hoy, el local gana.
          Hasta que no estén las ventas pasadas y el costo de cada producto, esta pantalla no inventa un número.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
          <Link to="/ajustar" style={button}>Ir a setup</Link>
          <Link to="/flujo" style={quiet}>Cargar erogaciones</Link>
        </div>
      </div>
    </main>
  );
}

const button = { padding: '12px 18px', borderRadius: 10, background: '#635bff', color: 'white', fontWeight: 800, textDecoration: 'none' };
const quiet = { padding: '12px 18px', borderRadius: 10, background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', fontWeight: 700, textDecoration: 'none' };
