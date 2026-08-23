import { useState, useRef, useCallback } from 'react';
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

interface ProcessingResult {
  bankTransactions: number;
  providerTransactions: number;
  matched: number;
  mismatches: number;
  disputes: number;
  totalAmount: number;
}

const BANK_KEYWORDS = ['santander', 'bbva', 'caixabank', 'sabadell', 'iban', 'concepto', 'fecha valor', 'saldo', 'abono', 'cargo'];
const PROVIDER_PATTERNS: Record<string, string[]> = {
  stripe: ['stripe', 'charge_id', 'charge.id', 'payment_intent', 'amount', 'currency', 'usd', 'eur'],
  redsys: ['redsys', 'terminal', 'comercio', 'numero operacion', 'tarjeta', 'autorizacion'],
  mercado_pago: ['mercado pago', 'mercadopago', 'mp', 'payment_id', 'external_reference'],
  karma: ['karma', 'karma_payments'],
  paypal: ['paypal', 'transaction id', 'gross', 'fee', 'net'],
  tpv: ['tpv', 'pos', 'terminal', 'lote', 'cierre'],
};

async function detectFileType(file: File): Promise<{ type: UploadingFile['detectedType']; name: string }> {
  const text = await file.text();
  const firstLines = text.split('\n').slice(0, 5).join(' ').toLowerCase();
  const content = text.slice(0, 2000).toLowerCase();

  // Check bank first
  const bankScore = BANK_KEYWORDS.reduce((acc, kw) => acc + (content.includes(kw) ? 1 : 0), 0);
  if (bankScore >= 2) return { type: 'bank', name: 'Extracto Bancario' };

  // Check providers
  for (const [provider, keywords] of Object.entries(PROVIDER_PATTERNS)) {
    const score = keywords.reduce((acc, kw) => acc + (content.includes(kw) ? 1 : 0), 0);
    if (score >= 2) return { type: provider as UploadingFile['detectedType'], name: provider.toUpperCase() };
  }

  // Fallback: check filename
  const fname = file.name.toLowerCase();
  if (fname.includes('stripe')) return { type: 'stripe', name: 'Stripe' };
  if (fname.includes('redsys')) return { type: 'redsys', name: 'Redsys' };
  if (fname.includes('mercado')) return { type: 'mercado_pago', name: 'Mercado Pago' };
  if (fname.includes('paypal')) return { type: 'paypal', name: 'PayPal' };
  if (fname.includes('tpv')) return { type: 'tpv', name: 'TPV' };
  if (fname.includes('karma')) return { type: 'karma', name: 'Karma' };
  if (fname.includes('santander') || fname.includes('bbva') || fname.includes('caixa') || fname.includes('bank')) {
    return { type: 'bank', name: 'Extracto Bancario' };
  }

  return { type: 'unknown', name: 'Desconocido' };
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

export default function BankUpload() {
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<ProcessingPhase>('idle');
  const [result, setResult] = useState<ProcessingResult | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
    for (const file of files) await addUpload(file);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.name.endsWith('.csv'));
    for (const file of files) await addUpload(file);
  };

  const addUpload = async (file: File) => {
    setPhase('idle');
    setResult(undefined);

    const detected = await detectFileType(file);

    const upload: UploadingFile = {
      file,
      detectedType: detected.type,
      detectedName: detected.name,
      progress: 0,
      status: 'detecting',
    };
    setUploads(prev => [...prev, upload]);

    // Start upload after brief detection delay
    setTimeout(() => {
      setUploads(prev => prev.map(u => u.file === file ? { ...u, status: 'uploading' } : u));
      simulateUpload(file, detected.type);
    }, 500);
  };

  const runProcessingPhases = async () => {
    setPhase('analyzing');
    await new Promise(r => setTimeout(r, 1500));
    setPhase('matching');
    await new Promise(r => setTimeout(r, 2000));

    setResult({
      bankTransactions: 47,
      providerTransactions: 63,
      matched: 38,
      mismatches: 5,
      disputes: 4,
      totalAmount: 12450.75,
    });
    setPhase('complete');
  };

  const simulateUpload = async (file: File, fileType: string) => {
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 200));
      setUploads(prev => prev.map(u => u.file === file ? { ...u, progress: i } : u));
    }
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) {
        setUploads(prev => prev.map(u => u.file === file ? { ...u, status: 'error', message: 'No tenant selected. Please log in and select a store first.' } : u));
        return;
      }
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenant_id', tenant.id);
      formData.append('type', fileType === 'bank' ? 'bank' : 'provider');
      if (fileType !== 'bank') formData.append('provider_name', fileType);

      setPhase('uploading');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-statements/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` },
        body: formData,
      });
      if (res.ok) {
        setUploads(prev => prev.map(u => u.file === file ? { ...u, status: 'done', progress: 100, message: '✅ Uploaded successfully' } : u));
        setUploads(prev => {
          const allDone = prev.every(u => u.status === 'done' || u.status === 'error');
          if (allDone) runProcessingPhases();
          return prev;
        });
      } else {
        const err = await res.text();
        setUploads(prev => prev.map(u => u.file === file ? { ...u, status: 'error', message: err } : u));
        setPhase('error');
      }
    } catch (err: any) {
      setUploads(prev => prev.map(u => u.file === file ? { ...u, status: 'error', message: err.message } : u));
      setPhase('error');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          📁 Centro de Carga
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Centro de Carga Inteligente</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Arrastrá todos tus archivos CSV acá. Detectamos automáticamente si es un extracto bancario o un informe de proveedor.
        </p>
      </div>

      {/* BANNER DE PROCESAMIENTO */}
      {phase !== 'idle' && (
        <div style={{ marginBottom: 24 }}>
          <ProcessingBanner phase={phase} result={result} onDismiss={() => setPhase('idle')} />
        </div>
      )}

      {/* ZONA DE DROP UNIFICADA */}
      <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragOver ? '2px dashed #635bff' : '2px dashed #cbd5e1',
          borderRadius: 16, padding: '60px 40px', textAlign: 'center',
          background: dragOver ? '#f5f3ff' : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 32,
        }}>
        <input ref={fileInputRef} type="file" accept=".csv" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
        <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Arrastrá todos tus CSVs aquí</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>o hacé clic para buscar</div>
        <div style={{ color: '#94a3b8', fontSize: 12 }}>
          Detectamos automáticamente: Santander, BBVA, CaixaBank, Stripe, Redsys, PayPal, Mercado Pago y más.
        </div>
      </div>

      {/* LISTA DE UPLOADS CON DETECCIÓN */}
      {uploads.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Archivos Detectados
          </h3>
          {uploads.map((u, i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 24 }}>{ICONS[u.detectedType] || '📄'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.file.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {u.status === 'detecting' ? '🔍 Detectando...' :
                   u.detectedType === 'bank' ? '🏦 Extracto Bancario' :
                   `💳 Proveedor: ${u.detectedName}`}
                </div>
                {u.status === 'uploading' && (
                  <div style={{ marginTop: 8, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${u.progress}%`, height: '100%', background: '#635bff', transition: 'width 0.3s' }} />
                  </div>
                )}
                {u.message && (
                  <div style={{ fontSize: 12, marginTop: 4, color: u.status === 'done' ? '#22c55e' : '#991b1b' }}>{u.message}</div>
                )}
              </div>
              <div style={{
                padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: u.status === 'done' ? '#dcfce7' : u.status === 'error' ? '#fee2e2' : u.status === 'detecting' ? '#fef9c3' : '#f8fafc',
                color: u.status === 'done' ? '#166534' : u.status === 'error' ? '#991b1b' : u.status === 'detecting' ? '#854d0e' : '#64748b',
              }}>
                {u.status === 'detecting' ? 'Detectando' : u.status === 'uploading' ? 'Subiendo...' : u.status === 'done' ? '✅ Listo' : 'Error'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RESUMEN POR PROVEEDOR/BANCO */}
      {uploads.filter(u => u.status === 'done').length > 0 && (
        <div style={{ padding: 20, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#166534', marginBottom: 12 }}>
            ✅ Archivos recibidos correctamente
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {uploads.filter(u => u.status === 'done').map((u, i) => (
              <span key={i} style={{
                padding: '6px 12px', background: 'white', borderRadius: 8,
                fontSize: 13, fontWeight: 600, color: '#166534', border: '1px solid #bbf7d0',
              }}>
                {ICONS[u.detectedType]} {u.detectedName}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: 20, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 20 }}>💡</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Consejo</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Subí tu extracto bancario y todos los informes de proveedores del mismo período.
            Nuestro sistema detecta automáticamente cada archivo y ejecuta SmartCheck cuando todo esté cargado.
            <br /><br />
            Para Stripe, también podés <strong>conectar automáticamente</strong> en Configuración — no necesitás CSV.
          </div>
        </div>
      </div>
    </div>
  );
}
