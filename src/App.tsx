import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Landing from './pages/Landing';
import Welcome from './pages/Welcome';
import OnboardingWizard from './pages/OnboardingWizard';
import Hub from './pages/Hub';
import PostLoginHub from './pages/PostLoginHub';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import Profitability from './pages/Profitability';
import RevenueControl from './pages/RevenueControl';
import PaymentCheck from './pages/PaymentCheck';
import DocUploadCenter from './pages/DocUploadCenter';
import Setup from './pages/Setup';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Login from './pages/Login';
import TenantSelector from './pages/TenantSelector';
import Reports from './pages/Reports';
import MismatchTracker from './pages/MismatchTracker';
import SmartCheckStatus from './pages/SmartCheckStatus';
import Pricing from './pages/Pricing';
import DisputeTracker from './pages/DisputeTracker';
import Communications from './pages/Communications';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const { t } = useTranslation();
  const location = useLocation();

  // Re-check auth on every route change (fixes navbar disappearing)
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  // Ocultar menú en onboarding (primera vez)
  const hideNav = location.pathname === '/welcome' || location.pathname === '/wizard';

  // Helper para redirigir según estado de onboarding
  const getHomeRoute = () => {
    if (!isLoggedIn) return <Landing />;
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (!onboardingComplete) return <Navigate to="/welcome" />;
    return <Navigate to="/hub" />;
  };

  return (
    <>
      {isLoggedIn && !hideNav && (
        <nav style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 20, background: '#fff', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <Link to="/upload-center" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>{t('nav.uploadCenter')}</Link>
          <Link to="/reports" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>{t('nav.reports')}</Link>
          <Link to="/pricing" style={{ textDecoration: 'none', color: '#635bff', fontWeight: 600 }}>💎 {t('nav.pricing')}</Link>
          <Link to="/setup" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>{t('nav.setup')}</Link>
          <Link to="/tenant-selector" style={{ textDecoration: 'none', color: '#635bff', fontWeight: 500 }}>← {t('nav.switchStore')}</Link>
          <div style={{ flex: 1 }}></div>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>{t('nav.logout')}</button>
        </nav>
      )}

      <div style={{ fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={getHomeRoute()} />
          <Route path="/welcome" element={isLoggedIn ? <Welcome /> : <Navigate to="/login" />} />
          <Route path="/wizard" element={isLoggedIn ? <OnboardingWizard /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
          <Route path="/hub" element={<PostLoginHub />} />
          <Route path="/tenant-selector" element={<TenantSelector />} />
          <Route path="/tenants" element={<Navigate to="/tenant-selector" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/profitability" element={<Profitability />} />
          <Route path="/revenue-control" element={<RevenueControl />} />
          <Route path="/mismatch-tracker" element={<MismatchTracker />} />
          <Route path="/dispute-tracker" element={<DisputeTracker />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/reconciliation" element={<SmartCheckStatus />} />
          <Route path="/payment-check" element={<PaymentCheck />} />
          <Route path="/upload-center" element={<DocUploadCenter />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="*" element={<Navigate to="/" />} />
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
