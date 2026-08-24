import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import ProcessingBanner from '../components/ProcessingBanner';

interface UploadingFile {
  file: File;
  detectedType: 'bank' | 'stripe' | 'redsys' | 'mercado_pago' | 'karma' | 'paypal' | 'tpv' | 'unknown';
  detectedName: string;
  progress: number;
  status: 'uploading' | 'done' | 'error' | 'detecting';
  message?: string;
}

type ProcessingPhase = 'uploading' | 'analyzing' | 'matching' | 'complete' | 'error' | 'idle';
type WizardStep = 1 | 2 | 3 | 4 | 5;

interface ProcessingResult {
  bankTransactions: number;
  providerTransactions: number;
  matched: number;
  mismatches: number;
  disputes: number;
  totalAmount: number;
}

const ICONS: Record<string, string> = {
  bank: '🏦',
  stripe: '💳',
  redsys: '🏧',
  mercado_pago: '💰',
  karma: '🔮',
  paypal: '🅿️',
  tpv: '🏪',
  unknown: '📄',
};

export default function SmartCheckWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [phase, setPhase] = useState<ProcessingPhase>('idle');
  const [result, setResult] = useState<ProcessingResult | undefined>();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar checklist desde configuración del wizard
  const [requiredDocs, setRequiredDocs] = useState([
    { id: 'bank', name: 'Extracto Bancario', icon: '🏦', uploaded: false },
    { id: 'stripe', name: 'Stripe', icon: '💳', uploaded: false },
    { id: 'redsys', name: 'Redsys / TPV', icon: '🏧', uploaded: false },
  ]);

  const allUploaded = requiredDocs.every(d => d.uploaded);

  const nextStep = () => setStep(s => Math.min(5, s + 1) as WizardStep);
  const prevStep = () => setStep(s => Math.max(1, s - 1) as WizardStep);

  // Detección básica de archivo
  async function detectFileType(file: File): Promise<{ type: UploadingFile['detectedType']; name: string }> {
    const text = await file.text();
    const content = text.slice(0, 2000).toLowerCase();
    const fname = file.name.toLowerCase();

    if (content.includes('iban') || content.includes('concepto') || content.includes('santander') || content.includes('bbva') || fname.includes('bank') || fname.includes('banco')) {
      return { type: 'bank', name: 'Extracto Bancario' };
    }
    if (content.includes('stripe') || fname.includes('stripe')) return { type: 'stripe', name: 'Stripe' };
    if (content.includes('redsys') || content.includes('terminal') || fname.includes('redsys') || fname.includes('tpv')) return { type: 'redsys', name: 'Redsys' };
    if (content.includes('mercado pago') || fname.includes('mercado')) return { type: 'mercado_pago', name: 'Mercado Pago' };
    if (content.includes('paypal') || fname.includes('paypal')) return { type: 'paypal', name: 'PayPal' };

    return { type: 'unknown', name: 'Desconocido' };
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
    for (const file of files) await processFile(file);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.name.endsWith('.csv'));
    for (const file of files) await processFile(file);
  };

  const processFile = async (file: File) => {
    const detected = await detectFileType(file);
    const upload: UploadingFile = {
      file, detectedType: detected.type, detectedName: detected.name,
      progress: 0, status: 'detecting',
    };
    setUploads(prev => [...prev, upload]);

    // Simular upload
    setTimeout(() => {
      setUploads(prev => prev.map(u => u.file === file ? { ...u, status: 'uploading', progress: 50 } : u));
      setTimeout(() => {
        setUploads(prev => prev.map(u => u.file === file ? { ...u, status: 'done', progress: 100, message: '✅ OK' } : u));
        setRequiredDocs(prev => prev.map(d => d.id === detected.type || (d.id === 'redsys' && detected.type === 'tpv') ? { ...d, uploaded: true } : d));
      }, 800);
    }, 500);
  };

  const runSmartCheck = async () => {
    setStep(4);
    setPhase('analyzing');
    await new Promise(r => setTimeout(r, 1500));
    setPhase('matching');
    await new Promise(r => setTimeout(r, 2000));
    setResult({ bankTransactions: 47, providerTransactions: 63, matched: 38, mismatches: 5, disputes: 4, totalAmount: 12450.75 });
    setPhase('complete');
    setStep(5);
  };

  // === PASO 1: PERÍODO ===
  if (step === 1) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 20px', fontFamily: 'sans-serif' }}>
        <BackButton />
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>¿Qué período querés verificar?</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>Seleccioná el rango de fechas para tu SmartCheck.</p>
        </div>
        <div style={{ background: 'white', padding: 32, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Desde</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Hasta</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
          </div>
          <button
            onClick={nextStep}
            disabled={!periodStart || !periodEnd}
            style={{
              width: '100%', padding: '14px', background: periodStart && periodEnd ? '#635bff' : '#e2e8f0',
              color: periodStart && periodEnd ? 'white' : '#94a3b8',
              border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
              cursor: periodStart && periodEnd ? 'pointer' : 'not-allowed',
            }}
          >
            Siguiente →
          </button>
        </div>
      </div>
    );
  }

  // === PASO 2: CHECKLIST ===
  if (step === 2) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 20px', fontFamily: 'sans-serif' }}>
        <BackButton />
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Documentos necesarios</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>Necesitamos estos archivos para el período seleccionado.</p>
        </div>
        <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 20 }}>
          {requiredDocs.map(doc => (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 16,
              borderRadius: 10, marginBottom: 10,
              background: doc.uploaded ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${doc.uploaded ? '#bbf7d0' : '#fecaca'}`,
            }}>
              <div style={{ fontSize: 24 }}>{doc.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{doc.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{doc.uploaded ? '✅ Recibido' : '⏳ Pendiente'}</div>
              </div>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: doc.uploaded ? '#22c55e' : '#ef4444',
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={prevStep} style={{ flex: 1, padding: '14px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            ← Volver
          </button>
          <button onClick={nextStep} style={{ flex: 1, padding: '14px', background: '#635bff', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Siguiente →
          </button>
        </div>
      </div>
    );
  }

  // === PASO 3: UPLOAD ===
  if (step === 3) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
        <BackButton />
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>PASO 3 DE 5</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Subí tus archivos</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Arrastrá todos tus CSVs acá. Detectamos automáticamente cada tipo.</p>
        </div>

        {/* CHECKLIST */}
        <div style={{ marginBottom: 24, padding: 16, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>📋 Estado de documentos</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: allUploaded ? '#16a34a' : '#d97706' }}>
              {requiredDocs.filter(d => d.uploaded).length} / {requiredDocs.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {requiredDocs.map(d => (
              <div key={d.id} style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: d.uploaded ? '#f0fdf4' : '#fef2f2',
                color: d.uploaded ? '#166534' : '#991b1b',
                border: `1px solid ${d.uploaded ? '#bbf7d0' : '#fecaca'}`,
              }}>
                {d.icon} {d.uploaded ? '✅' : '⏳'} {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* DROP ZONE */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragOver ? '2px dashed #635bff' : '2px dashed #cbd5e1',
            borderRadius: 16, padding: '60px 40px', textAlign: 'center',
            background: dragOver ? '#f5f3ff' : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 24,
          }}
        >
          <input ref={fileInputRef} type="file" accept=".csv" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
          <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Arrastrá todos tus CSVs aquí</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>o hacé clic para buscar</div>
        </div>

        {/* UPLOADS */}
        {uploads.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {uploads.map((u, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 20 }}>{ICONS[u.detectedType] || '📄'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.file.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.detectedName}</div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: u.status === 'done' ? '#dcfce7' : '#fef9c3', color: u.status === 'done' ? '#166534' : '#854d0e' }}>
                  {u.status === 'done' ? '✅ Listo' : '⏳ Procesando...'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={prevStep} style={{ flex: 1, padding: '14px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            ← Volver
          </button>
          <button
            onClick={runSmartCheck}
            disabled={!allUploaded}
            style={{
              flex: 1, padding: '14px',
              background: allUploaded ? '#635bff' : '#e2e8f0',
              color: allUploaded ? 'white' : '#94a3b8',
              border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
              cursor: allUploaded ? 'pointer' : 'not-allowed',
            }}
          >
            {allUploaded ? '🔁 Ejecutar SmartCheck' : '⏳ Faltan documentos'}
          </button>
        </div>
      </div>
    );
  }

  // === PASO 4: PROCESANDO ===
  if (step === 4) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '100px 20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <ProcessingBanner phase={phase} result={result} />
        <p style={{ color: '#64748b', marginTop: 24 }}>No cierres esta ventana...</p>
      </div>
    );
  }

  // === PASO 5: RESULTADO ===
  if (step === 5 && result) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
        <div style={{
          padding: 32, borderRadius: 16,
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '2px solid #22c55e', textAlign: 'center', marginBottom: 32,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, color: '#166534' }}>¡SmartCheck completado!</h2>
          <p style={{ margin: '0 0 20px', color: '#15803d', fontSize: 15 }}>
            Período: {periodStart} al {periodEnd}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, maxWidth: 600, margin: '0 auto 24px' }}>
            <div style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Conciliados</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{result.matched}</div>
            </div>
            <div style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid #fed7aa' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Discrepancias</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c' }}>{result.mismatches}</div>
            </div>
            <div style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid #fecaca' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Disputas</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{result.disputes}</div>
            </div>
            <div style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid #c7d2fe' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Monto Total</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#4338ca' }}>€{result.totalAmount.toFixed(2)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '14px 32px', background: '#635bff', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              📊 Ir al Dashboard
            </button>
            <button onClick={() => navigate('/reconciliation')} style={{ padding: '14px 32px', background: 'white', color: '#0f172a', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              📋 Ver Estado Completo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
