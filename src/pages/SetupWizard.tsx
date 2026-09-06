import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Society {
  id: string;
  name: string;
  nif: string;
  address: string;
  city: string;
  province: string;
}

interface Store {
  id: string;
  societyId: string;
  name: string;
  type: string;
  company: string;
  address: string;
  nif: string;
  city: string;
  province: string;
}

interface ProviderConfig {
  id: string;
  name: string;
  email: string;
  fee_percent: string;
  fee_fixed: string;
  has_iva: boolean;
  iva_percent: string;
  monthly_fee: string;
  payout_days: string;
  is_virtual_account: boolean;
  transfer_days: string;
  transfer_threshold: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  iban: string;
  account_number: string;
  assigned_store_ids: string[];
}

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [societyCount, setSocietyCount] = useState(1);
  const [societies, setSocieties] = useState<Society[]>([{ id: '1', name: '', nif: '', address: '', city: '', province: '' }]);
  const [storeCount, setStoreCount] = useState(1);
  const [stores, setStores] = useState<Store[]>([{ id: '1', societyId: '1', name: '', type: '', company: '', address: '', nif: '', city: '', province: '' }]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderConfig>>({});
  const [bankMode, setBankMode] = useState<'shared' | 'separate'>('shared');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cloudChoice, setCloudChoice] = useState('clearflow');
  const totalSteps = 8;
  const [societySubStep, setSocietySubStep] = useState(0);
  const [storeSubStep, setStoreSubStep] = useState(0);

  // Auto-initialize bank accounts when reaching step 6 if empty
  useEffect(() => {
    if (step === 6 && bankAccounts.length === 0 && stores.length > 0) {
      setBankMode('shared');
      setBankAccounts([{
        id: '1',
        bank_name: '',
        account_name: 'Cuenta Principal',
        iban: '',
        account_number: '',
        assigned_store_ids: stores.map(s => s.id),
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Auto-initialize bank accounts when reaching step 6 if empty
  useEffect(() => {
    if (step === 6 && bankAccounts.length === 0 && stores.length > 0) {
      setBankMode('shared');
      setBankAccounts([{
        id: '1',
        bank_name: '',
        account_name: 'Cuenta Principal',
        iban: '',
        account_number: '',
        assigned_store_ids: stores.map(s => s.id),
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const providerOptions = [
    { id: 'stripe', name: 'Stripe', icon: '💳' },
    { id: 'redsys', name: 'TPV / Redsys', icon: '🏧' },
    { id: 'mercadopago', name: 'Mercado Pago', icon: '💰' },
    { id: 'tpv', name: 'TPV Físico', icon: '📠' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
    { id: 'sumup', name: 'SumUp', icon: '🔷' },
  ];

  // Load existing setup
  useEffect(() => {
    const saved = localStorage.getItem('clearflowSetup');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.societies) setSocieties(s.societies);
        if (s.societyCount) setSocietyCount(s.societyCount);
        if (s.stores) setStores(s.stores);
        if (s.storeCount) setStoreCount(s.storeCount);
        if (s.selectedProviders) setSelectedProviders(s.selectedProviders);
        if (s.providerConfigs) setProviderConfigs(s.providerConfigs);
        if (s.bankMode) setBankMode(s.bankMode);
        if (s.bankAccounts) setBankAccounts(s.bankAccounts);
        if (s.cloudChoice) setCloudChoice(s.cloudChoice);
      } catch {}
    }
  }, []);

  const saveSetup = (partial: any = {}) => {
    const existing = JSON.parse(localStorage.getItem('clearflowSetup') || '{}');
    const updated = {
      ...existing,
      societies,
      societyCount,
      stores,
      storeCount,
      selectedProviders,
      providerConfigs,
      bankMode,
      bankAccounts,
      cloudChoice,
      ...partial,
    };
    localStorage.setItem('clearflowSetup', JSON.stringify(updated));
  };

  const updateSociety = (index: number, field: keyof Society, value: string) => {
    const updated = [...societies];
    updated[index] = { ...updated[index], [field]: value };
    setSocieties(updated);
  };

  const handleSocietyCountChange = (count: number) => {
    setSocietyCount(count);
    const newSocieties: Society[] = [];
    for (let i = 0; i < count; i++) {
      newSocieties.push(societies[i] || { id: String(i + 1), name: '', nif: '', address: '', city: '', province: '' });
    }
    setSocieties(newSocieties);
  };

  const updateStore = (index: number, field: keyof Store, value: string) => {
    const updated = [...stores];
    updated[index] = { ...updated[index], [field]: value };
    setStores(updated);
  };

  const handleStoreCountChange = (count: number) => {
    setStoreCount(count);
    const newStores: Store[] = [];
    for (let i = 0; i < count; i++) {
      const existing = stores[i];
      // Round-robin assign society: store 0 → society 0, store 1 → society 1, etc.
      const societyIdx = societies.length > 0 ? i % societies.length : 0;
      const defaultSocietyId = societies[societyIdx]?.id || '1';
      newStores.push(existing || { id: String(i + 1), societyId: defaultSocietyId, name: '', type: '', company: '', address: '', nif: '', city: '', province: '' });
    }
    setStores(newStores);
  };

  const toggleProvider = (id: string) => {
    setSelectedProviders(prev => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter(p => p !== id) : [...prev, id];
      if (!exists) {
        setProviderConfigs(cf => ({
          ...cf,
          [id]: { id, name: providerOptions.find(p => p.id === id)?.name || id, email: '', fee_percent: '', fee_fixed: '', has_iva: false, iva_percent: '21', monthly_fee: '0', payout_days: '3', is_virtual_account: false, transfer_days: '2', transfer_threshold: '100' },
        }));
      }
      return updated;
    });
  };

  const updateProviderConfig = (id: string, field: keyof ProviderConfig, value: any) => {
    setProviderConfigs(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleBankModeChange = (mode: 'shared' | 'separate') => {
    setBankMode(mode);
    const count = mode === 'shared' ? 1 : stores.length;
    const newAccounts: BankAccount[] = [];
    for (let i = 0; i < count; i++) {
      const existing = bankAccounts[i];
      newAccounts.push(existing || {
        id: String(i + 1),
        bank_name: '',
        account_name: mode === 'shared' ? 'Cuenta Principal' : `Cuenta ${stores[i]?.name || 'Tienda ' + (i + 1)}`,
        iban: '',
        account_number: '',
        assigned_store_ids: mode === 'shared' ? stores.map(s => s.id) : [stores[i]?.id],
      });
    }
    setBankAccounts(newAccounts);
  };

  const updateBankAccount = (index: number, field: keyof BankAccount, value: any) => {
    const updated = [...bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setBankAccounts(updated);
  };

  const nextStep = () => {
    saveSetup();
    if (step === 1 && societySubStep < societies.length - 1) {
      setSocietySubStep(societySubStep + 1);
    } else if (step === 2 && storeSubStep < stores.length - 1) {
      setStoreSubStep(storeSubStep + 1);
    } else if (step < totalSteps) {
      setStep(step + 1);
      setSocietySubStep(0);
      setStoreSubStep(0);
    } else {
      localStorage.setItem('onboardingComplete', 'true');
      saveSetup({ completedAt: new Date().toISOString() });
      navigate('/hub');
    }
  };

  const prevStep = () => {
    if (step === 1 && societySubStep > 0) {
      setSocietySubStep(societySubStep - 1);
    } else if (step === 2 && storeSubStep > 0) {
      setStoreSubStep(storeSubStep - 1);
    } else if (step > 1) {
      setStep(step - 1);
      if (step === 2) setSocietySubStep(societies.length - 1);
      if (step === 3) setStoreSubStep(stores.length - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: {
        const s = societies[societySubStep];
        return s && s.name.trim() && s.nif.trim();
      }
      case 2: {
        const st = stores[storeSubStep];
        return st && st.name.trim() && st.address.trim() && st.nif.trim() && st.societyId;
      }
      case 3: return selectedProviders.length > 0;
      case 4: return selectedProviders.every(id => {
        const c = providerConfigs[id];
        return c && c.email.trim() && c.fee_percent.trim() && c.payout_days.trim();
      });
      case 5: return true;
      case 6: return bankAccounts.length > 0 && bankAccounts.every(b => b.bank_name.trim() && b.iban.trim());
      case 7: return true;
      default: return true;
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a', minHeight: '100vh' }}>
      {/* Progress */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Configuración de ClearFlow</h1>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Paso {step} de {totalSteps}</span>
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#635bff', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* STEP 1: Sociedades - una por pantalla */}
      {step === 1 && (
        <div>
          {societySubStep === 0 && societies.length === 1 && !societies[0].name && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>¿Cuántas sociedades o grupos legales tienes?</h2>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Indica el número total. Puedes tener hasta 20 sociedades.</p>
              <div style={{ marginBottom: 32 }}>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={societyCount || ''}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') { handleSocietyCountChange(1); return; }
                    const count = Math.max(1, Math.min(20, parseInt(raw) || 1));
                    handleSocietyCountChange(count);
                  }}
                  style={{ width: 120, padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                />
              </div>
            </>
          )}

          {societies.length > 0 && (
            <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#635bff', textTransform: 'uppercase', margin: 0 }}>
                  Sociedad / Grupo Legal #{societySubStep + 1}
                </h3>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{societySubStep + 1} de {societies.length}</span>
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Razón social</label>
                    <input value={societies[societySubStep]?.name || ''} onChange={e => updateSociety(societySubStep, 'name', e.target.value)} placeholder="Ej: Pura Gastronomía S.L." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>NIF / CIF</label>
                    <input value={societies[societySubStep]?.nif || ''} onChange={e => updateSociety(societySubStep, 'nif', e.target.value)} placeholder="B-12345678" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Dirección fiscal</label>
                  <input value={societies[societySubStep]?.address || ''} onChange={e => updateSociety(societySubStep, 'address', e.target.value)} placeholder="Calle y número" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Ciudad</label>
                    <input value={societies[societySubStep]?.city || ''} onChange={e => updateSociety(societySubStep, 'city', e.target.value)} placeholder="Málaga" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Provincia</label>
                    <input value={societies[societySubStep]?.province || ''} onChange={e => updateSociety(societySubStep, 'province', e.target.value)} placeholder="Málaga" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mini navegación rápida entre sociedades */}
          {societies.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {societies.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSocietySubStep(i)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: i === societySubStep ? '2px solid #635bff' : '1px solid #e2e8f0',
                    background: i === societySubStep ? '#635bff' : societies[i]?.name.trim() ? '#f0fdf4' : 'white',
                    color: i === societySubStep ? 'white' : societies[i]?.name.trim() ? '#166534' : '#64748b',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                  title={`Sociedad ${i + 1}${societies[i]?.name.trim() ? '' : ' (incompleta)'}`}
                >
                  {societies[i]?.name.trim() ? '✓' : i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Tiendas - una por pantalla */}
      {step === 2 && (
        <div>
          {storeSubStep === 0 && stores.length === 1 && !stores[0].name && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>¿Cuántas tiendas o negocios tienes?</h2>
              <p style={{ color: '#64748b', marginBottom: 24 }}>Indica el número total de locales, restaurantes o tiendas online. Puedes tener hasta 50.</p>
              <div style={{ marginBottom: 32 }}>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={storeCount || ''}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') { handleStoreCountChange(1); return; }
                    const count = Math.max(1, Math.min(50, parseInt(raw) || 1));
                    handleStoreCountChange(count);
                  }}
                  style={{ width: 120, padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 18, fontWeight: 700, textAlign: 'center' }}
                />
              </div>
            </>
          )}

          {stores.length > 0 && (
            <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#635bff', textTransform: 'uppercase', margin: 0 }}>
                  Tienda / Negocio #{storeSubStep + 1}
                </h3>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{storeSubStep + 1} de {stores.length}</span>
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Nombre del negocio</label>
                    <input value={stores[storeSubStep]?.name || ''} onChange={e => updateStore(storeSubStep, 'name', e.target.value)} placeholder="Ej: Pura Zona Norte" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Sociedad a la que pertenece</label>
                    <select value={stores[storeSubStep]?.societyId || ''} onChange={e => updateStore(storeSubStep, 'societyId', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}>
                      <option value="">Seleccionar sociedad...</option>
                      {societies.map(s => (
                        <option key={s.id} value={s.id}>{s.name || `Sociedad ${s.id}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Tipo de negocio</label>
                    <select value={stores[storeSubStep]?.type || ''} onChange={e => updateStore(storeSubStep, 'type', e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}>
                      <option value="">Seleccionar...</option>
                      <option value="restaurant">Restaurante físico</option>
                      <option value="bar">Bar / Cafetería</option>
                      <option value="online">Tienda online</option>
                      <option value="delivery">Delivery / Takeaway</option>
                      <option value="retail">Tienda física</option>
                      <option value="service">Servicios profesionales</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>NIF / CIF (si es diferente a la sociedad)</label>
                    <input value={stores[storeSubStep]?.nif || ''} onChange={e => updateStore(storeSubStep, 'nif', e.target.value)} placeholder="Heredado de la sociedad si se deja vacío" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Dirección</label>
                  <input value={stores[storeSubStep]?.address || ''} onChange={e => updateStore(storeSubStep, 'address', e.target.value)} placeholder="Calle y número" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Ciudad</label>
                    <input value={stores[storeSubStep]?.city || ''} onChange={e => updateStore(storeSubStep, 'city', e.target.value)} placeholder="Málaga" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Provincia</label>
                    <input value={stores[storeSubStep]?.province || ''} onChange={e => updateStore(storeSubStep, 'province', e.target.value)} placeholder="Málaga" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mini navegación rápida entre tiendas */}
          {stores.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {stores.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStoreSubStep(i)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: i === storeSubStep ? '2px solid #635bff' : '1px solid #e2e8f0',
                    background: i === storeSubStep ? '#635bff' : stores[i]?.name.trim() ? '#f0fdf4' : 'white',
                    color: i === storeSubStep ? 'white' : stores[i]?.name.trim() ? '#166534' : '#64748b',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                  title={`Tienda ${i + 1}${stores[i]?.name.trim() ? '' : ' (incompleta)'}`}
                >
                  {stores[i]?.name.trim() ? '✓' : i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Proveedores */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>¿Qué proveedores de cobro usas?</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Selecciona todos los sistemas de pago que utilizas en tus tiendas.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {providerOptions.map(p => {
              const selected = selectedProviders.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProvider(p.id)}
                  style={{
                    padding: 24, borderRadius: 12, border: selected ? '2px solid #635bff' : '2px solid #e2e8f0',
                    background: selected ? '#f5f3ff' : 'white', cursor: 'pointer', textAlign: 'left',
                    boxShadow: selected ? '0 4px 12px rgba(99,91,255,0.1)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{p.name}</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: selected ? '#635bff' : '#94a3b8', fontWeight: 600 }}>
                    {selected ? '✓ Seleccionado' : 'Clic para seleccionar'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Configurar proveedores */}
      {step === 4 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Configura tus proveedores</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Indica los datos de contacto, comisiones y plazos de liquidacion para cada proveedor.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {selectedProviders.map(pid => {
              const cfg: ProviderConfig = providerConfigs[pid] || { id: '', name: '', email: '', fee_percent: '', fee_fixed: '', has_iva: false, iva_percent: '21', monthly_fee: '', payout_days: '', is_virtual_account: false, transfer_days: '', transfer_threshold: '' };
              const pInfo = providerOptions.find(p => p.id === pid);
              return (
                <div key={pid} style={{ padding: 28, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{pInfo?.icon}</span> {pInfo?.name}
                  </h3>

                  <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Email de consultas y reclamaciones</label>
                      <input value={cfg.email || ''} onChange={e => updateProviderConfig(pid, 'email', e.target.value)} placeholder="soporte@stripe.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>% Comision</label>
                        <input value={cfg.fee_percent || ''} onChange={e => updateProviderConfig(pid, 'fee_percent', e.target.value)} placeholder="2.9" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Fee fijo (EUR)</label>
                        <input value={cfg.fee_fixed || ''} onChange={e => updateProviderConfig(pid, 'fee_fixed', e.target.value)} placeholder="0.25" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Cuota mensual (EUR)</label>
                        <input value={cfg.monthly_fee || ''} onChange={e => updateProviderConfig(pid, 'monthly_fee', e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Dias de liquidacion</label>
                        <input value={cfg.payout_days || ''} onChange={e => updateProviderConfig(pid, 'payout_days', e.target.value)} placeholder="3" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Dias que tarda en acreditarse el dinero.</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                      <input
                        type="checkbox"
                        id={`virtual-${pid}`}
                        checked={cfg.is_virtual_account || false}
                        onChange={e => updateProviderConfig(pid, 'is_virtual_account', e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <label htmlFor={`virtual-${pid}`} style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                        Este proveedor acumula en cuenta virtual antes de transferir a mi banco
                      </label>
                    </div>

                    {cfg.is_virtual_account && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Dias de transferencia a banco</label>
                          <input value={cfg.transfer_days || ''} onChange={e => updateProviderConfig(pid, 'transfer_days', e.target.value)} placeholder="2" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Umbral minimo de transferencia (EUR)</label>
                          <input value={cfg.transfer_threshold || ''} onChange={e => updateProviderConfig(pid, 'transfer_threshold', e.target.value)} placeholder="100" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                      <input
                        type="checkbox"
                        id={`iva-${pid}`}
                        checked={cfg.has_iva || false}
                        onChange={e => updateProviderConfig(pid, 'has_iva', e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <label htmlFor={`iva-${pid}`} style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                        Los fees incluyen IVA
                      </label>
                    </div>

                    {cfg.has_iva && (
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>% IVA aplicado</label>
                        <input value={cfg.iva_percent || '21'} onChange={e => updateProviderConfig(pid, 'iva_percent', e.target.value)} placeholder="21" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: Modo bancario */}
      {step === 5 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>¿Cómo manejas tus cuentas bancarias?</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Indica si todas tus tiendas usan la misma cuenta o cada una tiene la suya.</p>

          {stores.length === 1 ? (
            <div style={{ padding: 20, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 24 }}>
              <div style={{ fontWeight: 700, color: '#166534' }}>✓ Tienes una sola tienda, asi que usaras una unica cuenta bancaria.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <button
                onClick={() => handleBankModeChange('shared')}
                style={{
                  padding: 28, borderRadius: 12, border: bankMode === 'shared' ? '2px solid #635bff' : '2px solid #e2e8f0',
                  background: bankMode === 'shared' ? '#f5f3ff' : 'white', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏦</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Una cuenta para todas</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Todas las tiendas depositan en la misma cuenta bancaria</div>
              </button>
              <button
                onClick={() => handleBankModeChange('separate')}
                style={{
                  padding: 28, borderRadius: 12, border: bankMode === 'separate' ? '2px solid #635bff' : '2px solid #e2e8f0',
                  background: bankMode === 'separate' ? '#f5f3ff' : 'white', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏦🏦</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Cada tienda, su cuenta</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Cada tienda tiene su propia cuenta bancaria</div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 6: Cuentas bancarias */}
      {step === 6 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Datos de tus cuentas bancarias</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Completa los datos de cada cuenta que recibe los depositos de tus proveedores.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {bankAccounts.map((acc, i) => (
              <div key={acc.id} style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fafafa' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#635bff', marginBottom: 16, textTransform: 'uppercase' }}>
                  {bankMode === 'shared' ? 'Cuenta Principal' : `Cuenta para: ${stores[i]?.name || 'Tienda ' + (i + 1)}`}
                </h3>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Banco</label>
                      <input value={acc.bank_name} onChange={e => updateBankAccount(i, 'bank_name', e.target.value)} placeholder="Santander" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Nombre de la cuenta</label>
                      <input value={acc.account_name} onChange={e => updateBankAccount(i, 'account_name', e.target.value)} placeholder="Cuenta Principal Pura" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>IBAN</label>
                    <input value={acc.iban} onChange={e => updateBankAccount(i, 'iban', e.target.value)} placeholder="ES91 0049 1800 1123 4567 8901" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Numero de cuenta (opcional)</label>
                    <input value={acc.account_number} onChange={e => updateBankAccount(i, 'account_number', e.target.value)} placeholder="0049 1800 11 2345678901" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 7: Cloud */}
      {step === 7 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>¿Donde quieres almacenar tus documentos?</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Elige la opción de almacenamiento que prefieras para tus archivos de conciliacion.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button
              onClick={() => setCloudChoice('clearflow')}
              style={{
                padding: 28, borderRadius: 12, border: cloudChoice === 'clearflow' ? '2px solid #635bff' : '2px solid #e2e8f0',
                background: cloudChoice === 'clearflow' ? '#f5f3ff' : 'white', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>☁️</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Cloud de ClearFlow</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Almacenamiento seguro gestionado por nosotros. Incluido en tu plan.</div>
            </button>
            <button
              onClick={() => setCloudChoice('own')}
              style={{
                padding: 28, borderRadius: 12, border: cloudChoice === 'own' ? '2px solid #635bff' : '2px solid #e2e8f0',
                background: cloudChoice === 'own' ? '#f5f3ff' : 'white', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Mi propio cloud</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Conecta tu propio almacenamiento (Google Drive, Dropbox, AWS S3, etc.)</div>
            </button>
          </div>

          {cloudChoice === 'own' && (
            <div style={{ marginTop: 24, padding: 20, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                <strong>Nota:</strong> La configuración de tu propio cloud se realizara en una sesion posterior con nuestro equipo de soporte tecnico.
                Por ahora usaremos el almacenamiento de ClearFlow.
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP 8: Complete */}
      {step === 8 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>¡Configuración completada!</h2>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Todo tu setup esta guardado. Ahora puedes cargar tus documentos y ejecutar tu primer SmartCheck.
          </p>

          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 24, maxWidth: 480, margin: '0 auto 32px', textAlign: 'left' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase' }}>Resumen de tu configuración</h3>
            <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.8 }}>
              <div>🏢 <strong>{societies.length}</strong> {societies.length === 1 ? 'sociedad' : 'sociedades'}</div>
              <div>🏪 <strong>{stores.length}</strong> {stores.length === 1 ? 'tienda' : 'tiendas'}</div>
              <div>💳 <strong>{selectedProviders.length}</strong> proveedores de cobro</div>
              <div>🏦 <strong>{bankAccounts.length}</strong> {bankAccounts.length === 1 ? 'cuenta bancaria' : 'cuentas bancarias'}</div>
              <div>☁️ Almacenamiento: {cloudChoice === 'clearflow' ? 'Cloud de ClearFlow' : 'Propio'}</div>
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
        <button
          onClick={prevStep}
          disabled={step === 1}
          style={{
            padding: '12px 28px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: step === 1 ? '#94a3b8' : '#0f172a',
            fontSize: 14, fontWeight: 600, cursor: step === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Anterior
        </button>

        <button
          onClick={nextStep}
          disabled={!canProceed()}
          style={{
            padding: '12px 32px', borderRadius: 8, border: 'none',
            background: canProceed() ? '#635bff' : '#cbd5e1', color: 'white',
            fontSize: 15, fontWeight: 600, cursor: canProceed() ? 'pointer' : 'not-allowed',
          }}
        >
          {step === totalSteps ? 'Ir a cargar documentos →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
