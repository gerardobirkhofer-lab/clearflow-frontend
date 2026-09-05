import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetch(`${import.meta.env.VITE_API_URL}/api/v1/stripe/checkout-sessions/${sessionId}`)
        .then(r => r.json())
        .then(data => {
          setSession(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [sessionId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Verificando pago...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
      <h1 style={{ color: '#1a1a1a', marginBottom: 10 }}>¡Pago confirmado!</h1>
      <p style={{ color: '#666', fontSize: 16, marginBottom: 30 }}>
        Gracias por tu compra. Tu pago ha sido confirmado.
      </p>

      {session && (
        <div style={{ background: '#f6f9fc', borderRadius: 12, padding: 24, marginBottom: 30, textAlign: 'left' }}>
          <p><strong>Importe:</strong> {(session.amount_total / 100).toFixed(2)} {session.currency?.toUpperCase()}</p>
          <p><strong>Estado:</strong> {session.payment_status}</p>
          <p><strong>Cliente:</strong> {session.customer_email}</p>
        </div>
      )}

      <Link to="/dashboard" style={{
        display: 'inline-block',
        background: '#635bff',
        color: 'white',
        padding: '12px 32px',
        borderRadius: 8,
        textDecoration: 'none',
        fontWeight: 600
      }}>
        Volver al Panel
      </Link>
    </div>
  );
}
