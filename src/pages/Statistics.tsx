import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';

const API = import.meta.env.VITE_API_URL;
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const formatNumber = (n: number) => new Intl.NumberFormat('es-ES').format(n || 0);

export default function Statistics() {
  const { t } = useTranslation();

  const [summary, setSummary] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    if (!tenant.id) {
      setSummary(null);
      return;
    }
    fetch(`${API}/api/v1/bank-statements/dashboard?tenant_id=${tenant.id}`, { headers: getAuth() })
      .then(async (res) => {
        if (!res.ok) throw new Error('No se pudieron cargar las estadísticas');
        const data = await res.json();
        const s = data.summary || {};
        const hasRows = (s.bank_transactions || 0) > 0 || (s.provider_transactions || 0) > 0;
        setSummary(hasRows ? s : null);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  const totalRevenue = summary?.total_collected || 0;
  const totalSales = summary?.total_sales || 0;
  const matchedAmount = summary?.matched_amount || 0;
  const openItems = (summary?.pending_count || 0);

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

        {!summary ? (
          /* EMPTY STATE */
          <div style={{ textAlign: 'center', padding: '80px 40px', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>{t('statistics.emptyTitle')}</div>
            <div style={{ fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
              {loadError || t('statistics.emptyDesc')}
            </div>
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Ingresos Totales</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{formatMoney(totalRevenue)}</div>
              </div>
              <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Ventas de proveedores</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{formatMoney(totalSales)}</div>
              </div>
              <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Importe conciliado</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#166534' }}>{formatMoney(matchedAmount)}</div>
              </div>
              <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Movimientos abiertos</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{formatNumber(openItems)}</div>
              </div>
            </div>
            <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13 }}>
              Estas cifras salen de los extractos y liquidaciones subidos. El desglose por tarjeta o por mes se muestra cuando el archivo trae ese detalle.
            </div>
          </>
        )}

      </div>
    </div>
  );
}
