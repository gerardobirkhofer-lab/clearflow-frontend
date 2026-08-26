import { Link } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  label?: string;
}

export default function BackButton({ to = '/dashboard', label = '← Volver al Panel' }: BackButtonProps) {
  return (
    <Link
      to={to}
      style={{
        background: 'none',
        border: 'none',
        color: '#635bff',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        marginBottom: 16,
        padding: '8px 0',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        textDecoration: 'none'
      }}
    >
      {label}
    </Link>
  );
}
