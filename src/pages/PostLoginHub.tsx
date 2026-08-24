import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PostLoginHub() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');

  const buttons = [
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Ir al Dashboard',
      desc: 'Resumen general de tu negocio',
      path: '/dashboard',
      color: '#635bff',
      bg: '#f5f3ff',
    },
    {
      id: 'smartcheck',
      icon: '🔁',
      title: 'Iniciar SmartCheck',
      desc: 'Subí documentos y verificá tus cobros',
      path: '/smartcheck-wizard',
      color: '#059669',
      bg: '#f0fdf4',
    },
    {
      id: 'history',
      icon: '📋',
      title: 'SmartChecks Anteriores',
      desc: 'Ver resueltos, pendientes y nuevos',
      path: '/reconciliation',
      color: '#0891b2',
      bg: '#ecfeff',
    },
    {
      id: 'setup',
      icon: '⚙️',
      title: 'Cambiar Setup',
      desc: 'Modificar tiendas, proveedores y cuentas',
      path: '/setup',
      color: '#64748b',
      bg: '#f1f5f9',
    },
  ];

  if (!tenant) {
    return (
      <div style={{ textAlign: 'center', padding: 80, fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <h2 style={{ marginBottom: 8 }}>No hay tienda seleccionada</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Seleccioná una tienda para comenzar.</p>
        <button
          onClick={() => navigate('/tenant-selector')}
          style={{ padding: '12px 24px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Ir a seleccionar →
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
      fontFamily: 'sans-serif',
      padding: '40px 20px',
    }}>
      {/* HEADER DE BIENVENIDA */}
      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 500 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: '#635bff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: 28,
          margin: '0 auto 24px',
        }}>C</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
          ¡Hola {user.name || 'Gerardo'}!
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', margin: 0 }}>
          Buen día. Espero que te encuentres muy bien hoy.
        </p>
        <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>
          ¿Qué querés hacer?
        </p>
      </div>

      {/* BOTONES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
        maxWidth: 600,
        width: '100%',
      }}>
        {buttons.map(btn => (
          <button
            key={btn.id}
            onClick={() => navigate(btn.path)}
            style={{
              padding: 32,
              borderRadius: 16,
              border: '2px solid transparent',
              background: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = btn.color;
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${btn.color}22`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ fontSize: 32 }}>{btn.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{btn.title}</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>{btn.desc}</div>
            <div style={{ marginTop: 'auto', paddingTop: 8, fontSize: 13, fontWeight: 600, color: btn.color }}>
              Abrir →
            </div>
          </button>
        ))}
      </div>

      {/* FOOTER */}
      <p style={{ marginTop: 40, fontSize: 13, color: '#94a3b8' }}>
        {tenant?.name ? `Tienda activa: ${tenant.name}` : ''}
      </p>
    </div>
  );
}
