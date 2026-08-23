import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type ProcessingPhase = 'uploading' | 'analyzing' | 'matching' | 'complete' | 'error';

interface ProcessingResult {
  bankTransactions: number;
  providerTransactions: number;
  matched: number;
  mismatches: number;
  disputes: number;
  totalAmount: number;
}

interface Props {
  phase: ProcessingPhase;
  result?: ProcessingResult;
  onDismiss?: () => void;
}

export default function ProcessingBanner({ phase, result, onDismiss }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dots, setDots] = useState('');

  // Animación de puntos suspensivos
  useEffect(() => {
    if (phase === 'complete' || phase === 'error') return;
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === 'complete' && result) {
    return (
      <div style={{
        padding: 32,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        border: '2px solid #22c55e',
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease-out',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, color: '#166534' }}>
          {t('banner.completeTitle', '¡SmartCheck completado!')}
        </h2>
        <p style={{ margin: '0 0 20px', color: '#15803d', fontSize: 15 }}>
          {t('banner.completeDesc', 'Procesamos {{bank}} transacciones bancarias y {{provider}} de proveedores.', {
            bank: result.bankTransactions,
            provider: result.providerTransactions,
          })}
        </p>

        {/* RESUMEN EN TARJETAS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          maxWidth: 600,
          margin: '0 auto 24px',
        }}>
          <div style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{t('banner.matched', 'Conciliados')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{result.matched}</div>
          </div>
          <div style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid #fed7aa' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{t('banner.mismatches', 'Discrepancias')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c' }}>{result.mismatches}</div>
          </div>
          <div style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{t('banner.disputes', 'Disputas')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{result.disputes}</div>
          </div>
          <div style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid #c7d2fe' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{t('banner.totalAmount', 'Monto Total')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#4338ca' }}>€{result.totalAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '14px 32px',
              background: '#635bff',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,91,255,0.3)',
            }}
          >
            📊 {t('banner.viewDashboard', 'Ver Panel')}
          </button>
          <button
            onClick={() => navigate('/reports')}
            style={{
              padding: '14px 32px',
              background: 'white',
              color: '#0f172a',
              border: '2px solid #e2e8f0',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📄 {t('banner.viewReport', 'Ver Informe Detallado')}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                padding: '14px 24px',
                background: 'transparent',
                color: '#64748b',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t('banner.dismiss', 'Cerrar')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div style={{
        padding: 24,
        borderRadius: 12,
        background: '#fef2f2',
        border: '1px solid #fecaca',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
        <div style={{ fontWeight: 600, color: '#991b1b' }}>
          {t('banner.error', 'Hubo un error al procesar. Intentá de nuevo.')}
        </div>
      </div>
    );
  }

  // FASES DE PROCESAMIENTO CON ANIMACIÓN
  const phaseConfig: Record<string, { icon: string; text: string; color: string }> = {
    uploading: { icon: '📤', text: t('banner.uploading', 'Subiendo archivos'), color: '#635bff' },
    analyzing: { icon: '🔍', text: t('banner.analyzing', 'Analizando transacciones'), color: '#0891b2' },
    matching: { icon: '🔁', text: t('banner.matching', 'Ejecutando SmartCheck'), color: '#059669' },
  };

  const config = phaseConfig[phase] || phaseConfig.analyzing;

  return (
    <div style={{
      padding: 24,
      borderRadius: 12,
      background: config.color + '11',
      border: `2px solid ${config.color}44`,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      animation: 'pulse 2s infinite',
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: config.color + '22',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
      }}>
        {config.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
          {config.text}{dots}
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
          {t('banner.pleaseWait', 'No cierres esta ventana')}
        </div>
      </div>
      {/* Spinner animado */}
      <div style={{
        width: 24,
        height: 24,
        border: `3px solid ${config.color}22`,
        borderTop: `3px solid ${config.color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  );
}
