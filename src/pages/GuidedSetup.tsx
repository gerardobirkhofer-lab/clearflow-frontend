import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Kind = 'public' | 'online' | 'lodging';
type AccountMode = 'own' | 'shared';
type Source = 'cards' | 'cash' | 'booking' | 'stripe';

interface Place {
  id: string;
  name: string;
  kind: Kind;
  companyId: string;
}

interface CompanyDraft {
  id: string;
  name: string;
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

const MAX_COMPANIES = 8;
const OWN_COMPANY = '__own__';

const newId = () => Math.random().toString(36).slice(2, 10);

const joinNames = (names: string[]) => {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
};

const organizationSentence = (places: Place[], companies: CompanyDraft[]) => {
  const groups = companies
    .map((company) => places.filter((place) => place.companyId === company.id).map((place) => place.name.trim() || 'Negocio'))
    .filter((members) => members.length > 0);
  const placeCount = places.length;
  const companyCount = groups.length;
  if (placeCount <= 1) return 'Este negocio queda en su empresa.';
  if (companyCount <= 1) return `Los ${placeCount} negocios están en la misma empresa.`;
  if (companyCount === placeCount) return `Cada negocio es una empresa distinta. Son ${placeCount} empresas.`;
  const shared = groups.filter((members) => members.length > 1).map((members, index) => (
    index === 0 ? `${joinNames(members)} comparten empresa` : `${joinNames(members)} comparten otra`
  ));
  const alone = groups.filter((members) => members.length === 1).map((members) => members[0]);
  const tail = alone.length === 1
    ? `${alone[0]} va en la suya.`
    : alone.length > 1
      ? `${joinNames(alone)} van cada uno en la suya.`
      : '';
  return [`${placeCount} negocios en ${companyCount} empresas.`, ...shared.map((line) => `${line}.`), tail].filter(Boolean).join(' ');
};

export default function GuidedSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [placeCount, setPlaceCount] = useState(1);
  const [seed] = useState(() => {
    const companyId = newId();
    return {
      place: { id: newId(), name: '', kind: 'public' as Kind, companyId },
      company: { id: companyId, name: '' },
    };
  });
  const [places, setPlaces] = useState<Place[]>([seed.place]);
  const [companies, setCompanies] = useState<CompanyDraft[]>([seed.company]);
  const [companyMode, setCompanyMode] = useState<'separate' | 'mixed' | 'together'>('separate');
  const [accountMode, setAccountMode] = useState<AccountMode>('own');
  const [accounts, setAccounts] = useState<AccountDraft[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeCompanies = companies.filter((company) => places.some((place) => place.companyId === company.id));

  const setCount = (count: number) => {
    const next = Math.min(12, Math.max(1, count));
    const copy = places.slice(0, next);
    const added: CompanyDraft[] = [];
    while (copy.length < next) {
      const companyId = newId();
      copy.push({ id: newId(), name: '', kind: 'public', companyId });
      added.push({ id: companyId, name: '' });
    }
    const kept = new Set(copy.map((place) => place.companyId));
    setPlaceCount(next);
    setPlaces(copy);
    setCompanies([...companies.filter((company) => kept.has(company.id)), ...added]);
  };

  const companyNameFor = (companyId: string, fallback: string) => {
    const current = companies.find((company) => company.id === companyId)?.name.trim();
    return current || fallback.trim();
  };

  const splitAll = () => {
    if (places.length > MAX_COMPANIES) {
      setError('Por ahora puedes tener hasta 8 empresas. Junta algunos negocios en la misma empresa.');
      return false;
    }
    setError('');
    const nextCompanies: CompanyDraft[] = [];
    const nextPlaces = places.map((place) => {
      const mates = places.filter((item) => item.companyId === place.companyId);
      if (mates.length === 1) {
        nextCompanies.push({ id: place.companyId, name: companyNameFor(place.companyId, place.name) });
        return place;
      }
      const id = newId();
      nextCompanies.push({ id, name: place.name.trim() });
      return { ...place, companyId: id };
    });
    setCompanies(nextCompanies);
    setPlaces(nextPlaces);
    return true;
  };

  const chooseSeparate = () => {
    if (splitAll() !== false) setCompanyMode('separate');
  };

  const chooseMixed = () => {
    if (activeCompanies.length <= 1 && splitAll() === false) return;
    setError('');
    setCompanyMode('mixed');
  };

  const joinAll = () => {
    if (places.length === 0) return;
    setError('');
    const anchorId = places[0].companyId;
    setCompanies([{ id: anchorId, name: companyNameFor(anchorId, places[0].name) }]);
    setPlaces(places.map((place) => ({ ...place, companyId: anchorId })));
    setCompanyMode('together');
  };

  const modeAfterMove = (nextPlaces: Place[], nextCompanies: CompanyDraft[]) => {
    const count = nextCompanies.filter((company) => nextPlaces.some((place) => place.companyId === company.id)).length;
    if (nextPlaces.length <= 1 || count <= 1) return 'together' as const;
    if (count === nextPlaces.length) return 'separate' as const;
    return 'mixed' as const;
  };

  const movePlace = (placeId: string, targetCompanyId: string) => {
    const place = places.find((item) => item.id === placeId);
    if (!place || place.companyId === targetCompanyId) return;
    setError('');
    if (targetCompanyId === OWN_COMPANY) {
      if (activeCompanies.length >= MAX_COMPANIES) {
        setError('Por ahora puedes tener hasta 8 empresas. Junta algunos negocios en la misma empresa.');
        return;
      }
      const id = newId();
      const nextPlaces = places.map((item) => item.id === placeId ? { ...item, companyId: id } : item);
      const nextCompanies = [
        ...companies.filter((company) => nextPlaces.some((item) => item.companyId === company.id)),
        { id, name: place.name.trim() },
      ];
      setPlaces(nextPlaces);
      setCompanies(nextCompanies);
      setCompanyMode(modeAfterMove(nextPlaces, nextCompanies));
      return;
    }
    const nextPlaces = places.map((item) => item.id === placeId ? { ...item, companyId: targetCompanyId } : item);
    const nextCompanies = companies.filter((company) => nextPlaces.some((item) => item.companyId === company.id));
    setPlaces(nextPlaces);
    setCompanies(nextCompanies);
    setCompanyMode(modeAfterMove(nextPlaces, nextCompanies));
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
    if (step === 1) {
      setCompanies((current) => current.map((company) => {
        if (company.name.trim()) return company;
        const member = places.find((place) => place.companyId === company.id);
        return { ...company, name: member?.name.trim() || '' };
      }));
    }
    if (step === 2) {
      if (activeCompanies.length > MAX_COMPANIES) {
        setError('Por ahora puedes tener hasta 8 empresas. Junta algunos negocios en la misma empresa.');
        return;
      }
      if (activeCompanies.some((company) => !company.name.trim())) {
        setError('Ponle un nombre a cada empresa.');
        return;
      }
      const names = activeCompanies.map((company) => company.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) {
        setError('Cada empresa necesita un nombre distinto.');
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
    const ids = new Set(account.placeIds.map((id) => places.find((place) => place.id === id)?.companyId));
    return ids.size > 1;
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
    const payload = {
      holding_name: '',
      companies: activeCompanies.map((company) => ({
        name: company.name.trim(),
        places: places.filter((place) => place.companyId === company.id).map((place) => ({
          name: place.name.trim(),
          kind: place.kind,
        })),
        accounts: accounts
          .filter((account) => account.placeIds.some((id) => places.find((place) => place.id === id)?.companyId === company.id))
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
              <h1 style={titleStyle}>¿De qué empresa es cada negocio?</h1>
              <p style={helpStyle}>Junta solo los que compartan empresa. El resto se queda cada uno en la suya.</p>
              {places.length > 1 && (
                <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                  <Choice title="Cada negocio es una empresa distinta" body="Ninguno comparte empresa con otro." selected={companyMode === 'separate'} onClick={chooseSeparate} />
                  <Choice title="Algunos comparten empresa y otros no" body="Por ejemplo, dos negocios en una empresa y los otros cada uno en la suya." selected={companyMode === 'mixed'} onClick={chooseMixed} />
                  <Choice title="Todos en la misma empresa" body="Un solo nombre de empresa para todos los negocios." selected={companyMode === 'together'} onClick={joinAll} />
                </div>
              )}
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {activeCompanies.map((company) => {
                  const members = places.filter((place) => place.companyId === company.id);
                  return (
                    <div key={company.id} style={{ padding: 14, border: '1px solid #e2e8f0', borderRadius: 12 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Nombre de la empresa</label>
                      <input
                        aria-label={`Nombre de la empresa de ${members.map((place) => place.name).join(', ')}`}
                        value={company.name}
                        placeholder="Nombre legal de la empresa"
                        onChange={(event) => setCompanies((current) => current.map((item) => item.id === company.id ? { ...item, name: event.target.value } : item))}
                        style={fieldStyle}
                      />
                      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                        {members.map((place) => (
                          <div key={place.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>{place.name}</span>
                            {places.length > 1 && (
                              <select
                                aria-label={`Dónde queda ${place.name}`}
                                value={company.id}
                                onChange={(event) => movePlace(place.id, event.target.value)}
                                style={fieldStyle}
                              >
                                <option value={company.id}>Se queda en esta empresa</option>
                                {activeCompanies.filter((other) => other.id !== company.id).map((other) => (
                                  <option key={other.id} value={other.id}>Juntar con {other.name || 'otra empresa'}</option>
                                ))}
                                {members.length > 1 && <option value={OWN_COMPANY}>Separar en su propia empresa</option>}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div aria-live="polite" style={{ marginTop: 16, padding: 12, borderRadius: 12, background: '#f8fafc', color: '#0f172a', fontWeight: 700 }}>
                {companyMode === 'mixed' && activeCompanies.length === places.length
                  ? 'Junta los que compartan empresa. Los demás se quedan cada uno en la suya.'
                  : organizationSentence(places, activeCompanies)}
              </div>
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
                              {place.name || 'Negocio'}
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
              <p style={helpStyle}>{organizationSentence(places, activeCompanies)}</p>
              {activeCompanies.map((company) => (
                <div key={company.id} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800 }}>{company.name}</div>
                  <div style={{ fontSize: 14, color: '#475569', marginTop: 6 }}>
                    {places.filter((place) => place.companyId === company.id).map((place) => place.name).join(' · ')}
                  </div>
                  {accounts.filter((account) => account.placeIds.some((id) => places.find((place) => place.id === id)?.companyId === company.id)).map((account) => (
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
