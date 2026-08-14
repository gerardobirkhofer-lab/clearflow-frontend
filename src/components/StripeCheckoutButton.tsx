import { useState } from 'react';

interface Props {
  priceId: string;
  customerEmail?: string;
}

export default function StripeCheckoutButton({ priceId, customerEmail }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/stripe/checkout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'payment',
          price_id: priceId,
          customer_email: customerEmail
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error: ' + (data.detail || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        background: '#635bff',
        color: 'white',
        border: 'none',
        padding: '12px 28px',
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? 'Loading...' : 'Buy Now — $39.00'}
    </button>
  );
}