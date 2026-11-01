import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Landing from './pages/Landing';
import Welcome from './pages/Welcome';
import OnboardingWizard from './pages/OnboardingWizard';
import PostLoginHub from './pages/PostLoginHub';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import Profitability from './pages/Profitability';
import RevenueControl from './pages/RevenueControl';
import PaymentCheck from './pages/PaymentCheck';
import Setup from './pages/Setup';
import SetupWizard from './pages/SetupWizard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Login from './pages/Login';
import TenantSelector from './pages/TenantSelector';
import Reports from './pages/Reports';
import MismatchTracker from './pages/MismatchTracker';
import SmartCheckStatus from './pages/SmartCheckStatus';
import SmartCheckWizard from './pages/SmartCheckWizard';
import Pricing from './pages/Pricing';
import DisputeTracker from './pages/DisputeTracker';
import Communications from './pages/Communications';
import TrialReport from './pages/TrialReport';
import PilotBanner from './components/PilotBanner';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const { t } = useTranslation();
  const location = useLocation();

  // Re-check auth on every route change (fixes navbar disappearing)
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, [location.pathname]);

  const handleLogout = () => {
    // Borrar SOLO claves de ClearFlow, no todo el localStorage (puede haber datos de otros sistemas)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('clearflow') || key === 'token' || key === 'user' || key === 'tenant' || key === 'onboardingComplete') {
        localStorage.removeItem(key);
      }
    });
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  // Ocultar menu en onboarding, hub, wizard y setup-wizard (experiencia limpia)
  const hideNav = ['/welcome', '/wizard', '/hub', '/smartcheck-wizard', '/setup-wizard'].includes(location.pathname);

  const [menuVisible, setMenuVisible] = useState(false);

  // Helper para redirigir segun estado de onboarding
  const getHomeRoute = () => {
    if (!isLoggedIn) return <Landing />;
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (!onboardingComplete) return <Navigate to="/welcome" />;
    return <Navigate to="/hub" />;
  };

  return (
    <>
      {isLoggedIn && !hideNav && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            // When collapsed, don't steal clicks from page buttons (Volver / Inicio).
            pointerEvents: menuVisible ? 'auto' : 'none',
          }}
          onMouseLeave={() => setMenuVisible(false)}
        >
          {!menuVisible && (
            <div
              style={{ height: 12, width: '100%', cursor: 'default', pointerEvents: 'auto' }}
              onMouseEnter={() => setMenuVisible(true)}
            />
          )}
          <nav
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: 20,
              background: '#fff',
              alignItems: 'center',
              flexWrap: 'wrap',
              transform: menuVisible ? 'translateY(0)' : 'translateY(-100%)',
              transition: 'transform 0.3s ease',
              pointerEvents: menuVisible ? 'auto' : 'none',
              position: menuVisible ? 'relative' : 'absolute',
              left: 0,
              right: 0,
              top: 0,
            }}
          >
            <Link to="/hub" style={{ textDecoration: 'none', color: '#635bff', fontWeight: 700 }}>🏠 {t('nav.home', 'Inicio')}</Link>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>{t('nav.dashboard')}</Link>
            <Link to="/statistics" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>{t('nav.statistics')}</Link>
            <Link to="/profitability" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>{t('nav.profitability')}</Link>
            <Link to="/revenue-control" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 600 }}>🔁 {t('nav.revenue')}</Link>
            <Link to="/dispute-tracker" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 600 }}>🎯 {t('nav.disputes')}</Link>
            <Link to="/mismatch-tracker" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 600 }}>🔍 {t('nav.mismatches')}</Link>
            <Link to="/communications" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 600 }}>📧 {t('nav.communications')}</Link>
            <Link to="/reconciliation" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>{t('nav.reconciliation')}</Link>
            <Link to="/payment-check" style={{ textDecoration: 'none', color: '#0f172a' }}>{t('nav.paymentCheck')}</Link>
            <Link to="/trial-report" style={{ textDecoration: 'none', color: '#4338ca', fontWeight: 600 }}>Ensayo</Link>
            <Link to="/reports" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>{t('nav.reports')}</Link>
            <Link to="/pricing" style={{ textDecoration: 'none', color: '#635bff', fontWeight: 600 }}>💎 {t('nav.pricing')}</Link>
            <Link to="/setup" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>{t('nav.setup')}</Link>
            <Link to="/tenant-selector" style={{ textDecoration: 'none', color: '#635bff', fontWeight: 500 }}>← {t('nav.switchStore')}</Link>
            <div style={{ flex: 1 }}></div>
            <button type="button" onClick={handleLogout} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>{t('nav.logout')}</button>
          </nav>
        </div>
      )}

      <div style={{ fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
        {isLoggedIn && !hideNav && <PilotBanner />}
        <Routes>
          <Route path="/" element={getHomeRoute()} />
          <Route path="/welcome" element={isLoggedIn ? <Welcome /> : <Navigate to="/login" />} />
          <Route path="/wizard" element={isLoggedIn ? <OnboardingWizard /> : <Navigate to="/login" />} />
          <Route path="/setup-wizard" element={isLoggedIn ? <SetupWizard /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
          {/* /app is the ClearView CTA entry into the product */}
          <Route
            path="/app"
            element={isLoggedIn ? <Navigate to="/hub" replace /> : <Navigate to="/login" replace />}
          />
          <Route path="/hub" element={isLoggedIn ? <PostLoginHub /> : <Navigate to="/login" replace />} />
          <Route path="/tenant-selector" element={isLoggedIn ? <TenantSelector /> : <Navigate to="/login" replace />} />
          <Route path="/tenants" element={<Navigate to="/tenant-selector" />} />
          <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/statistics" element={isLoggedIn ? <Statistics /> : <Navigate to="/login" replace />} />
          <Route path="/profitability" element={isLoggedIn ? <Profitability /> : <Navigate to="/login" replace />} />
          <Route path="/revenue-control" element={isLoggedIn ? <RevenueControl /> : <Navigate to="/login" replace />} />
          <Route path="/mismatch-tracker" element={isLoggedIn ? <MismatchTracker /> : <Navigate to="/login" replace />} />
          <Route path="/dispute-tracker" element={isLoggedIn ? <DisputeTracker /> : <Navigate to="/login" replace />} />
          <Route path="/communications" element={isLoggedIn ? <Communications /> : <Navigate to="/login" replace />} />
          <Route path="/reconciliation" element={isLoggedIn ? <SmartCheckStatus /> : <Navigate to="/login" replace />} />
          <Route path="/payment-check" element={isLoggedIn ? <PaymentCheck /> : <Navigate to="/login" replace />} />
          <Route path="/trial-report" element={isLoggedIn ? <TrialReport /> : <Navigate to="/login" replace />} />
          <Route path="/upload-center" element={<Navigate to="/smartcheck-wizard" />} />
          <Route path="/reports" element={isLoggedIn ? <Reports /> : <Navigate to="/login" replace />} />
          <Route path="/setup" element={isLoggedIn ? <Setup /> : <Navigate to="/login" replace />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/smartcheck-wizard" element={isLoggedIn ? <SmartCheckWizard /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
