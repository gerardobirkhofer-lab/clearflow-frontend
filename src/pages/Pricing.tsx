import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Pricing() {
  const { t } = useTranslation();
  const currentTier = (() => {
    try {
      const tenantData = JSON.parse(localStorage.getItem('tenant') || '{}');
      return tenantData.tier || 'starter';
    } catch { return 'starter'; }
  })();

  const tiers = [
    {
      key: 'starter',
      name: 'Starter',
      price: '€49',
      period: t('pricing.perMonth'),
      description: t('pricing.starterDesc'),
      features: t('pricing.features.starter', { returnObjects: true }) as string[],
      cta: t('pricing.currentPlan'),
      ctaStyle: { background: '#e2e8f0', color: '#64748b', cursor: 'default' } as any,
      highlight: false,
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '€99',
      period: t('pricing.perMonth'),
      description: t('pricing.proDesc'),
      features: t('pricing.features.pro', { returnObjects: true }) as string[],
      cta: t('pricing.upgrade'),
      ctaStyle: { background: '#635bff', color: 'white', cursor: 'pointer' } as any,
      highlight: true,
    },
    {
      key: 'enterprise',
      name: 'Enterprise',
      price: '€199',
      period: t('pricing.perMonth'),
      description: t('pricing.enterpriseDesc'),
      features: t('pricing.features.enterprise', { returnObjects: true }) as string[],
      cta: t('pricing.contactSales'),
      ctaStyle: { background: '#0f172a', color: 'white', cursor: 'pointer' } as any,
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
        <p style={{ color: '#64748b', marginTop: 12, fontSize: 16, maxWidth: 500, margin: '12px auto 0' }}>
          {t('pricing.description')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {tiers.map((tier) => {
          const isCurrent = currentTier === tier.key;
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
                <div style={{
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
                }}>
                  {t('pricing.mostPopular')}
                </div>
              )}
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{tier.name}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, minHeight: 40 }}>{tier.description}</div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{tier.price}</span>
                <span style={{ fontSize: 16, color: '#64748b' }}>{tier.period}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                {tier.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 14, color: '#334155' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  ...tier.ctaStyle,
                }}
                disabled={isCurrent}
                onClick={() => {
                  if (tier.key === 'starter') return;
                  if (tier.key === 'pro') {
                    alert(t('pricing.upgradeAlert') || 'Upgrade to Pro: In a real flow this would redirect to Stripe Checkout or ask for your dedicated DB URL.');
                  } else {
                    alert(t('pricing.enterpriseAlert') || 'Enterprise: Contact sales@clearflow.io for a custom quote and BYOC setup.');
                  }
                }}
              >
                {isCurrent ? '✓ ' + t('pricing.currentPlan') : tier.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 48, color: '#64748b', fontSize: 13 }}>
        {t('pricing.trial')} {' '}
        <Link to="/dashboard" style={{ color: '#635bff', textDecoration: 'none', fontWeight: 600 }}>
          {t('pricing.backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
