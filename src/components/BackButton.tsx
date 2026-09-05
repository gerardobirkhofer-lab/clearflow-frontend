import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  label?: string;
  fallbackTo?: string;
  showHome?: boolean;
}

export default function BackButton({
  to,
  label,
  fallbackTo = '/hub',
  showHome = true,
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    navigate(fallbackTo);
  };

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
      <button
        onClick={handleBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 18px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          color: '#475569',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        ← {label || 'Volver'}
      </button>
      {showHome && (
        <button
          onClick={handleHome}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            backgroundColor: '#eef2ff',
            border: '1px solid #c7d2fe',
            borderRadius: 8,
            color: '#4338ca',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          🏠 Ir al Inicio
        </button>
      )}
    </div>
  );
}
