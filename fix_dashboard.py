import re

path = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Dashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar y reemplazar la sección de Actividad Reciente por Acciones Rápidas
old_section = '''      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t('dashboard.recentActivity')}</h2>
          <Link to="/reconciliation" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#635bff', fontSize: 13, fontWeight: 600 }}>
            {t('dashboard.reconcile')} →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div>{t('dashboard.noTransactions')}</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>
              <Link to="/bank-upload" style={{ color: '#635bff' }}>{t('dashboard.uploadBankStatement')}</Link> {t('dashboard.toGetStarted')}
            </div>
          </div>
        ) : (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 100px', padding: '12px 16px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
              <div>{t('common.concept')}</div>
              <div style={{ textAlign: 'right' }}>{t('common.amount')}</div>
              <div style={{ textAlign: 'right' }}>{t('common.date')}</div>
              <div style={{ textAlign: 'center' }}>{t('common.type')}</div>
              <div style={{ textAlign: 'center' }}>{t('common.status')}</div>
            </div>
            {recent.map(tx => (
              <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px 100px', padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {tx.concept}
                  {tx.provider_name && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>({tx.provider_name})</span>}
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, color: tx.amount >= 0 ? '#166534' : '#991b1b' }}>
                  {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, color: '#64748b' }}>{tx.date}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: tx.type === 'bank' ? '#dbeafe' : '#fef3c7', color: tx.type === 'bank' ? '#1e40af' : '#92400e' }}>
                    {tx.type === 'bank' ? `🏦 ${t('dashboard.bank')}` : `💳 ${t('dashboard.providerShort')}`}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: tx.status === 'matched' ? '#dcfce7' : '#fef3c7', color: tx.status === 'matched' ? '#166534' : '#92400e' }}>
                    {tx.status === 'matched' ? '✅ ' + t('dashboard.matched') : '⚠️ ' + t('dashboard.unmatched')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>'''

new_section = '''      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>⚡ Acciones Rápidas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Link to="/mismatches" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #fee2e2', background: '#fef2f2', color: '#991b1b', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Ver Discrepancias
          </Link>
          <Link to="/disputes" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #ffedd5', background: '#fff7ed', color: '#9a3412', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔴 Ver Disputas Abiertas
          </Link>
          <Link to="/communications" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📧 Ver Comunicaciones
          </Link>
          <Link to="/reports" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #d1fae5', background: '#f0fdf4', color: '#166534', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Ver Informes
          </Link>
        </div>
      </div>'''

if old_section in content:
    content = content.replace(old_section, new_section)
    print('OK: Sección de Actividad Reciente reemplazada por Acciones Rápidas.')
else:
    print('ERROR: No se encontró la sección exacta.')
    # Intentar encontrar el inicio de la sección
    idx = content.find("<div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>")
    print(f'Índice del div encontrado: {idx}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
