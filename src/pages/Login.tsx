import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [role, setRole] = useState('self_owner');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = mode === 'login' ? 'login' : 'register';
    const body = mode === 'login' 
      ? { email, password }
      : { email, password, name, role };
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');
      
      localStorage.clear(); localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/tenants');
       } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 40, border: '1px solid #e2e8f0', borderRadius: 16, background: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>ClearFlow</h1>
      <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 32 }}>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>
      
      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>
        )}
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>I am a</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}>
              <option value="self_owner">Business Owner</option>
              <option value="accountant">Accountant / Tax Advisor</option>
            </select>
          </div>
        )}
        
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>❌ {error}</div>}
        
        <button type="submit" style={{ width: '100%', padding: '12px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 }}>
        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
        <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ color: '#635bff', fontWeight: 600, cursor: 'pointer' }}>
          {mode === 'login' ? 'Register' : 'Sign In'}
        </span>
      </p>
    </div>
  );
}
