import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import StripeConnect from '../components/StripeConnect';
import BackButton from '../components/BackButton';

interface Client {
  id: string;
  name: string;
  email: string;
  stores: Store[];
}

interface Store {
  id: string;
  name: string;
  type: 'physical' | 'online';
  address?: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  currency: string;
}

export default function Setup() {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState<'clients' | 'providers' | 'bank_accounts' | 'privacy'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddStore, setShowAddStore] = useState<string | null>(null);
  const [showAddBank, setShowAddBank] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [autoPurge, setAutoPurge] = useState(false);
  const [purgeDays, setPurgeDays] = useState(90);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [providerEmails, setProviderEmails] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState(localStorage.getItem('clearflow_language') || 'es');

  useEffect(() => {
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    if (tenant.id) setTenantId(tenant.id);
    const savedPurge = localStorage.getItem('clearflow_auto_purge');
    const savedDays = localStorage.getItem('clearflow_purge_days');
    if (savedPurge) setAutoPurge(savedPurge === 'true');
    if (savedDays) setPurgeDays(Number(savedDays));
    const savedEmails = localStorage.getItem('clearflow_provider_emails');
    if (savedEmails) setProviderEmails(JSON.parse(savedEmails));
    const savedLang = localStorage.getItem('clearflow_language');
    if (savedLang) setLanguage(savedLang);
  }, []);

  const changeLanguage = (lng: string) => {
    setLanguage(lng);
    localStorage.setItem('clearflow_language', lng);
    i18n.changeLanguage(lng);
  };

  const addClient = (name: string, email: string) => {
    setClients([...clients, { id: crypto.randomUUID(), name, email, stores: [] }]);
    setShowAddClient(false);
  };

  const addStore = (clientId: string, name: string, type: 'physical' | 'online', address?: string) => {
    setClients(clients.map(c => c.id === clientId ? {
      ...c, stores: [...c.stores, { id: crypto.randomUUID(), name, type, address }]
    } : c));
    setShowAddStore(null);
  };

  const addBankAccount = (bank_name: string, account_number: string, currency: string) => {
    setBankAccounts([...bankAccounts, { id: crypto.randomUUID(), bank_name, account_number, currency }]);
    setShowAddBank(false);
  };

  const saveProviderEmail = (provider: string, email: string) => {
    const updated = { ...providerEmails, [provider]: email };
    setProviderEmails(updated);
    localStorage.setItem('clearflow_provider_emails', JSON.stringify(updated));
  };

  const savePrivacySettings = () => {
    localStorage.setItem('clearflow_auto_purge', String(autoPurge));
    localStorage.setItem('clearflow_purge_days', String(purgeDays));
    alert(t('setup.saved') || 'Privacy settings saved.');
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
          ⚙️ {t('setup.title')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{t('setup.title')}</h1>
            <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
              {t('setup.subtitle')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white' }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>🌐 {t('setup.language')}:</span>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: 'white', cursor: 'pointer' }}
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '1px solid #e2e8f0', paddingBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveSection('clients')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeSection === 'clients' ? '#0f172a' : 'white',
          color: activeSection === 'clients' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>🏢 {t('setup.clientsStores')}</button>
        <button onClick={() => setActiveSection('providers')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeSection === 'providers' ? '#0f172a' : 'white',
          color: activeSection === 'providers' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>🔌 {t('setup.connectedProviders')}</button>
        <button onClick={() => setActiveSection('bank_accounts')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeSection === 'bank_accounts' ? '#0f172a' : 'white',
          color: activeSection === 'bank_accounts' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>🏦 {t('setup.bankAccounts')}</button>
        <button onClick={() => setActiveSection('privacy')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeSection === 'privacy' ? '#0f172a' : 'white',
          color: activeSection === 'privacy' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>🔒 {t('setup.dataPrivacy')}</button>
      </div>

      {activeSection === 'clients' && (
        <div>
          {clients.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
              <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('setup.clientPortfolio')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{clients.length}</div>
              </div>
              <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('setup.stores') || 'Stores'}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{totalStores}</div>
              </div>
              <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('setup.physical')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#1e40af' }}>{physicalStores}</div>
              </div>
              <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('setup.online')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#7c3aed' }}>{onlineStores}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t('setup.clientPortfolio')}</h2>
            <button onClick={() => setShowAddClient(true)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', background: '#635bff',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>+ {t('setup.addClient')}</button>
          </div>

          {showAddClient && (
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, fontSize: 15 }}>{t('setup.addClient')}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                addClient(fd.get('name') as string, fd.get('email') as string);
              }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t('setup.clientName')}</label>
                  <input name="name" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Pura Alegria S.L." />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t('setup.contactEmail')}</label>
                  <input name="email" type="email" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="admin@puraalegria.com" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#635bff', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{t('common.save')}</button>
                  <button type="button" onClick={() => setShowAddClient(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>{t('common.cancel')}</button>
                </div>
              </form>
            </div>
          )}

          {clients.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{t('setup.noClients')}</div>
              <div style={{ fontSize: 13 }}>{t('setup.addFirstClient')}</div>
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
                      <div style={{ fontSize: 13, color: '#94a3b8', padding: '8px 0' }}>{t('setup.noStores')}</div>
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
                              {store.type === 'online' ? t('setup.online') : t('setup.physical')}
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
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t('setup.storeName')}</label>
                              <input name="store_name" required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }} placeholder="Pura Zona Norte" />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t('setup.type')}</label>
                              <select name="store_type" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}>
                                <option value="physical">🏪 {t('setup.physical')}</option>
                                <option value="online">🌐 {t('setup.online')}</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t('setup.address')}</label>
                              <input name="address" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }} placeholder="Calle Mayor 123" />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="submit" style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#635bff', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{t('common.add')}</button>
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
                        + {t('setup.addStore')} {client.name}
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
          <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700 }}>{t('setup.connectedProviders')}</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            Connect payment providers for automatic transaction syncing. CSV upload is always available as a fallback.
          </p>
          {tenantId ? <StripeConnect tenantId={tenantId} /> : (
            <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', marginBottom: 16 }}>
              No store selected. Please select a store first.
            </div>
          )}

          <div style={{ marginTop: 32, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700 }}>📧 {t('setup.disputeEmailConfig')}</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
              {t('setup.disputeEmailDesc')}
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { key: 'stripe', label: 'Stripe', icon: '🔷' },
                { key: 'redsys', label: 'TPV / Redsys', icon: '🏧' },
                { key: 'mercadopago', label: 'Mercado Pago', icon: '🌐' },
                { key: 'karma', label: 'Karma', icon: '📱' },
              ].map((p) => (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white' }}>
                  <div style={{ fontSize: 22 }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.label}</div>
                    <input
                      type="email"
                      value={providerEmails[p.key] || ''}
                      onChange={(e) => saveProviderEmail(p.key, e.target.value)}
                      placeholder={`disputes@${p.key}.com`}
                      style={{ width: '100%', maxWidth: 320, padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                  {providerEmails[p.key] && (
                    <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>✓ {t('setup.saved')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t('setup.bankAccounts')}</h2>
            <button onClick={() => setShowAddBank(true)} style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', background: '#635bff',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>+ {t('setup.addAccount')}</button>
          </div>

          {showAddBank && (
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, fontSize: 15 }}>{t('setup.newBankAccount')}</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                addBankAccount(fd.get('bank_name') as string, fd.get('account_number') as string, fd.get('currency') as string);
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t('setup.bankName')}</label>
                    <input name="bank_name" required style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="Santander, BBVA..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t('setup.iban')}</label>
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
                    <button type="submit" style={{ padding: '10px 16px', borderRadius: 6, border: 'none', background: '#635bff', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{t('common.save')}</button>
                    <button type="button" onClick={() => setShowAddBank(false)} style={{ padding: '10px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>{t('common.cancel')}</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {bankAccounts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🏦</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{t('setup.noBankAccounts')}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{t('setup.addAccount')} {t('setup.toStart') || 'to start uploading statements.'}</div>
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 80px',
                padding: '14px 20px', background: '#f8fafc', fontSize: 11, fontWeight: 700,
                color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0'
              }}>
                <div>{t('setup.bankName')}</div><div>{t('setup.iban')}</div><div>Currency</div><div></div>
              </div>
              {bankAccounts.map(acc => (
                <div key={acc.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 80px',
                  padding: '16px 20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9',
                }}>
                  <div style={{ fontWeight: 600 }}>{acc.bank_name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{acc.account_number}</div>
                  <div style={{ fontWeight: 600 }}>{acc.currency}</div>
                  <div style={{ textAlign: 'right' }}><span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{t('common.active')}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'privacy' && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700 }}>{t('setup.dataPrivacy')}</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              {t('setup.dataPrivacyDesc') || 'ClearFlow is a reconciliation tool — not a tax agent, not a bank, and not a data broker.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🇪🇺</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('setup.dataResidency')}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{t('setup.dataResidencyDesc')}</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔐</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('setup.encryption')}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{t('setup.encryptionDesc')}</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🚫</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('setup.zeroSharing')}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{t('setup.zeroSharingDesc')}</div>
            </div>
            <div style={{ padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🛡️</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('setup.gdpr')}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{t('setup.gdprDesc')}</div>
            </div>
          </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>{t('setup.autoPurge')}</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t('setup.autoPurge')}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{t('setup.autoPurgeDesc')}</div>
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t('setup.deleteAfter') || 'Delete data older than:'}</label>
                <select
                  value={purgeDays}
                  onChange={(e) => setPurgeDays(Number(e.target.value))}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}
                >
                  <option value={30}>30 {t('common.days') || 'days'}</option>
                  <option value={90}>90 {t('common.days') || 'days'}</option>
                  <option value={180}>6 {t('common.months') || 'months'}</option>
                  <option value={365}>1 {t('common.year') || 'year'}</option>
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
              {t('setup.saveRetention') || 'Save Retention Settings'}
            </button>
          </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#991b1b' }}>{t('setup.dangerZone')}</h3>
            <p style={{ fontSize: 13, color: '#b91c1c', marginBottom: 16 }}>
              {t('setup.dangerZoneDesc')}
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid #ef4444',
                  background: 'white', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {t('setup.deleteData')}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>{t('setup.areYouSure') || 'Are you sure?'}</span>
                <button
                  onClick={deleteAllData}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: 'none',
                    background: '#dc2626', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t('setup.yesDelete') || 'Yes, Delete Everything'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: '1px solid #cbd5e1',
                    background: 'white', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {t('common.cancel')}
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
