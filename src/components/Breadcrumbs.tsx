import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const ROUTE_LABELS: Record<string, string> = {
  '/hub': 'Inicio',
  '/dashboard': 'Dashboard',
  '/statistics': 'Estadísticas',
  '/profitability': 'Rentabilidad',
  '/revenue-control': 'Control de Ingresos',
  '/mismatch-tracker': 'Discrepancias',
  '/dispute-tracker': 'Disputas',
  '/communications': 'Comunicaciones',
  '/reports': 'Informes',
  '/reconciliation': 'SmartChecks',
  '/smartcheck-wizard': 'Nuevo SmartCheck',
  '/setup': 'Configuración',
  '/tenant-selector': 'Cambiar Tienda',
  '/pricing': 'Planes',
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const location = useLocation();

  // Si no se pasan items, generar automáticamente desde la ruta
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const path = location.pathname;
    const label = ROUTE_LABELS[path] || path;
    return [
      { label: '🏠 Inicio', path: '/hub' },
      { label, path },
    ];
  })();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
      fontSize: 13,
      color: '#64748b',
      flexWrap: 'wrap',
    }}>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        return (
          <span key={item.path} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {index > 0 && (
              <span style={{ color: '#cbd5e1' }}>/</span>
            )}
            {isLast ? (
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.label}</span>
            ) : (
              <Link
                to={item.path}
                style={{
                  color: '#635bff',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
