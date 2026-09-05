import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface HubCard {
  id: string;
  icon: string;
  title: string;
  desc: string;
  path: string;
  color: string;
  bg: string;
  category: string;
}

export default function PostLoginHub() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');

  const cards: HubCard[] = [
    // === OPERACIONES ===
    {
      id: 'smartcheck',
      icon: '🔁',
      title: 'Iniciar SmartCheck',
      desc: 'Subí documentos y verificá tus cobros en segundos',
      path: '/smartcheck-wizard',
      color: '#059669',
      bg: '#f0fdf4',
      category: 'operaciones',
    },
    {
      id: 'history',
      icon: '📋',
      title: 'SmartChecks Anteriores',
      desc: 'Ver resueltos, pendientes y nuevos',
      path: '/reconciliation',
      color: '#0891b2',
      bg: '#ecfeff',
      category: 'operaciones',
    },
    // === ANÁLISIS ===
    {
      id: 'dashboard',
      icon: '📊',
      title: 'Dashboard',
      desc: 'Resumen general de tu negocio',
      path: '/dashboard',
      color: '#635bff',
      bg: '#f5f3ff',
      category: 'analisis',
    },
    {
      id: 'statistics',
      icon: '📈',
      title: 'Estadísticas',
      desc: 'Métricas detalladas y tendencias',
      path: '/statistics',
      color: '#0f766e',
      bg: '#f0fdfa',
      category: 'analisis',
    },
    {
      id: 'profitability',
      icon: '📉',
      title: 'Rentabilidad',
      desc: 'Análisis de rentabilidad por tienda',
      path: '/profitability',
      color: '#854d0e',
      bg: '#fefce8',
      category: 'analisis',
    },
    {
      id: 'revenue-control',
      icon: '💰',
      title: 'Control de Ingresos',
      desc: 'Seguimiento de ingresos en tiempo real',
      path: '/revenue-control',
      color: '#7e22ce',
      bg: '#faf5ff',
      category: 'analisis',
    },
    // === ACCIONES ===
    {
      id: 'mismatches',
      icon: '⚠️',
      title: 'Discrepancias',
      desc: 'Ver y gestionar discrepancias detectadas',
      path: '/mismatch-tracker',
      color: '#991b1b',
      bg: '#fef2f2',
      category: 'acciones',
    },
    {
      id: 'disputes',
      icon: '🎯',
      title: 'Disputas',
      desc: 'Reclamos abiertos con liquidadoras',
      path: '/dispute-tracker',
      color: '#9a3412',
      bg: '#fff7ed',
      category: 'acciones',
    },
    {
      id: 'communications',
      icon: '📧',
      title: 'Comunicaciones',
      desc: 'Emails y mensajes enviados',
      path: '/communications',
      color: '#1e40af',
      bg: '#eff6ff',
      category: 'acciones',
    },
    {
      id: 'reports',
      icon: '📊',
      title: 'Informes',
      desc: 'Reportes y documentación para contador',
      path: '/reports',
      color: '#166534',
      bg: '#f0fdf4',
      category: 'acciones',
    },
    // === CONFIGURACIÓN ===
    {
      id: 'setup',
      icon: '⚙️',
      title: 'Configuración',
      desc: 'Tiendas, proveedores y cuentas bancarias',
      path: '/setup',
      color: '#64748b',
      bg: '#f1f5f9',
      category: 'config',
    },
    {
      id: 'tenant-selector',
      icon: '🏪',
      title: 'Cambiar Tienda',
      desc: 'Seleccionar otra tienda/sucursal',
      path: '/tenant-selector',
      color: '#635bff',
      bg: '#f5f3ff',
      category: 'config',
    },
    {
      id: 'pricing',
      icon: '💎',
      title: 'Planes y Precios',
      desc: 'Ver o cambiar tu plan',
      path: '/pricing',
      color: '#92400e',
      bg: '#fef3c7',
      category: 'config',
    },
  ];

  const categories = [
    { key: 'operaciones', label: '🚀 Operaciones', desc: 'Acciones del día a día' },
    { key: 'analisis', label: '📊 Análisis', desc: 'Entendé tu negocio' },
    { key: 'acciones', label: '⚡ Acciones', desc: 'Gestioná problemas y oportunidades' },
    { key: 'config', label: '⚙️ Configuración', desc: 'Ajustá tu cuenta' },
  ];

  const setupComplete = !!localStorage.getItem('tenant') && !!localStorage.getItem('onboardingComplete');

  if (!setupComplete) {
    return (
      <div style={{ textAlign: 'center', padding: 80, fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
        <h2 style={{ marginBottom: 8 }}>Configuración inicial necesaria</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Completá tu perfil, tiendas y proveedores para comenzar.</p>
        <button
          onClick={() => navigate('/setup')}
          style={{ padding: '12px 24px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          ⚙️ Completar Configuración →
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
      fontFamily: 'sans-serif',
      padding: '40px 20px',
    }}>
      {/* HEADER DE BIENVENIDA */}
      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>
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

      {/* CATEGORÍAS */}
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {categories.map(cat => {
          const catCards = cards.filter(c => c.category === cat.key);
          return (
            <div key={cat.key} style={{ marginBottom: 40 }}>
              {/* Título de categoría */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                  {cat.desc}
                </div>
              </div>

              {/* Grid de tarjetas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 14,
              }}>
                {catCards.map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => navigate(btn.path)}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      border: '2px solid transparent',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = btn.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${btn.color}22`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    }}
                  >
                    <div style={{ fontSize: 24 }}>{btn.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{btn.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{btn.desc}</div>
                    <div style={{ marginTop: 'auto', paddingTop: 4, fontSize: 12, fontWeight: 600, color: btn.color }}>
                      Abrir →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <p style={{ marginTop: 40, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
        {tenant?.name ? `Tienda activa: ${tenant.name}` : ''}
      </p>
    </div>
  );
}
