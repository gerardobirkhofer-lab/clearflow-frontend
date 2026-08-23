import { useState, useRef, useCallback } from 'react';
import BackButton from '../components/BackButton';
import ProcessingBanner from '../components/ProcessingBanner';

interface UploadingFile {
  file: File;
  type: 'bank' | 'provider';
  providerName?: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
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

export default function BankUpload() {
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'bank' | 'provider'>('bank');
  const [providerName, setProviderName] = useState('stripe');
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
    files.forEach(file => addUpload(file));
  }, [activeTab, providerName]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.name.endsWith('.csv'));
    files.forEach(file => addUpload(file));
  };

  const addUpload = (file: File) => {
    setPhase('idle');
    setResult(undefined);
    const upload: UploadingFile = {
      file,
      type: activeTab,
      providerName: activeTab === 'provider' ? providerName : undefined,
      progress: 0,
      status: 'uploading',
    };
    setUploads(prev => [...prev, upload]);
    simulateUpload(upload);
  };

  const runProcessingPhases = async () => {
    setPhase('analyzing');
    await new Promise(r => setTimeout(r, 1500));
    setPhase('matching');
    await new Promise(r => setTimeout(r, 2000));

    // Resultado simulado para demo
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

  const simulateUpload = async (upload: UploadingFile) => {
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 200));
      setUploads(prev => prev.map(u => u.file === upload.file ? { ...u, progress: i } : u));
    }
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      if (!tenant.id) {
        setUploads(prev => prev.map(u => u.file === upload.file ? { ...u, status: 'error', message: 'No tenant selected. Please log in and select a store first.' } : u));
        return;
      }
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', upload.file);
      formData.append('tenant_id', tenant.id);
      formData.append('type', upload.type);
      if (upload.providerName) formData.append('provider_name', upload.providerName);

      setPhase('uploading');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-statements/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` },
        body: formData,
      });
      if (res.ok) {
        setUploads(prev => prev.map(u => u.file === upload.file ? { ...u, status: 'done', progress: 100, message: 'Uploaded successfully' } : u));
        // Si todos los uploads están done, arrancar fases de procesamiento
        setUploads(prev => {
          const allDone = prev.every(u => u.status === 'done' || u.status === 'error');
          if (allDone) {
            runProcessingPhases();
          }
          return prev;
        });
      } else {
        const err = await res.text();
        setUploads(prev => prev.map(u => u.file === upload.file ? { ...u, status: 'error', message: err } : u));
        setPhase('error');
      }
    } catch (err: any) {
      setUploads(prev => prev.map(u => u.file === upload.file ? { ...u, status: 'error', message: err.message } : u));
      setPhase('error');
    }
  };

  const dropZoneText = activeTab === 'bank'
    ? 'Arrastrá tu CSV bancario aquí'
    : 'Drop your provider CSV here';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          📁 Centro de Carga
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Centro de Carga</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Cargá extractos bancarios e informes de proveedores en un solo lugar.
        </p>
      </div>

      {/* BANNER DE PROCESAMIENTO */}
      {phase !== 'idle' && (
        <div style={{ marginBottom: 24 }}>
          <ProcessingBanner phase={phase} result={result} onDismiss={() => setPhase('idle')} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('bank')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeTab === 'bank' ? '#0f172a' : 'white',
          color: activeTab === 'bank' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>🏦 Extracto Bancario</button>
        <button onClick={() => setActiveTab('provider')} style={{
          padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
          background: activeTab === 'provider' ? '#0f172a' : 'white',
          color: activeTab === 'provider' ? 'white' : '#64748b',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>💳 Informe de Proveedor</button>
      </div>

      {activeTab === 'provider' && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 12 }}>Provider:</label>
          <select value={providerName} onChange={(e) => setProviderName(e.target.value)} style={{
            padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, background: 'white',
          }}>
            <option value="stripe">Stripe</option>
            <option value="mercado_pago">Mercado Pago</option>
            <option value="tpv">TPV / Redsys</option>
            <option value="karma">Karma</option>
            <option value="paypal">PayPal</option>
            <option value="generic">Generic CSV</option>
          </select>
        </div>
      )}

      <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragOver ? '2px dashed #635bff' : '2px dashed #cbd5e1',
          borderRadius: 16, padding: '60px 40px', textAlign: 'center',
          background: dragOver ? '#f5f3ff' : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 32,
        }}>
        <input ref={fileInputRef} type="file" accept=".csv" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
        <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{dropZoneText}</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>o hacé clic para buscar</div>
        <div style={{ color: '#94a3b8', fontSize: 12 }}>
          Supports: Santander, BBVA, CaixaBank, Sabadell, generic CSV
        </div>
      </div>

      {uploads.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Uploads</h3>
          {uploads.map((u, i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 24 }}>{u.type === 'bank' ? '🏦' : '💳'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.file.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {u.type === 'bank' ? 'Extracto Bancario' : `Provider: ${u.providerName}`}
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
                background: u.status === 'done' ? '#dcfce7' : u.status === 'error' ? '#fee2e2' : '#f8fafc',
                color: u.status === 'done' ? '#166534' : u.status === 'error' ? '#991b1b' : '#64748b',
              }}>
                {u.status === 'uploading' ? 'Uploading...' : u.status === 'done' ? 'Done' : 'Error'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: 20, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 20 }}>💡</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Consejo</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Upload your bank statement and all provider reports for the same period, then go to <strong>Payment Check</strong> to run the matching algorithm.
            <br /><br />
            For Stripe, you can also <strong>connect automatically</strong> in Setup — no CSV needed.
          </div>
        </div>
      </div>
    </div>
  );
}
