import { useState } from 'react';

interface Column {
  key: string;
  label: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  data: any[];
  columns: Column[];
  dateField?: string;
}

// Color helpers for status/health values
const getStatusColor = (val: string) => {
  const v = String(val).toLowerCase();
  if (v.includes('matched') || v.includes('healthy') || v.includes('resolved')) return { bg: '#dcfce7', text: '#166534' };
  if (v.includes('unmatched') || v.includes('at risk') || v.includes('unresolved')) return { bg: '#fee2e2', text: '#991b1b' };
  if (v.includes('warning') || v.includes('watch') || v.includes('disputed')) return { bg: '#fef3c7', text: '#92400e' };
  return { bg: '#f8fafc', text: '#64748b' };
};

const getAmountColor = (val: number | string) => {
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : Number(val);
  if (isNaN(n)) return '#0f172a';
  return n >= 0 ? '#166534' : '#991b1b';
};

export default function ExportModal({
  isOpen,
  onClose,
  title,
  filename,
  data,
  columns,
  dateField = 'date',
}: ExportModalProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  if (!isOpen) return null;

  const filterByDate = (items: any[]) => {
    if (!fromDate && !toDate) return items;
    return items.filter((item) => {
      const d = item[dateField];
      if (!d) return true;
      const itemDate = new Date(d);
      if (fromDate && itemDate < new Date(fromDate)) return false;
      if (toDate && itemDate > new Date(toDate + 'T23:59:59')) return false;
      return true;
    });
  };

  const filtered = filterByDate(data);

  const escapeCSV = (val: any) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const generateCSV = () => {
    const header = columns.map((c) => c.label).join(',');
    const rows = filtered.map((row) => columns.map((c) => escapeCSV(row[c.key])).join(','));
    return [header, ...rows].join('\n');
  };

  const downloadCSV = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const downloadExcel = () => {
    const header = columns.map((c) => `<th style="background:#635bff;color:#fff;padding:10px;text-align:left;font-size:12px;font-weight:700;border:1px solid #4f46e5">${c.label}</th>`).join('');
    const rows = filtered.map((row, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = columns.map((c) => {
        const val = row[c.key];
        const statusColor = getStatusColor(val);
        const isStatus = typeof val === 'string' && (val.includes('Healthy') || val.includes('At Risk') || val.includes('Watch') || val.includes('matched') || val.includes('unmatched') || val.includes('resolved') || val.includes('disputed'));
        const style = isStatus 
          ? `style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;background:${statusColor.bg};color:${statusColor.text};font-weight:700;border-radius:4px;display:inline-block;margin:4px"` 
          : `style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:12px;background:${bg}"`;
        return `<td ${style}>${val ?? ''}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8">
      <style>
        body{font-family:Arial,sans-serif;padding:20px;background:#f8fafc}
        .container{max-width:900px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
        .header{background:#635bff;color:white;padding:24px 32px}
        .header h1{margin:0;font-size:22px;font-weight:800}
        .header p{margin:6px 0 0 0;font-size:13px;opacity:0.9}
        .meta{padding:16px 32px;background:#f1f5f9;font-size:12px;color:#64748b;border-bottom:1px solid #e2e8f0}
        table{width:100%;border-collapse:collapse}
        .footer{padding:20px 32px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;text-align:center}
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ClearFlow — ${title}</h1>
            <p>Professional reconciliation report</p>
          </div>
          <div class="meta">
            Generated: ${new Date().toLocaleDateString('es-ES')} · ${filtered.length} records · Period: ${fromDate || 'Start'} → ${toDate || 'Today'}
          </div>
          <table>
            <thead><tr>${header}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">
            ClearFlow S.L. · Confidential Report · For internal use only
          </div>
        </div>
      </body></html>
    `;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const downloadPDF = () => {
    const header = columns.map((c) => 
      `<th style="background:#635bff;color:#fff;padding:12px 10px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid rgba(255,255,255,0.1)">${c.label}</th>`
    ).join('');

    const rows = filtered.map((row, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = columns.map((c) => {
        const val = row[c.key];
        const statusColor = getStatusColor(val);
        const isStatus = typeof val === 'string' && (val.includes('Healthy') || val.includes('At Risk') || val.includes('Watch') || val.includes('matched') || val.includes('unmatched') || val.includes('resolved') || val.includes('disputed'));
        const isAmount = ['amount', 'expected', 'received', 'difference', 'revenue', 'fees', 'costs', 'net', 'gross', 'feeamount', 'bankamount', 'provideramount'].includes(c.key.toLowerCase());

        let cellStyle = `padding:10px;border-bottom:1px solid #e2e8f0;font-size:12px;background:${bg}`;

        if (isStatus) {
          cellStyle = `padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;background:${statusColor.bg};color:${statusColor.text};font-weight:700;border-radius:12px;display:inline-block;margin:4px 0`;
          return `<td style="padding:10px;border-bottom:1px solid #e2e8f0;background:${bg}"><span style="${cellStyle}">${val}</span></td>`;
        }

        if (isAmount && typeof val === 'number') {
          const color = getAmountColor(val);
          return `<td style="${cellStyle};color:${color};font-weight:700;text-align:right">${val >= 0 && !String(val).startsWith('+') ? '+' : ''}${val.toLocaleString('es-ES')} €</td>`;
        }

        if (c.key.toLowerCase().includes('pct') || c.key.toLowerCase().includes('margin')) {
          return `<td style="${cellStyle};font-weight:600;color:#635bff">${val}</td>`;
        }

        return `<td style="${cellStyle};color:#0f172a">${val ?? ''}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const dateRange = fromDate || toDate ? `<p style="margin:0 0 16px 0;color:#64748b;font-size:13px"><strong>Period:</strong> ${fromDate || 'Start'} → ${toDate || 'Today'}</p>` : '';

    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        body{font-family:'Inter',Arial,sans-serif;color:#0f172a;padding:0;margin:0;background:#f8fafc}
        .page{max-width:900px;margin:0 auto;background:white;min-height:100vh;box-shadow:0 0 40px rgba(0,0,0,0.06)}
        .brand-bar{height:6px;background:#635bff}
        .header{padding:40px 48px 32px;background:white;border-bottom:1px solid #f1f5f9}
        .brand{display:flex;align-items:center;gap:12px;margin-bottom:20px}
        .brand-logo{width:36px;height:36px;border-radius:10px;background:#635bff;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px}
        .brand-name{font-weight:800;font-size:20px;letter-spacing:-0.5px}
        h1{margin:0 0 8px 0;font-size:26px;font-weight:800;color:#0f172a}
        .subtitle{margin:0 0 16px 0;color:#64748b;font-size:14px}
        .meta-badge{display:inline-flex;align-items:center;gap:8px;background:#f1f5f9;padding:8px 16px;border-radius:8px;font-size:12px;color:#64748b;font-weight:600}
        .content{padding:32px 48px}
        table{width:100%;border-collapse:separate;border-spacing:0;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}
        th{background:#635bff;color:#fff;padding:12px 10px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
        td{padding:10px;border-bottom:1px solid #f1f5f9;font-size:12px}
        tr:hover td{background:#f8fafc !important}
        .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:32px 48px}
        .summary-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center}
        .summary-label{font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px}
        .summary-value{font-size:24px;font-weight:800;color:#0f172a}
        .footer{margin-top:40px;padding:24px 48px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;text-align:center;background:#fafafa}
        @media print{
          body{background:white !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
          .page{box-shadow:none}
        }
      </style></head><body>
      <div class="page">
        <div class="brand-bar"></div>
        <div class="header">
          <div class="brand"><div class="brand-logo">C</div><div class="brand-name">ClearFlow</div></div>
          <h1>${title}</h1>
          <p class="subtitle">Professional reconciliation and financial intelligence report</p>
          <div class="meta-badge">
            <span>📅 ${new Date().toLocaleDateString('es-ES')}</span>
            <span>·</span>
            <span>${filtered.length} records</span>
            ${fromDate || toDate ? `<span>·</span><span>Filtered period</span>` : ''}
          </div>
          ${dateRange}
        </div>
        <div class="content">
          <table>
            <thead><tr>${header}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="footer">
          ClearFlow S.L. · Confidential Report · Generated for internal analysis and provider negotiation
        </div>
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
      </body></html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
    onClose();
  };

  const handleExport = () => {
    if (format === 'csv') downloadCSV();
    else if (format === 'excel') downloadExcel();
    else downloadPDF();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Export Report</h2>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 24px 0' }}>{title}</p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date Range</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>→</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Format</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['pdf', 'excel', 'csv'] as const).map((f) => (
              <button key={f} onClick={() => setFormat(f)} style={{
                flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid #e2e8f0',
                background: format === f ? '#635bff' : 'white',
                color: format === f ? 'white' : '#64748b',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase',
                transition: 'all 0.15s',
                boxShadow: format === f ? '0 4px 12px rgba(99,91,255,0.3)' : 'none',
              }}>
                {f === 'pdf' ? '📄 PDF' : f === 'excel' ? '📊 Excel' : '📋 CSV'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Cancel</button>
          <button onClick={handleExport} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0f172a', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Export {filtered.length} Records
          </button>
        </div>
      </div>
    </div>
  );
}