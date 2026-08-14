import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import Profitability from './pages/Profitability';
import PaymentCheck from './pages/PaymentCheck';
import BankUpload from './pages/BankUpload';
import Setup from './pages/Setup';
import PaymentSuccess from './pages/PaymentSuccess';
import Login from './pages/Login';
import TenantSelector from './pages/TenantSelector';
import Reports from './pages/Reports';
import MismatchTracker from './pages/MismatchTracker';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      {isLoggedIn && (
        <nav style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 24, background: '#fff', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>Dashboard</Link>
          <Link to="/statistics" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>Statistics</Link>
          <Link to="/profitability" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>Profitability</Link>
          <Link to="/mismatch-tracker" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 600 }}>🔍 Mismatches</Link>
          <Link to="/payment-check" style={{ textDecoration: 'none', color: '#0f172a' }}>Payment Check</Link>
          <Link to="/bank-upload" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>Upload Center</Link>
          <Link to="/reports" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>Reports</Link>
          <Link to="/setup" style={{ textDecoration: 'none', color: '#0f172a', fontWeight: 500 }}>Setup</Link>
          <Link to="/tenant-selector" style={{ textDecoration: 'none', color: '#635bff', fontWeight: 500 }}>← Switch Store</Link>
          <div style={{ flex: 1 }}></div>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>Logout</button>
        </nav>
      )}

      <div style={{ fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
          <Route path="/tenant-selector" element={<TenantSelector />} />
          <Route path="/tenants" element={<Navigate to="/tenant-selector" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/profitability" element={<Profitability />} />
          <Route path="/mismatch-tracker" element={<MismatchTracker />} />
          <Route path="/payment-check" element={<PaymentCheck />} />
          <Route path="/bank-upload" element={<BankUpload />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
