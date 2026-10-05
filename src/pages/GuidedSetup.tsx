import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Kind = 'public' | 'online' | 'lodging';
type Structure = 'one' | 'several' | 'holding';
type AccountMode = 'own' | 'shared';
type Source = 'cards' | 'cash' | 'booking' | 'stripe';

interface Place {
  id: string;
  name: string;
  kind: Kind;
  companyIndex: number;
}

interface AccountDraft {
  id: string;
  placeIds: string[];
  bankName: string;
  iban: string;
  currency: string;
  sources: Source[];
  pending: boolean;
}

const KINDS: { value: Kind; label: string }[] = [
  { value: 'public', label: 'Negocio físico al público' },
  { value: 'online', label: 'Negocio online' },
  { value: 'lodging', label: 'Alojamiento' },
];

const SOURCES: { value: Source; label: string }[] = [
  { value: 'cards', label: 'Tarjetas' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'booking', label: 'Booking' },
  { value: 'stripe', label: 'Stripe' },
];

const STEPS = ['Negocios / Locales', 'Nombres', 'Empresas', 'Cuentas', 'Datos', 'Listo'];

const newId = () => Math.random().toString(36).slice(2, 10);

export default function GuidedSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [placeCount, setPlaceCount] = useState(1);
  const [places, setPlaces] = useState<Place[]>([{ id: newId(), name: '', kind: 'public', companyIndex: 0 }]);
  const [structure, setStructure] = useState<Structure>('one');
  const [holdingName, setHoldingName] = useState('');
  const [companyNames, setCompanyNames] = useState<string[]>(['']);
  const [accountMode, setAccountMode] = useState<AccountMode>('own');
  const [accounts, setAccounts] = useState<AccountDraft[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const companyCount = structure === 'one' ? 1 : Math.max(companyNames.length, 1);

  const setCount = (count: number) => {
    const next = Math.min(12, Math.max(1, count));
    setPlaceCount(next);
    setPlaces((current) => {
      const copy = current.slice(0, next);
      while (copy.length < next) copy.push({ id: newId(), name: '', kind: 'public', companyIndex: 0 });
      return copy;
    });
  };

  const setCompanyCount = (count: number) => {
    const next = Math.min(8, Math.max(2, count));
    setCompanyNames((current) => {
      const copy = current.slice(0, next);
      while (copy.length < next) copy.push('');
      return copy;
    });
    setPlaces((current) => current.map((place) => ({ ...place, companyIndex: Math.min(place.companyIndex, next - 1) })));
  };

  const emptyAccount = (): AccountDraft => ({
    id: newId(),
    placeIds: [],
    bankName: '',
    iban: '',
    currency: 'EUR',
    sources: [],
    pending: false,
  });

  const buildOwnAccounts = (): AccountDraft[] => places.map((place) => {
    const existing = accounts.find((account) => account.placeIds.length === 1 && account.placeIds[0] === place.id);
    if (existing) return existing;
    return {
      id: place.id,
      placeIds: [place.id],
      bankName: '',
      iban: '',
      currency: 'EUR',
      sources: [],
      pending: false,
    };
  });

  const goNext = () => {
    setError('');
    if (step === 1) {
      if (places.some((place) => !place.name.trim())) {
        setError('Ponle un nombre a cada negocio.');
        return;
      }
      const names = places.map((place) => place.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) {
        setError('Cada negocio necesita un nombre distinto.');
        return;
      }
    }
    if (step === 2) {
      const names = structure === 'one' ? companyNames.slice(0, 1) : companyNames;
      if (names.some((name) => !name.trim())) {
        setError('Ponle un nombre a cada empresa.');
        return;
      }
      if (structure === 'holding' && !holdingName.trim()) {
        setError('Ponle un nombre al grupo.');
        return;
      }
      if (structure !== 'one' && names.some((_, index) => !places.some((place) => place.companyIndex === index))) {
        setError('Cada empresa necesita al menos un negocio.');
        return;
      }
    }
    if (step === 3) {
      if (accountMode === 'own') {
        setAccounts(buildOwnAccounts());
      } else if (accounts.length === 0) {
        setAccounts([{ id: newId(), placeIds: [], bankName: '', iban: '', currency: 'EUR', sources: [], pending: false }]);
      }
      const draft = accountMode === 'own' ? buildOwnAccounts() : accounts;
      const covered = new Set(draft.flatMap((account) => account.placeIds));
      if (accountMode === 'shared' && places.some((place) => !covered.has(place.id))) {
        setError('Cada negocio tiene que estar en una cuenta.');
        return;
      }
      if (accountMode === 'shared' && draft.some((account) => account.placeIds.length === 0)) {
        setError('Cada cuenta tiene que cubrir al menos un negocio.');
        return;
      }
      if (accountMode === 'shared' && mixedCompanies(draft)) {
        setError('Una cuenta solo puede agrupar negocios de la misma empresa.');
        return;
      }
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const mixedCompanies = (draft: AccountDraft[]) => draft.some((account) => {
    const indexes = new Set(account.placeIds.map((id) => places.find((place) => place.id === id)?.companyIndex));
    return indexes.size > 1;
  });

  const missingDetails = useMemo(() => accounts.filter((account) => {
    if (account.pending) return false;
    return !account.bankName.trim() || !account.iban.trim() || account.sources.length === 0;
  }).length, [accounts]);

  const save = async () => {
    if (missingDetails > 0) {
      setError('Completa el banco, el IBAN y el tipo de dinero, o marca la cuenta como pendiente.');
      return;
    }
    setSaving(true);
    setError('');
    const names = structure === 'one' ? [companyNames[0] || 'Mi empresa'] : companyNames;
    const payload = {
      holding_name: structure === 'holding' ? holdingName.trim() : '',
      companies: names.map((name, index) => ({
        name: name.trim(),
        places: places.filter((place) => place.companyIndex === index).map((place) => ({
          name: place.name.trim(),
          kind: place.kind,
        })),
        accounts: accounts
          .filter((account) => account.placeIds.some((id) => places.find((place) => place.id === id)?.companyIndex === index))
          .map((account) => ({
            bank_name: account.bankName.trim(),
            iban: account.iban.trim(),
            currency: account.currency,
            sources: account.sources,
            pending: account.pending,
            place_names: account.placeIds
              .map((id) => places.find((place) => place.id === id)?.name.trim() || '')
              .filter(Boolean),
          })),
      })),
    };
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/companies/guided-setup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.detail === 'string' ? data.detail : 'No se pudo guardar la estructura');
        setSaving(false);
        return;
      }
      const first = data.companies?.[0];
      if (first) {
        localStorage.setItem('tenant', JSON.stringify({ id: first.id, name: first.name, role: 'owner' }));
      }
      localStorage.setItem('onboardingComplete', 'true');
      setSaved(true);
      setSaving(false);
    } catch {
      setError('No se pudo contactar el servidor.');
      setSaving(false);
    }
  };

  const togglePlace = (accountId: string, placeId: string) => {
    setAccounts((current) => current.map((account) => {
      const without = account.placeIds.filter((id) => id !== placeId);
      if (account.id !== accountId) return { ...account, placeIds: without };
      const has = account.placeIds.includes(placeId);
      return { ...account, placeIds: has ? without : [...without, placeId] };
    }));
  };

  const toggleSource = (accountId: string, source: Source) => {
    setAccounts((current) => current.map((account) => {
      if (account.id !== accountId) return account;
      const has = account.sources.includes(source);
      return { ...account, sources: has ? account.sources.filter((item) => item !== source) : [...account.sources, source] };
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', fontFamily: 'sans-serif', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {STEPS.map((label, index) => (
            <div key={label} style={{ flex: 1 }}>
              <div style={{ height: 6, borderRadius: 99, background: index <= step ? '#635bff' : '#e2e8f0' }} />
              <div style={{ fontSize: 11, color: index === step ? '#4338ca' : '#94a3b8', marginTop: 6, fontWeight: 700 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 8px 30px rgba(15,23,42,0.06)' }}>
          {step === 0 && (
            <>
              <h1 style={titleStyle}>¿Cuántos negocios cobran?</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
                <button aria-label="Menos negocios" onClick={() => setCount(placeCount - 1)} style={roundButton}>−</button>
                <div style={{ fontSize: 48, fontWeight: 800, minWidth: 72, textAlign: 'center' }}>{placeCount}</div>
                <button aria-label="Más negocios" onClick={() => setCount(placeCount + 1)} style={roundButton}>+</button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 style={titleStyle}>¿Cómo se llama cada negocio?</h1>
              <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
                {places.map((place, index) => (
                  <div key={place.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                    <input
                      aria-label={`Nombre del negocio ${index + 1}`}
                      value={place.name}
                      placeholder={`Negocio ${index + 1}`}
                      onChange={(event) => setPlaces((current) => current.map((item) => item.id === place.id ? { ...item, name: event.target.value } : item))}
                      style={fieldStyle}
                    />
                    <select
                      aria-label={`Tipo del negocio ${index + 1}`}
                      value={place.kind}
                      onChange={(event) => setPlaces((current) => current.map((item) => item.id === place.id ? { ...item, kind: event.target.value as Kind } : item))}
                      style={fieldStyle}
                    >
                      {KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={titleStyle}>¿Cómo están organizados?</h1>
              <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                <Choice title="Una sola empresa" body="Todos los negocios están en la misma empresa." selected={structure === 'one'} onClick={() => { setStructure('one'); setCompanyNames((current) => [current[0] || '']); }} />
                <Choice title="Varias empresas" body="Cada negocio pertenece a una empresa." selected={structure === 'several'} onClick={() => { setStructure('several'); setCompanyCount(Math.max(companyNames.length, 2)); }} />
                <Choice title="Un grupo con empresas" body="Hay un nombre de grupo, y empresas debajo." selected={structure === 'holding'} onClick={() => { setStructure('holding'); setCompanyCount(Math.max(companyNames.length, 2)); }} />
              </div>
              {structure === 'holding' && (
                <input aria-label="Nombre del grupo" value={holdingName} placeholder="Nombre del grupo" onChange={(event) => setHoldingName(event.target.value)} style={{ ...fieldStyle, marginTop: 16 }} />
              )}
              {structure !== 'one' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                  <span style={{ fontSize: 14, color: '#475569' }}>Empresas</span>
                  <button aria-label="Menos empresas" onClick={() => setCompanyCount(companyNames.length - 1)} style={smallRound}>−</button>
                  <strong>{companyNames.length}</strong>
                  <button aria-label="Más empresas" onClick={() => setCompanyCount(companyNames.length + 1)} style={smallRound}>+</button>
                </div>
              )}
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {(structure === 'one' ? companyNames.slice(0, 1) : companyNames).map((name, index) => (
                  <input
                    key={index}
                    aria-label={`Empresa ${index + 1}`}
                    value={name}
                    placeholder={structure === 'one' ? 'Nombre de la empresa' : `Empresa ${index + 1}`}
                    onChange={(event) => setCompanyNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    style={fieldStyle}
                  />
                ))}
              </div>
              {structure !== 'one' && (
                <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                  {places.map((place) => (
                    <label key={place.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center', fontSize: 14 }}>
                      <span>{place.name || 'Negocio'}</span>
                      <select
                        aria-label={`Empresa de ${place.name || 'negocio'}`}
                        value={place.companyIndex}
                        onChange={(event) => setPlaces((current) => current.map((item) => item.id === place.id ? { ...item, companyIndex: Number(event.target.value) } : item))}
                        style={fieldStyle}
                      >
                        {companyNames.map((name, index) => <option key={index} value={index}>{name || `Empresa ${index + 1}`}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h1 style={titleStyle}>¿Cómo son las cuentas?</h1>
              <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                <Choice title="Cada negocio tiene su cuenta" body="Un banco para cada negocio." selected={accountMode === 'own'} onClick={() => setAccountMode('own')} />
                <Choice title="Algunos negocios comparten cuenta" body="Varios negocios de la misma empresa usan la misma cuenta." selected={accountMode === 'shared'} onClick={() => { setAccountMode('shared'); setAccounts((current) => (current.length ? current : [emptyAccount()])); }} />
              </div>
              {accountMode === 'shared' && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span>Cuentas</span>
                    <button aria-label="Menos cuentas" onClick={() => setAccounts((current) => current.slice(0, Math.max(1, current.length - 1)))} style={smallRound}>−</button>
                    <strong>{Math.max(accounts.length, 1)}</strong>
                    <button aria-label="Más cuentas" onClick={() => setAccounts((current) => [...current, emptyAccount()])} style={smallRound}>+</button>
                  </div>
                  {accounts.map((account, index) => (
                    <div key={account.id} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Cuenta {index + 1}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {places.map((place) => {
                          const selected = account.placeIds.includes(place.id);
                          return (
                            <button
                              key={place.id}
                              onClick={() => togglePlace(account.id, place.id)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 999,
                                border: selected ? '1px solid #635bff' : '1px solid #e2e8f0',
                                background: selected ? '#eef2ff' : 'white',
                                color: selected ? '#4338ca' : '#334155',
                                cursor: 'pointer',
                              }}
                            >
                              {place.name || 'Local'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h1 style={titleStyle}>Datos de cada cuenta</h1>
              <p style={helpStyle}>{missingDetails === 0 ? 'Todas las cuentas tienen lo que hace falta.' : `Faltan ${missingDetails} cuenta${missingDetails === 1 ? '' : 's'}.`}</p>
              <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                {accounts.map((account, index) => {
                  const covered = places.filter((place) => account.placeIds.includes(place.id));
                  return (
                    <div key={account.id} style={{ padding: 14, border: '1px solid #e2e8f0', borderRadius: 12 }}>
                      <div style={{ fontWeight: 800 }}>Cuenta {index + 1}</div>
                      <div style={{ fontSize: 13, color: '#64748b', margin: '4px 0 10px' }}>{covered.map((place) => place.name).join(', ')}</div>
                      <input aria-label={`Banco de la cuenta ${index + 1}`} value={account.bankName} placeholder="Banco, por ejemplo Santander" disabled={account.pending} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, bankName: event.target.value } : item))} style={fieldStyle} />
                      <input aria-label={`IBAN de la cuenta ${index + 1}`} value={account.iban} placeholder="IBAN" disabled={account.pending} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, iban: event.target.value } : item))} style={{ ...fieldStyle, marginTop: 8 }} />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        {SOURCES.map((source) => {
                          const selected = account.sources.includes(source.value);
                          return (
                            <button key={source.value} disabled={account.pending} onClick={() => toggleSource(account.id, source.value)} style={{ padding: '8px 12px', borderRadius: 999, border: selected ? '1px solid #635bff' : '1px solid #e2e8f0', background: selected ? '#eef2ff' : 'white', cursor: 'pointer' }}>
                              {source.label}
                            </button>
                          );
                        })}
                      </div>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 14 }}>
                        <input type="checkbox" checked={account.pending} onChange={(event) => setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, pending: event.target.checked } : item))} />
                        Todavía no tengo esta cuenta
                      </label>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 style={titleStyle}>{saved ? 'Listo' : 'Así queda tu grupo'}</h1>
              {structure === 'holding' && holdingName && <div style={{ color: '#635bff', fontWeight: 800, marginBottom: 8 }}>{holdingName}</div>}
              {(structure === 'one' ? companyNames.slice(0, 1) : companyNames).map((name, index) => (
                <div key={index} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800 }}>{name}</div>
                  <div style={{ fontSize: 14, color: '#475569', marginTop: 6 }}>
                    {places.filter((place) => place.companyIndex === index).map((place) => place.name).join(' · ')}
                  </div>
                  {accounts.filter((account) => account.placeIds.some((id) => places.find((place) => place.id === id)?.companyIndex === index)).map((account) => (
                    <div key={account.id} style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
                      {account.pending ? 'Cuenta pendiente' : `${account.bankName} · ${account.iban}`} — {account.placeIds.map((id) => places.find((place) => place.id === id)?.name).join(', ')}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {error && <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button onClick={() => { setError(''); setStep((current) => Math.max(0, current - 1)); }} disabled={step === 0 || saved} style={secondaryButton}>Atrás</button>
            {step < 4 && <button onClick={goNext} style={primaryButton}>Continuar</button>}
            {step === 4 && <button onClick={goNext} style={primaryButton}>Ver el resumen</button>}
            {step === 5 && !saved && <button onClick={save} disabled={saving} style={primaryButton}>{saving ? 'Guardando...' : 'Guardar y entrar'}</button>}
            {step === 5 && saved && <button onClick={() => navigate('/hub')} style={primaryButton}>Ir al inicio</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Choice({ title, body, selected, onClick }: { title: string; body: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ textAlign: 'left', padding: 14, borderRadius: 12, border: selected ? '2px solid #635bff' : '1px solid #e2e8f0', background: selected ? '#f5f3ff' : 'white', cursor: 'pointer' }}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{body}</div>
    </button>
  );
}

const titleStyle = { margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' };
const helpStyle = { color: '#64748b', marginTop: 8 };
const fieldStyle = { width: '100%', boxSizing: 'border-box' as const, height: 42, padding: '0 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 };
const primaryButton = { padding: '12px 18px', borderRadius: 10, border: 'none', background: '#635bff', color: 'white', fontWeight: 800, cursor: 'pointer' };
const secondaryButton = { padding: '12px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer' };
const roundButton = { width: 48, height: 48, borderRadius: 24, border: '1px solid #c7d2fe', background: 'white', fontSize: 24, cursor: 'pointer' };
const smallRound = { width: 32, height: 32, borderRadius: 16, border: '1px solid #c7d2fe', background: 'white', cursor: 'pointer' };
