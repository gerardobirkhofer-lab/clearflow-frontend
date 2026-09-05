import { Link } from 'react-router-dom';

export default function PaymentCancel() {
  return (
    <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
      <h1 style={{ color: '#1a1a1a', marginBottom: 10 }}>Pago cancelado</h1>
      <p style={{ color: '#666', fontSize: 16, marginBottom: 30 }}>
        Tu pago fue cancelado. No se realizó ningún cargo.
      </p>

      <Link to="/pricing" style={{
        display: 'inline-block',
        background: '#635bff',
        color: 'white',
        padding: '12px 32px',
        borderRadius: 8,
        textDecoration: 'none',
        fontWeight: 600
      }}>
        Intentar de nuevo
      </Link>
    </div>
  );
}
