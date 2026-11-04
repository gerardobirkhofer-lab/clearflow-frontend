import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API = (import.meta.env.VITE_API_URL || '').includes('railway')
  ? import.meta.env.VITE_API_URL
  : 'https://clearflow-api-production.up.railway.app';

export default function Pricing() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState(14);
  const [wired, setWired] = useState<Record<string, boolean>>({});

  const currentTier = (() => {
    try {
      const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
      return tenantData.tier || 'starter';
    } catch {
      return 'starter';
    }
  })();

  const userEmail = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}').email as string | undefined;
    } catch {
      return undefined;
    }
  })();

  const tenantId = (() => {
    try {
      return JSON.parse(localStorage.getItem('tenant') || '{}').id as string | undefined;
    } catch {
      return undefined;
    }
  })();

  useEffect(() => {
    fetch(`${API}/api/v1/billing/plans`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if (typeof d.trial_days === 'number') setTrialDays(d.trial_days);
        const w: Record<string, boolean> = {};
        for (const [k, v] of Object.entries(d.plans || {})) {
          w[k] = !!(v as any).price_id_configured;
        }
        setWired(w);
      })
      .catch(() => {});
  }, []);

  const startCheckout = async (plan: 'starter' | 'pro' | 'enterprise') => {
    setBusy(plan);
    setErr(null);
    try {
      const res = await fetch(`${API}/api/v1/billing/checkout-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          mode: 'subscription',
          customer_email: userEmail,
          tenant_id: tenantId,
          trial_days: trialDays,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : `Checkout no disponible (${res.status}). Configurá STRIPE_PRICE_${plan.toUpperCase()} en Railway.`,
        );
      }
      if (!data.url) throw new Error('Stripe no devolvió URL de checkout');
      window.location.href = data.url;
    } catch (e: any) {
      setErr(e.message || 'Error iniciando checkout');
    } finally {
      setBusy(null);
    }
  };

  const tiers = [
    {
      key: 'starter' as const,
      name: 'Starter',
      price: '€49',
      period: t('pricing.perMonth'),
      description: t('pricing.starterDesc'),
      features: t('pricing.features.starter', { returnObjects: true }) as string[],
      highlight: false,
    },
    {
      key: 'pro' as const,
      name: 'Pro',
      price: '€99',
      period: t('pricing.perMonth'),
      description: t('pricing.proDesc'),
      features: t('pricing.features.pro', { returnObjects: true }) as string[],
      highlight: true,
    },
    {
      key: 'enterprise' as const,
      name: 'Enterprise',
      price: '€199',
      period: t('pricing.perMonth'),
      description: t('pricing.enterpriseDesc'),
      features: t('pricing.features.enterprise', { returnObjects: true }) as string[],
      highlight: false,
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          {t('pricing.title')}
        </div>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800 }}>{t('pricing.subtitle')}</h1>
        <p style={{ color: '#64748b', marginTop: 12, fontSize: 16, maxWidth: 560, margin: '12px auto 0' }}>
          {trialDays} días de prueba · después suscripción mensual · CSV-first · Tink Open Banking cuando lo configures
        </p>
      </div>

      {err && (
        <div style={{ maxWidth: 640, margin: '0 auto 20px', padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, fontSize: 13 }}>
          {err}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {tiers.map((tier) => {
          const isCurrent = currentTier === tier.key;
          const canPay = wired[tier.key] !== false; // unknown → try; false → warn
          return (
            <div
              key={tier.key}
              style={{
                padding: 32,
                borderRadius: 16,
                border: tier.highlight ? '2px solid #635bff' : '1px solid #e2e8f0',
                background: 'white',
                position: 'relative',
                boxShadow: tier.highlight ? '0 8px 30px rgba(99,91,255,0.12)' : 'none',
              }}
            >
              {tier.highlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#635bff',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {t('pricing.mostPopular')}
                </div>
              )}
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{tier.name}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, minHeight: 40 }}>{tier.description}</div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{tier.price}</span>
                <span style={{ fontSize: 16, color: '#64748b' }}>{tier.period}</span>
              </div>
              <div style={{ fontSize: 12, color: '#635bff', fontWeight: 600, marginBottom: 20 }}>
                Incluye {trialDays} días trial
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                {(Array.isArray(tier.features) ? tier.features : []).map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 14, color: '#334155' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  background: isCurrent ? '#e2e8f0' : tier.highlight ? '#635bff' : '#0f172a',
                  color: isCurrent ? '#64748b' : 'white',
                  cursor: isCurrent || busy ? 'default' : 'pointer',
                  opacity: busy === tier.key ? 0.7 : 1,
                }}
                disabled={isCurrent || !!busy}
                onClick={() => void startCheckout(tier.key)}
              >
                {isCurrent
                  ? `✓ ${t('pricing.currentPlan')}`
                  : busy === tier.key
                    ? 'Redirigiendo a Stripe…'
                    : canPay
                      ? `Empezar trial ${tier.name}`
                      : `Empezar trial ${tier.name}`}
              </button>
              {wired[tier.key] === false && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#b45309' }}>
                  Price ID de {tier.key} aún no configurado en el servidor.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 48, color: '#64748b', fontSize: 13 }}>
        ¿Solo querés probar sin tarjeta todavía?{' '}
        <Link to="/login" style={{ color: '#635bff', textDecoration: 'none', fontWeight: 600 }}>
          Crear cuenta / entrar
        </Link>
        {' · '}
        <Link to="/hub" style={{ color: '#635bff', textDecoration: 'none', fontWeight: 600 }}>
          Ir al hub
        </Link>
      </div>
    </div>
  );
}
