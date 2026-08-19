import { Link } from 'react-router-dom';

const tiers = [
  {
    name: 'Starter',
    price: '€49',
    period: '/month',
    description: 'Perfect for a single restaurant or small business just getting started.',
    features: [
      'Up to 1,000 transactions / month',
      'Shared database (schema-isolated)',
      'Stripe & Redsys reconciliation',
      'Basic dashboard & reports',
      'Email support',
    ],
    cta: 'Current Plan',
    ctaStyle: { background: '#e2e8f0', color: '#64748b', cursor: 'default' } as any,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '€99',
    period: '/month',
    description: 'For growing chains and accountants managing multiple clients.',
    features: [
      'Unlimited transactions',
      'Dedicated PostgreSQL database',
      'Multi-institution support',
      'Advanced reconciliation engine',
      'Priority email & chat support',
      'API access',
      'Custom fee structures',
    ],
    cta: 'Upgrade to Pro',
    ctaStyle: { background: '#635bff', color: 'white', cursor: 'pointer' } as any,
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '€199',
    period: '/month',
    description: 'For large groups, franchises, and accounting firms with BYOC needs.',
    features: [
      'Everything in Pro',
      'Bring Your Own Cloud (BYOC)',
      'Dedicated VPC / private DB',
      'Custom SLA & uptime guarantee',
      'White-label options',
      'Dedicated account manager',
      'On-premise deployment option',
    ],
    cta: 'Contact Sales',
    ctaStyle: { background: '#0f172a', color: 'white', cursor: 'pointer' } as any,
    highlight: false,
  },
];

export default function Pricing() {
  const currentTier = (() => {
    try {
      const t = JSON.parse(localStorage.getItem('tenant') || '{}');
      return t.tier || 'starter';
    } catch { return 'starter'; }
  })();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Pricing
        </div>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800 }}>Simple, transparent pricing</h1>
        <p style={{ color: '#64748b', marginTop: 12, fontSize: 16, maxWidth: 500, margin: '12px auto 0' }}>
          Start free with Starter. Scale to Pro when you need a dedicated database. Go Enterprise for full control.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {tiers.map((tier) => {
          const isCurrent = currentTier === tier.name.toLowerCase();
          return (
            <div
              key={tier.name}
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
                  Most Popular
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
                  if (tier.name === 'Starter') return;
                  if (tier.name === 'Pro') {
                    alert('Upgrade to Pro: In a real flow this would redirect to Stripe Checkout or ask for your dedicated DB URL.');
                  } else {
                    alert('Enterprise: Contact sales@clearflow.io for a custom quote and BYOC setup.');
                  }
                }}
              >
                {isCurrent ? '✓ Current Plan' : tier.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 48, color: '#64748b', fontSize: 13 }}>
        All plans include 14-day free trial. No credit card required to start. {' '}
        <Link to="/dashboard" style={{ color: '#635bff', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
