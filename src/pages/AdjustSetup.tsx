import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

type Site = { id: string; name: string; kind: string; active: boolean };
type Company = { id: string; name: string; sites: Site[] };

const KINDS = [
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'bar', label: 'Bar' },
  { value: 'chiringuito', label: 'Chiringuito' },
  { value: 'public', label: 'Local' },
  { value: 'online', label: 'Online' },
  { value: 'lodging', label: 'Alojamiento' },
  { value: 'apartments', label: 'Apartamentos' },
];

export default function AdjustSetup() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('restaurant');
  const [rate, setRate] = useState('');
  const [error, setError] = useState('');
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json',
  };

  const load = async () => {
    const response = await fetch(`${API}/api/v1/companies`, { headers });
    const data = await response.json();
    setCompanies(data.items || []);
    const profile = await fetch(`${API}/api/v1/account/profile`, { headers });
    if (profile.ok) {
      const body = await profile.json();
      const saved = body?.payload?.debt_rate_percent;
      if (saved != null) setRate(String(saved));
    }
  };

  useEffect(() => {
    load().catch(() => setError('No se pudo leer el grupo.'));
  }, []);

  const add = async (companyId: string) => {
    setError('');
    const response = await fetch(`${API}/api/v1/companies/${companyId}/sites`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, kind }),
    });
    if (!response.ok) {
      setError('No se pudo dar de alta el local.');
      return;
    }
    setName('');
    await load();
  };

  const patch = async (companyId: string, siteId: string, body: object) => {
    setError('');
    const response = await fetch(`${API}/api/v1/companies/${companyId}/sites/${siteId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) setError('No se pudo guardar el cambio.');
    await load();
  };

  const saveRate = async () => {
    const profileRes = await fetch(`${API}/api/v1/account/profile`, { headers });
    const profile = profileRes.ok ? await profileRes.json() : { payload: {} };
    const payload = { ...(profile.payload || {}), debt_rate_percent: rate === '' ? null : Number(rate) };
    await fetch(`${API}/api/v1/account/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ payload, onboarding_complete: true }),
    });
  };

  return (
    <main style={{ minHeight: '100vh', background: '#eef2ff', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 16px 72px' }}>
        <Link to="/panel" style={{ color: '#635bff', fontWeight: 700, textDecoration: 'none' }}>Volver al chequeo</Link>
        <h1 style={{ margin: '16px 0 8px', fontSize: 32 }}>Cambiar/Ajustar setup</h1>
        <p style={{ color: '#475569' }}>Alta de un local, cambio de nombre, o baja si lo vendes. El alta del grupo no se vuelve a recorrer.</p>
        {error && <p style={{ color: '#991b1b' }}>{error}</p>}
        {companies.map((company) => (
          <section key={company.id} style={{ background: 'white', borderRadius: 16, padding: 20, marginTop: 16 }}>
            <h2 style={{ margin: 0 }}>{company.name}</h2>
            {company.sites.map((site) => (
              <div key={site.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <strong>{site.name}</strong>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{site.active ? 'Activo' : 'De baja'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => {
                    const next = window.prompt('Nombre del local', site.name);
                    if (next && next.trim()) patch(company.id, site.id, { name: next.trim() });
                  }} style={quiet}>Modificar</button>
                  <button type="button" onClick={() => patch(company.id, site.id, { active: !site.active })} style={quiet}>
                    {site.active ? 'Dar de baja' : 'Volver a activar'}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <input aria-label="Nombre del local nuevo" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del local nuevo" style={field} />
              <select aria-label="Tipo de local" value={kind} onChange={(event) => setKind(event.target.value)} style={field}>
                {KINDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <button type="button" onClick={() => add(company.id)} style={primary}>Dar de alta</button>
            </div>
          </section>
        ))}
        <section style={{ background: 'white', borderRadius: 16, padding: 20, marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Tipo para el coste de un retraso</h2>
          <p style={{ color: '#64748b' }}>Un porcentaje anual. Se aplica solo a los euros que llegaron tarde.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input aria-label="Tipo anual" value={rate} onChange={(event) => setRate(event.target.value)} inputMode="decimal" placeholder="15" style={field} />
            <button type="button" onClick={saveRate} style={primary}>Guardar tipo</button>
          </div>
        </section>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 18 }}>
          <Link to="/conexiones" style={{ color: '#635bff', fontWeight: 700 }}>Conexiones</Link>
          <Link to="/seteo" style={{ color: '#635bff', fontWeight: 700 }}>Seteo</Link>
          <Link to="/flujo" style={{ color: '#635bff', fontWeight: 700 }}>Erogaciones</Link>
          <Link to="/contrato" style={{ color: '#635bff', fontWeight: 700 }}>Contratos</Link>
          <Link to="/horizonte" style={{ color: '#635bff', fontWeight: 700 }}>Horizonte</Link>
        </div>
      </div>
    </main>
  );
}

const field = { padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 };
const primary = { padding: '10px 14px', borderRadius: 10, border: 'none', background: '#635bff', color: 'white', fontWeight: 800, cursor: 'pointer' };
const quiet = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer' };
