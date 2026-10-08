import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Site {
  id: string;
  name: string;
  kind: string;
}

interface Company {
  id: string;
  name: string;
  role?: string;
  sites?: Site[];
}

const KINDS = [
  { value: 'public', label: 'Negocio físico al público' },
  { value: 'online', label: 'Negocio online' },
  { value: 'lodging', label: 'Alojamiento' },
];

const KIND_LABELS: Record<string, string> = {
  public: 'Negocio físico al público',
  online: 'Negocio online',
  lodging: 'Alojamiento',
  restaurant: 'Negocio físico al público',
  bar: 'Negocio físico al público',
  chiringuito: 'Negocio físico al público',
  apartments: 'Alojamiento',
};

const kindLabel = (kind: string) => KIND_LABELS[kind] || kind;

const api = import.meta.env.VITE_API_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  'Content-Type': 'application/json',
});

export default function TenantSelector() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const savedTenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [siteDrafts, setSiteDrafts] = useState<Record<string, { name: string; kind: string }>>({});
  const [managerDrafts, setManagerDrafts] = useState<Record<string, { name: string; email: string; password: string }>>({});
  const [message, setMessage] = useState('');

  const load = () => {
    fetch(`${api}/api/v1/companies`, { headers: authHeaders() })
      .then((response) => response.json())
      .then((data) => {
        setCompanies(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    load();
  }, []);

  const openCompany = (company: Company) => {
    localStorage.setItem('tenant', JSON.stringify({ id: company.id, name: company.name, role: company.role }));
    navigate('/hub');
  };

  const createCompany = async () => {
    if (!companyName.trim()) return;
    const response = await fetch(`${api}/api/v1/companies`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: companyName.trim() }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.detail || 'No se pudo crear la empresa');
      return;
    }
    setCompanyName('');
    setMessage('');
    load();
  };

  const addSite = async (companyId: string) => {
    const draft = siteDrafts[companyId] || { name: '', kind: 'public' };
    if (!draft.name.trim()) return;
    const response = await fetch(`${api}/api/v1/companies/${companyId}/sites`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: draft.name.trim(), kind: draft.kind }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.detail || 'No se pudo añadir el negocio');
      return;
    }
    setSiteDrafts((current) => ({ ...current, [companyId]: { name: '', kind: draft.kind } }));
    setMessage('');
    load();
  };

  const addManager = async (companyId: string) => {
    const draft = managerDrafts[companyId] || { name: '', email: '', password: '' };
    const response = await fetch(`${api}/api/v1/companies/${companyId}/members`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(draft),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(typeof data.detail === 'string' ? data.detail : 'No se pudo crear el encargado');
      return;
    }
    setManagerDrafts((current) => ({ ...current, [companyId]: { name: '', email: '', password: '' } }));
    setMessage(`Encargado ${data.name} puede entrar solo en esta empresa.`);
  };

  const canCreate = companies.some((company) => company.role !== 'manager');

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Empresas de {user.name || 'tu cuenta'}</h1>
          <p style={{ margin: 0, color: '#64748b' }}>
            Cada empresa tiene sus propios negocios y sus propios cobros. Un encargado solo abre la empresa que le des.
          </p>
        </div>
        {savedTenant && (
          <button onClick={() => openCompany(savedTenant)} style={secondaryButton}>↩ Volver a {savedTenant.name}</button>
        )}
      </div>

      {message && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: '#eef2ff', color: '#3730a3' }}>{message}</div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {companies.map((company) => {
          const siteDraft = siteDrafts[company.id] || { name: '', kind: 'public' };
          const managerDraft = managerDrafts[company.id] || { name: '', email: '', password: '' };
          const isOwner = company.role !== 'manager';
          return (
            <div key={company.id} style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{company.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{isOwner ? 'Propietario' : 'Encargado'}</div>
                </div>
                <button onClick={() => openCompany(company)} style={primaryButton}>Entrar</button>
              </div>

              <div style={{ marginTop: 16 }}>
                {(company.sites || []).length === 0 ? (
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>Todavía no hay negocios.</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(company.sites || []).map((site) => (
                      <span key={site.id} style={{ padding: '6px 10px', borderRadius: 999, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13 }}>
                        {site.name} · {kindLabel(site.kind)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isOwner && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Añadir negocio</div>
                    <input
                      value={siteDraft.name}
                      onChange={(event) => setSiteDrafts((current) => ({ ...current, [company.id]: { ...siteDraft, name: event.target.value } }))}
                      placeholder="Nombre del negocio"
                      style={fieldStyle}
                    />
                    <select
                      value={siteDraft.kind}
                      onChange={(event) => setSiteDrafts((current) => ({ ...current, [company.id]: { ...siteDraft, kind: event.target.value } }))}
                      style={{ ...fieldStyle, marginTop: 8 }}
                    >
                      {KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                    </select>
                    <button onClick={() => addSite(company.id)} style={{ ...secondaryButton, marginTop: 8 }}>Añadir negocio</button>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Añadir encargado</div>
                    <input value={managerDraft.name} onChange={(event) => setManagerDrafts((current) => ({ ...current, [company.id]: { ...managerDraft, name: event.target.value } }))} placeholder="Nombre" style={fieldStyle} />
                    <input value={managerDraft.email} onChange={(event) => setManagerDrafts((current) => ({ ...current, [company.id]: { ...managerDraft, email: event.target.value } }))} placeholder="Correo" style={{ ...fieldStyle, marginTop: 8 }} />
                    <input type="password" value={managerDraft.password} onChange={(event) => setManagerDrafts((current) => ({ ...current, [company.id]: { ...managerDraft, password: event.target.value } }))} placeholder="Contraseña (mín. 10)" style={{ ...fieldStyle, marginTop: 8 }} />
                    <button onClick={() => addManager(company.id)} style={{ ...secondaryButton, marginTop: 8 }}>Crear encargado</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canCreate && (
        <div style={{ marginTop: 20, padding: 20, borderRadius: 12, border: '1px dashed #cbd5e1', background: '#f8fafc' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Nueva empresa</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Ej. Chiringuitos Sur" style={{ ...fieldStyle, flex: 1, minWidth: 220 }} />
            <button onClick={createCompany} style={primaryButton}>Crear empresa</button>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  height: 40,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
};

const primaryButton = {
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#635bff',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButton = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #c7d2fe',
  background: 'white',
  color: '#4338ca',
  fontWeight: 700,
  cursor: 'pointer',
};
