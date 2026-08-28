import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const selectRole = (role: 'owner' | 'advisor') => {
    const setup = JSON.parse(localStorage.getItem('clearflowSetup') || '{}');
    setup.userRole = role;
    localStorage.setItem('clearflowSetup', JSON.stringify(setup));
    localStorage.setItem('userRole', role);
    navigate('/setup-wizard');
  };

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
      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 560 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: '#635bff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: 28,
          margin: '0 auto 24px',
        }}>C</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
          {t('welcome.title', 'Bienvenido a ClearFlow')}
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Gracias por confiarnos el control dinámico vía algoritmos de que tu esfuerzo diario llegue en tiempo y forma a tu cuenta bancaria.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        maxWidth: 640,
        width: '100%',
      }}>
        {/* CARD: DUEÑO */}
        <button
          onClick={() => selectRole('owner')}
          style={{
            padding: 40, borderRadius: 16, border: '2px solid #e2e8f0',
            background: 'white', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#635bff';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,91,255,0.12)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏪</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            {t('welcome.ownerTitle', 'Soy Dueño de Negocio')}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Gestiono uno o varios locales, tiendas online o restaurantes. Quiero saber exactamente cuánto cobré, qué falta y dónde está mi dinero.
          </p>
          <div style={{ marginTop: 20, color: '#635bff', fontWeight: 600, fontSize: 14 }}>
            Seleccionar →
          </div>
        </button>

        {/* CARD: ASESOR */}
        <button
          onClick={() => selectRole('advisor')}
          style={{
            padding: 40, borderRadius: 16, border: '2px solid #e2e8f0',
            background: 'white', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#635bff';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,91,255,0.12)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏢</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            {t('welcome.advisorTitle', 'Soy Asesor / Contador')}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            Trabajo con múltiples clientes. Necesito una herramienta que me permita revisar y disputar pagos de todos mis clientes en un solo lugar.
          </p>
          <div style={{ marginTop: 20, color: '#635bff', fontWeight: 600, fontSize: 14 }}>
            Seleccionar →
          </div>
        </button>
      </div>

      <p style={{ marginTop: 40, fontSize: 13, color: '#94a3b8' }}>
        Puedes cambiar esto más adelante desde Configuración.
      </p>
    </div>
  );
}
