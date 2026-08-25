import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Role = 'owner' | 'advisor' | null;
type StoreType = 'physical' | 'online' | 'client';

interface Store {
  name: string;
  type: StoreType;
  bankAccountId?: string;
}

interface ProviderConfig {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
  disputeEmail: string;
  useLogo: boolean;
}

interface WizardState {
  role: Role;
  roleName: string;
  storeCount: number;
  stores: Store[];
  providers: ProviderConfig[];
  cloudChoice: 'ours' | 'yours' | null;
}

const AVAILABLE_PROVIDERS: ProviderConfig[] = [
  { id: 'stripe', name: 'Stripe', icon: '💳', selected: false, disputeEmail: '', useLogo: false },
  { id: 'redsys', name: 'Redsys', icon: '🏦', selected: false, disputeEmail: '', useLogo: false },
  { id: 'mercado_pago', name: 'Mercado Pago', icon: '💰', selected: false, disputeEmail: '', useLogo: false },
  { id: 'karma', name: 'Karma', icon: '🔮', selected: false, disputeEmail: '', useLogo: false },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', selected: false, disputeEmail: '', useLogo: false },
  { id: 'tpv', name: 'TPV Físico', icon: '🏧', selected: false, disputeEmail: '', useLogo: false },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leer rol pre-seleccionado desde Welcome
  const savedRole = localStorage.getItem('userRole') as Role;

  const [state, setState] = useState<WizardState>({
    role: savedRole,
    roleName: savedRole === 'owner' ? 'Dueño de Negocio' : savedRole === 'advisor' ? 'Asesor / Contador' : '',
    storeCount: 1,
    stores: [{ name: '', type: 'physical' }],
    providers: JSON.parse(JSON.stringify(AVAILABLE_PROVIDERS)),
    cloudChoice: null,
  });

  // Si el rol ya viene del Welcome, saltear al paso 2 directo
  useEffect(() => {
    if (savedRole) {
      setStep(2);
    }
  }, [savedRole]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<WizardState>({
    role: null,
    roleName: '',
    storeCount: 1,
    stores: [{ name: '', type: 'physical' }],
    providers: JSON.parse(JSON.stringify(AVAILABLE_PROVIDERS)),
    cloudChoice: null,
  });

  // Cargar progreso guardado
  useEffect(() => {
    const saved = localStorage.getItem('onboardingProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed.state);
        setStep(parsed.step);
      } catch {}
    }
  }, []);

  // Guardar progreso
  useEffect(() => {
    localStorage.setItem('onboardingProgress', JSON.stringify({ state, step }));
  }, [state, step]);

  const totalSteps = 5;

  const updateState = (patch: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...patch }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return state.role !== null;
      case 2: return state.stores.every(s => s.name.trim() !== '');
      case 3: return state.providers.some(p => p.selected);
      case 4: return state.cloudChoice !== null;
      case 5: return true;
      default: return false;
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    // Simulamos guardado en backend
    await new Promise(r => setTimeout(r, 1500));
    localStorage.removeItem('onboardingProgress');
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/hub');
  };

  const progressPercent = (step / totalSteps) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
      fontFamily: 'sans-serif',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: '#635bff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 20, margin: '0 auto 16px',
          }}>C</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
            {t('wizard.title', 'Configurá ClearFlow')}
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            {t('wizard.subtitle', 'Paso {{step}} de {{total}} — {{desc}}', {
              step,
              total: totalSteps,
              desc: step === 1 ? 'Tu perfil' : step === 2 ? 'Tus tiendas' : step === 3 ? 'Tus proveedores' : step === 4 ? 'Tus datos' : 'Todo listo',
            })}
          </p>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 40, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: '#635bff',
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* STEP 1: ROL */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
              {t('wizard.step1Title', '¿Quién sos?')}
            </h2>
            <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
              {t('wizard.step1Desc', 'Elegí el perfil que mejor se adapte a vos. Podés cambiarlo después.')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { id: 'owner' as Role, icon: '🏪', title: t('welcome.ownerTitle'), desc: t('welcome.ownerDesc') },
                { id: 'advisor' as Role, icon: '🏢', title: t('welcome.advisorTitle'), desc: t('welcome.advisorDesc') },
              ].map(role => (
                <button
                  key={role.id}
                  onClick={() => updateState({ role: role.id, roleName: role.title })}
                  style={{
                    padding: 28,
                    borderRadius: 14,
                    border: state.role === role.id ? '2px solid #635bff' : '2px solid #e2e8f0',
                    background: state.role === role.id ? '#f5f3ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{role.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>{role.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>{role.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: TIENDAS */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
              {state.role === 'advisor'
                ? t('wizard.step2AdvisorTitle', '¿Cuántos clientés querés gestionar?')
                : t('wizard.step2OwnerTitle', '¿Cuántas tiendas/negocios tenés?')}
            </h2>
            <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
              {t('wizard.step2Desc', 'Configuralos ahora. Siempre podés agregar más después.')}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>
                {t('wizard.storeCount', 'Cantidad')}
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={state.storeCount}
                onChange={e => {
                  const count = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                  const stores = Array(count).fill(null).map((_, i) => state.stores[i] || { name: '', type: 'physical' as StoreType });
                  updateState({ storeCount: count, stores });
                }}
                style={{ width: 100, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 16 }}
              />
            </div>

            {state.stores.map((store, idx) => (
              <div key={idx} style={{
                padding: 20, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12,
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#635bff', marginBottom: 12 }}>
                  {state.role === 'advisor' ? t('wizard.clientN', 'Cliente {{n}}', { n: idx + 1 }) : t('wizard.storeN', 'Tienda {{n}}', { n: idx + 1 })}
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <input
                    value={store.name}
                    onChange={e => {
                      const stores = [...state.stores];
                      stores[idx] = { ...store, name: e.target.value };
                      updateState({ stores });
                    }}
                    placeholder={state.role === 'advisor' ? 'Nombre del cliente o empresa' : 'Nombre de la tienda (ej. Sucursal Norte)'}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { id: 'physical' as StoreType, label: t('setup.physical'), icon: '🏪' },
                      { id: 'online' as StoreType, label: t('setup.online'), icon: '🌐' },
                      { id: 'client' as StoreType, label: t('nav.switchStore'), icon: '🏢' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          const stores = [...state.stores];
                          stores[idx] = { ...store, type: t.id };
                          updateState({ stores });
                        }}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 8,
                          border: store.type === t.id ? '2px solid #635bff' : '1px solid #e2e8f0',
                          background: store.type === t.id ? '#f5f3ff' : 'white',
                          cursor: 'pointer', fontSize: 13,
                        }}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: PROVEEDORES */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
              {t('wizard.step3Title', '¿Qué proveedores de pago usás?')}
            </h2>
            <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
              {t('wizard.step3Desc', 'Tildá los que uses. Después configuraremos cada uno.')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
              {state.providers.map((provider, idx) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    const providers = [...state.providers];
                    providers[idx] = { ...provider, selected: !provider.selected };
                    updateState({ providers });
                  }}
                  style={{
                    padding: 20, borderRadius: 12,
                    border: provider.selected ? '2px solid #635bff' : '2px solid #e2e8f0',
                    background: provider.selected ? '#f5f3ff' : 'white',
                    cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{provider.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{provider.name}</div>
                  {provider.selected && <div style={{ marginTop: 6, fontSize: 12, color: '#635bff', fontWeight: 600 }}>✓ Seleccionado</div>}
                </button>
              ))}
            </div>

            {state.providers.some(p => p.selected) && (
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>
                  {t('wizard.disputeEmails', 'Emails de contacto para disputas')}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                  {t('wizard.disputeEmailsDesc', 'Cuando detectemos un pago faltante, el sistema mandará un email automático a esta dirección.')}
                </p>
                {state.providers.filter(p => p.selected).map((provider, idx) => (
                  <div key={provider.id} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                      {provider.icon} {provider.name}
                    </label>
                    <input
                      value={provider.disputeEmail}
                      onChange={e => {
                        const providers = [...state.providers];
                        const pIdx = providers.findIndex(p => p.id === provider.id);
                        providers[pIdx] = { ...providers[pIdx], disputeEmail: e.target.value };
                        updateState({ providers });
                      }}
                      placeholder="soporte@proveedor.com"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: CLOUD */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>
              {t('wizard.step4Title', '¿Dónde querés guardar tus datos?')}
            </h2>
            <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
              {t('wizard.step4Desc', 'Tu información, tu decisión. Cambiá esto cuando quieras.')}
            </p>

            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {[
                {
                  id: 'ours' as const,
                  icon: '☁️',
                  title: t('wizard.cloudOurs', 'Usar cloud de ClearFlow'),
                  desc: t('wizard.cloudOursDesc', 'Base de datos segura en Europa. Sin configuración. Ideal para empezar ya.'),
                  badge: t('wizard.recommended', 'Recomendado'),
                },
                {
                  id: 'yours' as const,
                  icon: '🏢',
                  title: t('wizard.cloudYours', 'Conectar mi propia base de datos'),
                  desc: t('wizard.cloudYoursDesc', 'Tus datos nunca salen de tu infraestructura. Requiere plan Pro o Enterprise.'),
                  badge: null,
                },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateState({ cloudChoice: opt.id })}
                  style={{
                    padding: 24, borderRadius: 14,
                    border: state.cloudChoice === opt.id ? '2px solid #635bff' : '2px solid #e2e8f0',
                    background: state.cloudChoice === opt.id ? '#f5f3ff' : 'white',
                    cursor: 'pointer', textAlign: 'left', position: 'relative',
                  }}
                >
                  {opt.badge && (
                    <span style={{
                      position: 'absolute', top: 12, right: 12,
                      padding: '4px 10px', borderRadius: 12,
                      background: '#635bff', color: 'white', fontSize: 11, fontWeight: 700,
                    }}>{opt.badge}</span>
                  )}
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{opt.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>{opt.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: RESUMEN */}
        {step === 5 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>
              {t('wizard.readyTitle', '¡Todo listo!')}
            </h2>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: 15 }}>
              {t('wizard.readyDesc', 'Ya podés empezar a usar ClearFlow. Acá está el resumen de tu configuración:')}
            </p>

            <div style={{ textAlign: 'left', maxWidth: 480, margin: '0 auto 32px', background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Perfil</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{state.roleName}</div>
              </div>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  {state.role === 'advisor' ? 'Clientes' : 'Tiendas'}
                </div>
                {state.stores.map((s, i) => (
                  <div key={i} style={{ fontWeight: 600, color: '#0f172a', marginTop: 4 }}>
                    {s.type === 'online' ? '🌐' : s.type === 'client' ? '🏢' : '🏪'} {s.name}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Proveedores</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {state.providers.filter(p => p.selected).map(p => (
                    <span key={p.id} style={{ padding: '4px 10px', background: '#f5f3ff', color: '#635bff', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                      {p.icon} {p.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Datos</div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>
                  {state.cloudChoice === 'ours' ? '☁️ Cloud de ClearFlow' : '🏢 Base de datos propia'}
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              style={{
                padding: '14px 40px',
                background: '#635bff',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(99,91,255,0.3)',
              }}
            >
              {isSubmitting ? '⏳ Guardando...' : '🚀 Entrar a ClearFlow'}
            </button>
          </div>
        )}

        {/* NAV BUTTONS */}
        {step < 5 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: step === 1 ? 'not-allowed' : 'pointer',
                color: step === 1 ? '#cbd5e1' : '#64748b',
              }}
            >
              ← {t('common.back', 'Volver')}
            </button>
            <button
              onClick={() => setStep(Math.min(totalSteps, step + 1))}
              disabled={!canProceed()}
              style={{
                padding: '12px 32px',
                background: canProceed() ? '#635bff' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                boxShadow: canProceed() ? '0 2px 8px rgba(99,91,255,0.3)' : 'none',
              }}
            >
              {t('common.next', 'Siguiente')} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
