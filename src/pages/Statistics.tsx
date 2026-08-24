import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

export default function Statistics() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('30d');

  // Empty state — no hardcoded data
  const providers: any[] = [];
  const cardTypes: any[] = [];
  const monthly: any[] = [];

  const totalRevenue = 0;

  const periodLabels: Record<string, string> = {
    '7d': t('statistics.last7d'),
    '30d': t('statistics.last30d'),
    '90d': t('statistics.last90d'),
    'YTD': t('statistics.yearToDate'),
  };

  return (
    <div style={{ padding: 24 }}>
      <BackButton />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
            📊 {t('statistics.intelligence')}
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{t('statistics.title')}</h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
            {t('statistics.subtitle')}
          </p>
        </div>

        {/* PERIOD FILTER */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {(['7d','30d','90d','YTD'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: period === p ? '#0f172a' : 'white',
              color: period === p ? 'white' : '#64748b',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{periodLabels[p]}</button>
          ))}
        </div>

        {/* EMPTY STATE */}
        <div style={{ textAlign: 'center', padding: '80px 40px', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>{t('statistics.emptyTitle')}</div>
          <div style={{ fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
            {t('statistics.emptyDesc')}
          </div>
        </div>

      </div>
    </div>
  );
}
