import { useState, useCallback } from 'react';

interface Props {
  onUploadComplete: (data: any) => void;
}

export default function BankUploadZone({ onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) uploadFile(files[0]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) uploadFile(files[0]);
  };

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.CSV')) {
      setError('Only CSV files are accepted');
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-statements/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      onUploadComplete(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#635bff' : '#cbd5e1'}`,
          borderRadius: 12,
          padding: '40px 20px',
          textAlign: 'center',
          background: isDragging ? '#f5f3ff' : '#f8fafc',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
          {uploading ? 'Uploading...' : 'Drop your bank CSV here'}
        </div>
        <div style={{ color: '#64748b', fontSize: 14 }}>or click to open Finder</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 12 }}>
          Supports: Santander, BBVA, CaixaBank, Sabadell, generic CSV
        </div>
        <input id="file-input" type="file" accept=".csv,.CSV,.txt" onChange={handleFileSelect} style={{ display: 'none' }} />
      </div>
      {error && (
        <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, fontSize: 14 }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}
