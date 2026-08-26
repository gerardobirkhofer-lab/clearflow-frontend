interface BackButtonProps {
  to?: string;
  label?: string;
}

export default function BackButton({ to = '/dashboard', label = '← Volver al Panel' }: BackButtonProps) {
  return (
    <a
      href={to}
      style={{
        display: 'inline-block',
        padding: '10px 18px',
        marginBottom: 20,
        backgroundColor: '#f1f5f9',
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        color: '#475569',
        fontSize: 14,
        fontWeight: 500,
        textDecoration: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {label}
    </a>
  );
}
