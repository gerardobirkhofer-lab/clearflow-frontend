import { Link } from 'react-router-dom';

interface BackButtonProps {
  to?: string;
  label?: string;
}

export default function BackButton({ to = '/dashboard', label = '← Volver al Panel' }: BackButtonProps) {
  return (
    <Link
      to={to}
      onClick={() => window.scrollTo(0, 0)}
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        color: '#635bff',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        marginBottom: 20,
        padding: '10px 16px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = '#f1f5f9';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = '#f8fafc';
      }}
    >
      {label}
    </Link>
  );
}
