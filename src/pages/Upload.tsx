import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const navigate = useNavigate();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setResult(null);
    
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    const token = localStorage.getItem('token');
    
    try {
      // Send files one by one
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenant_id', tenant.id);
        
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-statements/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Upload failed');
        setResult(`✅ ${data.message}`);
      }
      
      setFiles([]);
    } catch (err: any) {
      setResult(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Upload Documentation</h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>Drag and drop your bank statements or provider reports below.</p>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          padding: '60px 40px',
          borderRadius: 16,
          border: isDragging ? '3px dashed #635bff' : '2px dashed #cbd5e1',
          background: isDragging ? '#f5f3ff' : '#f8fafc',
          textAlign: 'center',
          transition: 'all 0.2s',
          cursor: 'pointer',
          marginBottom: 32,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
        <h3 style={{ margin: 0, color: '#0f172a' }}>
          {isDragging ? 'Drop files here!' : 'Drag & drop files here'}
        </h3>
        <p style={{ color: '#64748b', marginTop: 8 }}>or click to browse from your computer</p>
        <input
          type="file"
          multiple
          onChange={onFileSelect}
          style={{ display: 'none' }}
          id="file-input"
          accept=".csv,.xlsx,.xls"
        />
        <label
          htmlFor="file-input"
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '10px 24px',
            background: '#635bff',
            color: 'white',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Browse Files
        </label>
      </div>

      {files.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 12 }}>Selected Files ({files.length})</h3>
          {files.map((file, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: 'white',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                onClick={() => removeFile(i)}
                style={{
                  padding: '4px 12px',
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div style={{
          padding: 16,
          borderRadius: 8,
          background: result.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
          color: result.startsWith('✅') ? '#166534' : '#991b1b',
          marginBottom: 24,
          fontSize: 14,
        }}>
          {result}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={processFiles}
          disabled={files.length === 0 || uploading}
          style={{
            padding: '12px 32px',
            background: files.length > 0 && !uploading ? '#635bff' : '#cbd5e1',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: files.length > 0 && !uploading ? 'pointer' : 'not-allowed',
          }}
        >
          {uploading ? '⏳ Processing...' : '⚡ Process Files'}
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 32px',
            background: '#f1f5f9',
            color: '#475569',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
