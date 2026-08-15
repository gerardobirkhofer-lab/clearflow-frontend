import { useState, useEffect } from 'react';

interface ProviderType {
  id: string;
  name: string;
  icon: string;
}

interface ProviderConfig {
  name: string;
  provider_type: string;
  settlement_mode: 'per_transaction' | 'weekly' | 'monthly';
  credit_delay_days: number;
  debit_delay_days: number;
  transfer_delay_days: number;
  batch_day_of_week: string;
  batch_frequency: string;
  fee_percent: number;
  fee_fixed: number;
  monthly_fee: number;
  bank_account_id: number | null;
}

interface BankAccount {
  id: number;
  name: string;
  bank_name: string;
  iban: string;
}

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderConfig>>({});
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [newAccount, setNewAccount] = useState({ name: '', bank_name: '', iban: '', account_number: '' });
  const [savedProviders, setSavedProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/providers/types`)
      .then(r => r.json())
      .then(data => setProviderTypes(data.types || []));
    
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-accounts/`)
      .then(r => r.json())
      .then(data => setBankAccounts(data.accounts || []));
    
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/providers/`)
      .then(r => r.json())
      .then(data => setSavedProviders(data.providers || []));
  }, []);

  const toggleProvider = (id: string) => {
    setSelectedProviders(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    if (!providerConfigs[id]) {
      setProviderConfigs(prev => ({
        ...prev,
        [id]: {
          name: providerTypes.find(p => p.id === id)?.name + ' Account',
          provider_type: id,
          settlement_mode: 'per_transaction',
          credit_delay_days: 2,
          debit_delay_days: 1,
          transfer_delay_days: 0,
          batch_day_of_week: 'friday',
          batch_frequency: 'weekly',
          fee_percent: 1.5,
          fee_fixed: 0.25,
          monthly_fee: 0,
          bank_account_id: null,
        }
      }));
    }
  };

  const updateConfig = (providerId: string, field: string, value: any) => {
    setProviderConfigs(prev => ({
      ...prev,
      [providerId]: { ...prev[providerId], [field]: value }
    }));
  };

  const addBankAccount = async () => {
    if (!newAccount.name) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-accounts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount),
    });
    const data = await res.json();
    setBankAccounts(prev => [...prev, data]);
    setNewAccount({ name: '', bank_name: '', iban: '', account_number: '' });
  };

  const saveProviders = async () => {
    setLoading(true);
    for (const providerId of selectedProviders) {
      const config = providerConfigs[providerId];
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/providers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    }
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/providers/`);
    const data = await res.json();
    setSavedProviders(data.providers || []);
    setLoading(false);
    setStep(4);
  };

  const deleteProvider = async (id: number) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/v1/providers/${id}`, { method: 'DELETE' });
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/providers/`);
    const data = await res.json();
    setSavedProviders(data.providers || []);
  };

  const deleteAccount = async (id: number) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-accounts/${id}`, { method: 'DELETE' });
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-accounts/`);
    const data = await res.json();
    setBankAccounts(data.accounts || []);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>ClearFlow Setup</h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>Set up your bank accounts first, then configure your collection providers for accurate reconciliation.</p>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: s <= step ? '#635bff' : '#e2e8f0',
          }} />
        ))}
      </div>

      {/* STEP 1: BANK ACCOUNTS */}
      {step === 1 && (
        <div>
          <h2 style={{ marginBottom: 16 }}>Step 1: Bank Accounts</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Add the bank accounts where your providers deposit funds. You'll link providers to these accounts in the next step.</p>

          {bankAccounts.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>Your Accounts</h3>
              {bankAccounts.map(acc => (
                <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{acc.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{acc.bank_name} • {acc.iban}</div>
                  </div>
                  <button onClick={() => deleteAccount(acc.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: 24, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', marginBottom: 32 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Add New Account</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Account Name</label>
                <input value={newAccount.name} onChange={e => setNewAccount(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Santander Business" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Bank Name</label>
                <input value={newAccount.bank_name} onChange={e => setNewAccount(p => ({ ...p, bank_name: e.target.value }))} placeholder="e.g. Santander" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>IBAN</label>
                <input value={newAccount.iban} onChange={e => setNewAccount(p => ({ ...p, iban: e.target.value }))} placeholder="ES91..." style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Account Number</label>
                <input value={newAccount.account_number} onChange={e => setNewAccount(p => ({ ...p, account_number: e.target.value }))} placeholder="Optional" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
              </div>
            </div>
            <button onClick={addBankAccount} style={{ marginTop: 16, padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              + Add Account
            </button>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={bankAccounts.length === 0}
            style={{
              padding: '12px 32px',
              background: bankAccounts.length > 0 ? '#635bff' : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: bankAccounts.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* STEP 2: SELECT PROVIDERS */}
      {step === 2 && (
        <div>
          <h2 style={{ marginBottom: 16 }}>Step 2: Select Your Collection Providers</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Which platforms do you use to collect payments?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {providerTypes.map(pt => (
              <div
                key={pt.id}
                onClick={() => toggleProvider(pt.id)}
                style={{
                  padding: 20,
                  borderRadius: 12,
                  border: `2px solid ${selectedProviders.includes(pt.id) ? '#635bff' : '#e2e8f0'}`,
                  background: selectedProviders.includes(pt.id) ? '#f5f3ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{pt.icon}</div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{pt.name}</div>
                {selectedProviders.includes(pt.id) && (
                  <div style={{ marginTop: 8, color: '#635bff', fontSize: 12, fontWeight: 600 }}>✓ Selected</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <button onClick={() => setStep(1)} style={{ padding: '12px 32px', background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedProviders.length === 0}
              style={{
                padding: '12px 32px',
                background: selectedProviders.length > 0 ? '#635bff' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: selectedProviders.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONFIGURE PROVIDERS */}
      {step === 3 && (
        <div>
          <h2 style={{ marginBottom: 16 }}>Step 3: Configure Each Provider</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Set settlement timing, fees, and link each provider to one of your bank accounts.</p>
          
          {selectedProviders.map(providerId => {
            const pt = providerTypes.find(p => p.id === providerId);
            const config = providerConfigs[providerId];
            return (
              <div key={providerId} style={{ marginBottom: 32, padding: 24, border: '1px solid #e2e8f0', borderRadius: 12, background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 24 }}>{pt?.icon}</span>
                  <h3 style={{ margin: 0 }}>{pt?.name}</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Nickname</label>
                    <input
                      value={config.name}
                      onChange={e => updateConfig(providerId, 'name', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Settlement Type</label>
                    <select
                      value={config.settlement_mode}
                      onChange={e => updateConfig(providerId, 'settlement_mode', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
                    >
                      <option value="per_transaction">Per Transaction (T+N)</option>
                      <option value="weekly">Weekly Batch</option>
                      <option value="monthly">Monthly Batch</option>
                    </select>
                  </div>
                </div>

                {config.settlement_mode === 'per_transaction' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Credit Card T+N</label>
                      <input type="number" value={config.credit_delay_days} onChange={e => updateConfig(providerId, 'credit_delay_days', parseInt(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Debit Card T+N</label>
                      <input type="number" value={config.debit_delay_days} onChange={e => updateConfig(providerId, 'debit_delay_days', parseInt(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Transfer T+N</label>
                      <input type="number" value={config.transfer_delay_days} onChange={e => updateConfig(providerId, 'transfer_delay_days', parseInt(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                )}

                {config.settlement_mode !== 'per_transaction' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Batch Day</label>
                      <select value={config.batch_day_of_week} onChange={e => updateConfig(providerId, 'batch_day_of_week', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Frequency</label>
                      <select value={config.batch_frequency} onChange={e => updateConfig(providerId, 'batch_frequency', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Fee %</label>
                    <input type="number" step="0.01" value={config.fee_percent} onChange={e => updateConfig(providerId, 'fee_percent', parseFloat(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Fixed Fee (€)</label>
                    <input type="number" step="0.01" value={config.fee_fixed} onChange={e => updateConfig(providerId, 'fee_fixed', parseFloat(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Monthly Fee (€)</label>
                    <input type="number" step="0.01" value={config.monthly_fee} onChange={e => updateConfig(providerId, 'monthly_fee', parseFloat(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>Deposits To</label>
                  <select
                    value={config.bank_account_id || ''}
                    onChange={e => updateConfig(providerId, 'bank_account_id', e.target.value ? parseInt(e.target.value) : null)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
                  >
                    <option value="">Select bank account...</option>
                    {bankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank_name})</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(2)} style={{ padding: '12px 32px', background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              ← Back
            </button>
            <button onClick={saveProviders} disabled={loading} style={{ padding: '12px 32px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving...' : '✓ Complete Setup'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS */}
      {step === 4 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h2 style={{ marginBottom: 12 }}>Setup Complete!</h2>
          <p style={{ color: '#64748b', marginBottom: 32 }}>Your providers and bank accounts are configured. You can now upload bank statements and start reconciling.</p>
          
          {savedProviders.length > 0 && (
            <div style={{ textAlign: 'left', maxWidth: 600, margin: '0 auto 32px' }}>
              <h3 style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>Configured Providers</h3>
              {savedProviders.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: '#f0fdf4', borderRadius: 8, marginBottom: 8, border: '1px solid #bbf7d0' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      {p.settlement_mode === 'per_transaction' 
                        ? `Credit T+${p.credit_delay_days}, Debit T+${p.debit_delay_days}` 
                        : `${p.batch_frequency} on ${p.batch_day_of_week}`}
                      {' • '}{p.fee_percent}% + €{p.fee_fixed}
                    </div>
                  </div>
                  <button onClick={() => deleteProvider(p.id)} style={{ padding: '6px 12px', background: 'white', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Delete</button>
                </div>
              ))}
            </div>
          )}

          <a href="/bank-upload" style={{ display: 'inline-block', padding: '14px 40px', background: '#635bff', color: 'white', textDecoration: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600 }}>
            Go to Bank Upload →
          </a>
        </div>
      )}
    </div>
  );
}
