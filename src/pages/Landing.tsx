import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#0f172a', background: '#ffffff' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #f1f5f9', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#635bff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>C</div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>ClearFlow</span>
        </div>
        <Link to="/login" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: 8, background: '#0f172a', color: 'white', fontSize: 14, fontWeight: 600 }}>
          {t('landing.getStarted')}
        </Link>
      </nav>

      <section style={{ padding: '100px 40px 80px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', letterSpacing: -1.5 }}>
          {t('landing.title')}
        </h1>
        <p style={{ fontSize: 20, color: '#64748b', lineHeight: 1.6, margin: '0 auto 40px', maxWidth: 600 }}>
          {t('landing.subtitle')}
        </p>
        <Link to="/login" style={{ textDecoration: 'none', padding: '16px 40px', borderRadius: 10, background: '#635bff', color: 'white', fontSize: 18, fontWeight: 700, display: 'inline-block' }}>
          {t('landing.cta')}
        </Link>
      </section>

      <footer style={{ padding: '40px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        {t('landing.footer')}
      </footer>
    </div>
  );
}
