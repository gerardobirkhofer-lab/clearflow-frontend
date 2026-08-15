import { useState, useEffect } from 'react';
import StripeConnect from '../components/StripeConnect';
import BackButton from '../components/BackButton';

interface Client {
  id: number;
  name: string;
  email: string;
  stores: Store[];
}

interface Store {
  id: number;
  name: string;
  type: 'physical' | 'online';
  address?: string;
}

interface BankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  currency: string;
}

export default function Setup() {
  const [activeSection, setActiveSection] = useState<'clients' | 'providers' | 'bank_accounts' | 'privacy'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddStore, setShowAddStore] = useState<number | null>(null);
  const [showAddBank, setShowAddBank] = useState(false);
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  
  const [autoPurge, setAutoPurge] = useState(false);
  const [purgeDays, setPurgeDays] = useState(90);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    if (tenant.id) setTenantId(tenant.id);
    const savedPurge = localStorage.getItem('clearflow_auto_purge');
    const savedDays = localStorage.getItem('clearflow_purge_days');
    if (savedPurge) setAutoPurge(savedPurge === 'true');
    if (savedDays) setPurgeDays(Number(savedDays));
  }, []);

  const addClient = (name: string, email: string) => {
    setClients([...clients, { id: Date.now(), name, email, stores: [] }]);
    setShowAddClient(false);
  };

  const addStore = (clientId: number, name: string, type: 'physical' | 'online', address?: string) => {
    setClients(clients.map(c => c.id === clientId ? {
      ...c, stores: [...c.stores, { id: Date.now(), name, type, address }]
    } : c));
    setShowAddStore(null);
  };

  const addBankAccount = (bank_name: string, account_number: string, currency: string) => {
    setBankAccounts([...bankAccounts, { id: Date.now(), bank_name, account_number, currency }]);
    setShowAddBank(false);
  };

  const savePrivacySettings = () => {
    localStorage.setItem('clearflow_auto_purge', String(autoPurge));
    localStorage.setItem('clearflow_purge_days', String(purgeDays));
    alert('Privacy settings saved.');
  };

  const deleteAllData = () => {
    localStorage.removeItem('tenant');
    localStorage.removeItem('clearflow_auto_purge');
    localStorage.removeItem('clearflow_purge_days');
    alert('All local data cleared. Refreshing...');
    window.location.href = '/login';
  };

  const totalStores = clients.reduce((sum, c) => sum + c.stores.length, 0);
  const physicalStores = clients.reduce((sum, c) => sum + c.stores.filter(s => s.type === 'physical').length, 0);
  const onlineStores = clients.reduce((sum, c) => sum + c.stores.filter(s => s.type === 'online').length, 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          ⚙️ Configuration
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Setup</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Manage your client portfolio, stores, providers, bank accounts, and data privacy.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '1px solid #e2e8f0', paddingBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveSection('clients')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeSection === 'clients' ? '#0f172a' : 'white',
          color: activeSection === 'clients' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>🏢 Clients & Stores</button>
        <button onClick={() => setActiveSection('providers')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeSection === 'providers' ? '#0f172a' : 'white',
          color: activeSection === 'providers' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>🔌 Connected Providers</button>
        <button onClick={() => setActiveSection('bank_accounts')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeSection === 'bank_accounts' ? '#0f172a' : 'white',
          color: activeSection === 'bank_accounts' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>🏦 Bank Accounts</button>
        <button onClick={() => setActiveSection('privacy')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeSection === 'privacy' ? '#0f172a' : 'white',
          color: activeSection === 'privacy' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>🔒 Data & Privacy</button>
      </div>

      {activeSection === 'clients' && (
        <div>
          {clients.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
              <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Clients</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{clients.length}</div>
              </div>
              <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Stores</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{totalStores}</div>
              </div>
              <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Physical</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#1e40af' }}>{physicalStores}</div>
              </div>
              <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Online</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#7c3aed' }}>{onlineStores}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Client Portfolio</h2>
            <button onClick={() => setShowAddClient(true)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', background: '#635bff',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>+ Add Client</button>
          </div>

          {showAddClient && (
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, fontSize: 15 }}>New Client</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                addClient(fd.get('name') as string, fd.get('email') as string);
              }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Client / Business Name</label>
                  <input name="name" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Pura Alegria S.L." />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Contact Email</label>
                  <input name="email" type="email" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="admin@puraalegria.com" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#635bff', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Save Client</button>
                  <button type="button" onClick={() => setShowAddClient(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {clients.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>No clients yet.</div>
              <div style={{ fontSize: 13 }}>Add your first client to build your portfolio.</div>
            </div>
          ) : (
            clients.map(client => (
              <div key={client.id} style={{ marginBottom: 16, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
                <div 
                  onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                  style={{ 
                    padding: '16px 20px', 
                    background: '#f8fafc', 
                    borderBottom: expandedClient === client.id ? '1px solid #e2e8f0' : 'none',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, background: '#635bff', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 16 
                    }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{client.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{client.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>STORES</div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{client.stores.length}</div>
                    </div>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'white', fontSize: 12, color: '#64748b',
                      transform: expandedClient === client.id ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}>
                      ▼
                    </div>
                  </div>
                </div>

                {expandedClient === client.id && (
                  <div style={{ padding: '16px 20px' }}>
                    {client.stores.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#94a3b8', padding: '8px 0' }}>No stores configured yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                        {client.stores.map(store => (
                          <div key={store.id} style={{
                            padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0',
                            background: 'white', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                          }}>
                            <span style={{ fontSize: 16 }}>{store.type === 'online' ? '🌐' : '🏪'}</span>
                            <div>
                              <div style={{ fontWeight: 600 }}>{store.name}</div>
                              {store.address && <div style={{ fontSize: 11, color: '#94a3b8' }}>{store.address}</div>}
                            </div>
                            <span style={{ 
                              padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                              background: store.type === 'online' ? '#f3e8ff' : '#dbeafe',
                              color: store.type === 'online' ? '#7c3aed' : '#1e40af',
                              textTransform: 'uppercase',
                            }}>
                              {store.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddStore === client.id ? (
                      <div style={{ padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fafafa' }}>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          addStore(client.id, fd.get('store_name') as string, fd.get('store_type') as 'physical' | 'online', fd.get('address') as string);
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Store Name</label>
                              <input name="store_name" required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }} placeholder="Pura Zona Norte" />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Type</label>
                              <select name="store_type" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
                                <option value="physical">🏪 Physical Store</option>
                                <option value="online">🌐 Online Store</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Address / URL</label>
                              <input name="address" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }} placeholder="Calle Mayor 123" />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="submit" style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#635bff', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                              <button type="button" onClick={() => setShowAddStore(null)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>✕</button>
                            </div>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <button onClick={() => setShowAddStore(client.id)} style={{
                        padding: '8px 14px', borderRadius: 6, border: '1px dashed #cbd5e1',
                        background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#635bff',
                      }}>
                        + Add Store to {client.name}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeSection === 'providers' && (
        <div>
          <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700 }}>Connected Providers</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            Connect payment providers for automatic transaction syncing. CSV upload is always available as a fallback.
          </p>
          {tenantId ? <StripeConnect tenantId={tenantId} /> : (
            <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', marginBottom: 16 }}>
              No store selected. Please select a store first.
            </div>
          )}
          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', opacity: 0.6, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 24 }}>🌐</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Mercado Pago</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>⚪ Coming soon — upload CSV for now</div>
              </div>
            </div>
          </div>
          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', opacity: 0.6, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 24 }}>💳</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>TPV / Redsys</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>⚪ Coming soon — upload CSV for now</div>
              </div>
            </div>
          </div>
          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', opacity: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 24 }}>📱</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Karma</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>⚪ Coming soon — upload CSV for now</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'bank_accounts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Bank Accounts</h2>
            <button onClick={() => setShowAddBank(true)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', background: '#635bff',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>+ Add Account</button>
          </div>

          {showAddBank && (
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, fontSize: 15 }}>New Bank Account</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                addBankAccount(fd.get('bank_name') as string, fd.get('account_number') as string, fd.get('currency') as string);
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Bank Name</label>
                    <input name="bank_name" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Santander, BBVA..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>IBAN / Account</label>
                    <input name="account_number" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="ES91 0000 0000..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Currency</label>
                    <select name="currency" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" style={{ padding: '10px 16px', borderRadius: 6, border: 'none', background: '#635bff', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    <button type="button" onClick={() => setShowAddBank(false)} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {bankAccounts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏦</div>
              <div>No bank accounts configured.</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Add an account to start uploading statements.</div>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 80px',
                padding: '14px 20px', background: '#f8fafc', fontSize: 11, fontWeight: 700,
                color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0'
              }}>
                <div>Bank</div><div>Account Number</div><div>Currency</div><div></div>
              </div>
              {bankAccounts.map(acc => (
                <div key={acc.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 80px',
                  padding: '16px 20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9',
                }}>
                  <div style={{ fontWeight: 600 }}>{acc.bank_name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{acc.account_number}</div>
                  <div style={{ fontWeight: 600 }}>{acc.currency}</div>
                  <div style={{ textAlign: 'right' }}><span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Active</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'privacy' && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700 }}>Data & Privacy</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              ClearFlow is a reconciliation tool — not a tax agent, not a bank, and not a data broker.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🇪🇺</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>EU Data Residency</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>All data stored exclusively in European data centers (Frankfurt / Paris).</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔐</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>AES-256 Encryption</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Encrypted at rest. TLS 1.3 in transit. Your bank statements are unreadable to us without your session.</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🚫</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Zero Sharing</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>We do not share your data with tax authorities, advertisers, AI trainers, or third parties. Ever.</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🛡️</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>GDPR Compliant</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Right to access, right to erasure, right to portability. Request your data anytime.</div>
            </div>
          </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Data Retention</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Auto-Purge Old Data</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Automatically delete transaction data older than the selected period.</div>
              </div>
              <button
                onClick={() => setAutoPurge(!autoPurge)}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: autoPurge ? '#635bff' : '#cbd5e1', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 11, background: 'white',
                  position: 'absolute', top: 2, left: autoPurge ? 24 : 2, transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }} />
              </button>
            </div>

            {autoPurge && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Delete data older than:</label>
                <select
                  value={purgeDays}
                  onChange={(e) => setPurgeDays(Number(e.target.value))}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}
                >
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>6 months</option>
                  <option value={365}>1 year</option>
                </select>
              </div>
            )}

            <button
              onClick={savePrivacySettings}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', background: '#0f172a',
                color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Save Retention Settings
            </button>
          </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#991b1b' }}>Danger Zone</h3>
            <p style={{ fontSize: 13, color: '#b91c1c', marginBottom: 16 }}>
              Deleting your data is irreversible. Your bank statements, provider transactions, and store configuration will be permanently removed.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid #ef4444',
                  background: 'white', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Delete All My Data
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>Are you sure?</span>
                <button
                  onClick={deleteAllData}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: 'none',
                    background: '#dc2626', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: '1px solid #cbd5e1',
                    background: 'white', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
              <strong>Legal Notice:</strong> ClearFlow S.L. acts solely as a data processor under GDPR Article 28. 
              You (the data controller) retain full ownership of your business data. 
              We process your data only to provide the reconciliation service you requested. 
              We do not perform tax analysis, financial auditing, or regulatory reporting on your behalf. 
              If you require a Data Processing Agreement (DPA), contact us at dpa@clearflow.app.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
