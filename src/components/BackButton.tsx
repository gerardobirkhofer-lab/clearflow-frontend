import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  label?: string;
}

export default function BackButton({ to = '/dashboard', label = '← Volver al Panel' }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        background: 'none',
        border: 'none',
        color: '#635bff',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        marginBottom: 16,
        padding: '4px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
    >
      {label}
    </button>
  );
}
