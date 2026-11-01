import { Link, useLocation } from 'react-router-dom';
import BackButton from '../components/BackButton';

/**
 * Replaces MismatchTracker / DisputeTracker / fake report demos.
 * Those screens used Math.random / hardcoded txs and burned trust.
 */
export default function DemoRetired() {
  const loc = useLocation();
  const name = loc.pathname.includes('dispute')
    ? 'Disputas (demo)'
    : loc.pathname.includes('mismatch')
      ? 'Discrepancias (demo)'
      : 'Pantalla demo';

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: 24, fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>{name} retirada</h1>
      <p style={{ color: '#64748b', lineHeight: 1.5 }}>
        Esta pantalla usaba datos inventados. Para no mostrar algo que ni nosotros creemos,
        el flujo real es: <strong>Verificación de pagos</strong> + <strong>Informe de ensayo</strong>
        (confirmados / sugeridos / pendientes con evidencia).
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
        <Link
          to="/payment-check"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: '#635bff',
            color: 'white',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          Verificación de pagos →
        </Link>
        <Link
          to="/trial-report"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: 'white',
            color: '#0f172a',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          Informe de ensayo →
        </Link>
      </div>
    </div>
  );
}
