import { useNavigate } from 'react-router-dom';

interface HubCard {
  id: string;
  icon: string;
  title: string;
  desc: string;
  path: string;
  color: string;
  bg: string;
  primary?: boolean;
}

/** Happy path: Setup → subir/sync → Run → Ensayo. Demo trackers removed. */
export default function PostLoginHub() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');

  const setupComplete = !!localStorage.getItem('tenant') && !!localStorage.getItem('onboardingComplete');

  const cards: HubCard[] = [
    {
      id: 'setup',
      icon: '🏦',
      title: '1. Setup · Banco y proveedores',
      desc: 'Open Banking, reconectar banco, CSV de liquidaciones',
      path: '/setup',
      color: '#0f172a',
      bg: '#f1f5f9',
      primary: true,
    },
    {
      id: 'upload',
      icon: '📤',
      title: '2. Subir documentos',
      desc: 'Extracto banco o pack del TPV / Stripe',
      path: '/smartcheck-wizard',
      color: '#059669',
      bg: '#f0fdf4',
      primary: true,
    },
    {
      id: 'payment-check',
      icon: '⚡',
      title: '3. Run · Verificación de pagos',
      desc: 'Motor 1:1 y 1:N con evidencia (auto-confirm)',
      path: '/payment-check',
      color: '#635bff',
      bg: '#f5f3ff',
      primary: true,
    },
    {
      id: 'trial',
      icon: '🧪',
      title: '4. Informe de ensayo',
      desc: '% confirmado, sugeridos, reglas y audit trail',
      path: '/trial-report',
      color: '#3730a3',
      bg: '#eef2ff',
      primary: true,
    },
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Dashboard',
      desc: 'Confirmados vs pendientes (misma verdad que el motor)',
      path: '/dashboard',
      color: '#0f766e',
      bg: '#f0fdfa',
    },
    {
      id: 'data',
      icon: '📦',
      title: 'Export / borrado',
      desc: 'Descargar JSON/CSV o purge de la partición del tenant',
      path: '/reports',
      color: '#9a3412',
      bg: '#fff7ed',
    },
    {
      id: 'tenant',
      icon: '🏪',
      title: 'Cambiar negocio',
      desc: tenant?.name ? `Actual: ${tenant.name}` : 'Elegir tenant',
      path: '/tenant-selector',
      color: '#64748b',
      bg: '#f8fafc',
    },
  ];

  if (!setupComplete) {
    return (
      <div style={{ textAlign: 'center', padding: 80, fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
        <h2 style={{ marginBottom: 8 }}>Configuración inicial necesaria</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          Completá setup (banco / proveedores) para empezar el piloto.
        </p>
        <button
          type="button"
          onClick={() => navigate('/setup-wizard')}
          style={{
            padding: '12px 24px',
            background: '#635bff',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Completar Setup →
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f8fafc 0%, #e0e7ff 55%, #f8fafc 100%)',
        fontFamily: 'sans-serif',
        padding: '40px 20px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 36, maxWidth: 640, margin: '0 auto 36px' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: '#0f172a',
            color: 'white',
            fontWeight: 800,
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          C
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
          Hola {user.name || 'Gerardo'}
        </h1>
        <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
          Camino piloto: conectar datos → correr el motor → mirar evidencia. No es un cierre firmado.
        </p>
      </div>

      <div
        style={{
          maxWidth: 880,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => navigate(card.path)}
            style={{
              textAlign: 'left',
              padding: 20,
              borderRadius: 14,
              border: card.primary ? '2px solid #c7d2fe' : '1px solid #e2e8f0',
              background: card.bg,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: card.color }}>{card.title}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 1.4 }}>{card.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
