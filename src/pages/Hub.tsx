import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface HubCard {
  icon: string;
  title: string;
  desc: string;
  path: string;
  color: string;
  bg: string;
  priority: number;
}

export default function Hub() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const cards: HubCard[] = [
    {
      icon: '📁',
      title: t('hub.upload', 'Cargar Archivos'),
      desc: t('hub.uploadDesc', 'Subí extractos bancarios, informes TPV o archivos de proveedores.'),
      path: '/upload-center',
      color: '#635bff',
      bg: '#f5f3ff',
      priority: 1,
    },
    {
      icon: '🔁',
      title: t('hub.smartcheck', 'SmartCheck'),
      desc: t('hub.smartcheckDesc', 'Verificá que todo lo cobrado llegó al banco y detectá diferencias.'),
      path: '/reconciliation',
      color: '#059669',
      bg: '#f0fdf4',
      priority: 2,
    },
    {
      icon: '📊',
      title: t('hub.dashboard', 'Panel de Control'),
      desc: t('hub.dashboardDesc', 'Mirá el estado general de tu negocio en un solo vistazo.'),
      path: '/dashboard',
      color: '#0f172a',
      bg: '#f8fafc',
      priority: 3,
    },
    {
      icon: '🎯',
      title: t('hub.disputes', 'Disputas'),
      desc: t('hub.disputesDesc', 'Reclamá pagos pendientes o faltantes a tus proveedores.'),
      path: '/dispute-tracker',
      color: '#dc2626',
      bg: '#fef2f2',
      priority: 4,
    },
    {
      icon: '🔍',
      title: t('hub.mismatches', 'Discrepancias'),
      desc: t('hub.mismatchesDesc', 'Revisá diferencias detectadas entre lo esperado y lo recibido.'),
      path: '/mismatch-tracker',
      color: '#d97706',
      bg: '#fffbeb',
      priority: 5,
    },
    {
      icon: '📧',
      title: t('hub.communications', 'Comunicaciones'),
      desc: t('hub.communicationsDesc', 'Historial de emails enviados a proveedores.'),
      path: '/communications',
      color: '#4f46e5',
      bg: '#eef2ff',
      priority: 6,
    },
    {
      icon: '📄',
      title: t('hub.reports', 'Informes'),
      desc: t('hub.reportsDesc', 'Descargá reportes en PDF o Excel para tu contador.'),
      path: '/reports',
      color: '#0891b2',
      bg: '#ecfeff',
      priority: 7,
    },
    {
      icon: '⚙️',
      title: t('hub.setup', 'Configuración'),
      desc: t('hub.setupDesc', 'Gestioná tiendas, proveedores, cuentas bancarias e idioma.'),
      path: '/setup',
      color: '#64748b',
      bg: '#f1f5f9',
      priority: 8,
    },
  ];

  if (!tenant) {
    return (
      <div style={{ textAlign: 'center', padding: 80, fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <h2 style={{ marginBottom: 8 }}>{t('hub.noTenant', 'No hay tienda seleccionada')}</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>{t('hub.selectTenant', 'Seleccioná una tienda para comenzar.')}</p>
        <button
          onClick={() => navigate('/tenant-selector')}
          style={{ padding: '12px 24px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {t('hub.goSelect', 'Ir a seleccionar →')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 28 }}>{tenant.type === 'online' ? '🌐' : tenant.type === 'client' ? '🏢' : '🏪'}</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
              {tenant.name}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
              {t('hub.greeting', 'Hola {{name}}, ¿qué querés hacer hoy?', { name: user.name || '' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tenant-selector')}
          style={{
            padding: '6px 14px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: 13,
            color: '#635bff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← {t('hub.switchStore', 'Cambiar tienda / cliente')}
        </button>
      </div>

      {/* GRID DE BOTONES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
      }}>
        {cards.sort((a, b) => a.priority - b.priority).map(card => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            style={{
              padding: 24,
              borderRadius: 14,
              border: '2px solid transparent',
              background: card.bg,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${card.color}22`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: 32 }}>{card.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{card.title}</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>{card.desc}</div>
            <div style={{ marginTop: 'auto', paddingTop: 8, fontSize: 13, fontWeight: 600, color: card.color }}>
              {t('hub.open', 'Abrir →')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
