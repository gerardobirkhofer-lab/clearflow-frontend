import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';

const API = import.meta.env.VITE_API_URL;

type SavedContract = {
  id: number;
  provider_name: string;
  fee_percent: number;
  fee_fixed: number;
  payout_days: number | null;
  close_weekday: string | null;
  filename: string | null;
};

const WEEKDAYS = [
  { value: '', label: 'Cualquier día' },
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

export default function Contract() {
  const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
  const tenantId = tenant.id as string | undefined;
  const [providerName, setProviderName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [feePercent, setFeePercent] = useState('');
  const [feeFixed, setFeeFixed] = useState('');
  const [payoutDays, setPayoutDays] = useState('');
  const [closeWeekday, setCloseWeekday] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<SavedContract[]>([]);
  const [busy, setBusy] = useState(false);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

  const loadSaved = async () => {
    if (!tenantId) return;
    const response = await fetch(`${API}/api/v1/companies/${tenantId}/contracts`, { headers: headers() });
    if (!response.ok) return;
    const data = await response.json();
    setSaved(data.items || []);
  };

  useEffect(() => {
    loadSaved();
  }, [tenantId]);

  const readFile = async (next: File) => {
    if (!tenantId) {
      setError('Entra en una empresa antes de subir el contrato.');
      return;
    }
    setFile(next);
    setError('');
    setNote('');
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', next);
      const response = await fetch(`${API}/api/v1/companies/${tenantId}/contracts/read`, {
        method: 'POST',
        headers: headers(),
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.detail === 'string' ? data.detail : 'No se pudo leer el archivo');
        return;
      }
      setFeePercent(data.fee_percent == null ? '' : String(data.fee_percent).replace('.', ','));
      setFeeFixed(data.fee_fixed == null ? '' : String(data.fee_fixed).replace('.', ','));
      setPayoutDays(data.payout_days == null ? '' : String(data.payout_days));
      setCloseWeekday(data.close_weekday || '');
      setNote(data.found
        ? 'Esto es lo que aparece en el archivo. Corrígelo si no es así, y guárdalo.'
        : 'No encuentro la comisión en este archivo. Escríbela abajo y guárdala.');
    } catch {
      setError('No se pudo contactar el servidor.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!tenantId) return;
    setError('');
    setBusy(true);
    try {
      const body = new FormData();
      body.append('provider_name', providerName.trim());
      body.append('fee_percent', feePercent.replace(',', '.') || '0');
      body.append('fee_fixed', feeFixed.replace(',', '.') || '0');
      body.append('payout_days', payoutDays.trim());
      body.append('close_weekday', closeWeekday);
      if (file) body.append('file', file);
      const response = await fetch(`${API}/api/v1/companies/${tenantId}/contracts`, {
        method: 'POST',
        headers: headers(),
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.detail === 'string' ? data.detail : 'No se pudo guardar');
        return;
      }
      setNote('Regla guardada. El control diario la usa a partir de ahora.');
      setProviderName('');
      setFile(null);
      setFeePercent('');
      setFeeFixed('');
      setPayoutDays('');
      setCloseWeekday('');
      await loadSaved();
    } catch {
      setError('No se pudo contactar el servidor.');
    } finally {
      setBusy(false);
    }
  };

  const weekdayLabel = (value: string | null) => WEEKDAYS.find((day) => day.value === value)?.label || 'Cualquier día';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Contrato</div>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>La comisión y el día del abono</h1>
      <p style={{ color: '#64748b', marginTop: 8 }}>
        Suelta el contrato que firmaste con el banco, el datáfono o la empresa que te paga.
        Revisamos el porcentaje, el fijo y los días. Tú confirmas. El control diario usa esa regla.
      </p>

      <div style={{ marginTop: 24, padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Empresa del contrato</label>
        <input
          value={providerName}
          onChange={(event) => setProviderName(event.target.value)}
          placeholder="TPV, Stripe, Booking"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginBottom: 8 }}
        />
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>El nombre tiene que coincidir con el de los cobros, por ejemplo TPV.</div>

        <label
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const next = event.dataTransfer.files?.[0];
            if (next) readFile(next);
          }}
          style={{ display: 'block', padding: 28, borderRadius: 12, border: '1px dashed #635bff', background: '#f8fafc', textAlign: 'center', cursor: 'pointer' }}
        >
          <input
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            style={{ display: 'none' }}
            onChange={(event) => {
              const next = event.target.files?.[0];
              if (next) readFile(next);
            }}
          />
          <div style={{ fontWeight: 700 }}>{file ? file.name : 'Suelta el PDF o el texto aquí'}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{busy ? 'Leyendo…' : 'También puedes hacer clic y elegirlo'}</div>
        </label>

        {note && <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#f0fdf4', color: '#166534', fontSize: 14 }}>{note}</div>}
        {error && <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: '#fef2f2', color: '#991b1b', fontSize: 14 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Porcentaje
            <input value={feePercent} onChange={(event) => setFeePercent(event.target.value)} placeholder="1,40" style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Fijo por operación (€)
            <input value={feeFixed} onChange={(event) => setFeeFixed(event.target.value)} placeholder="0,20" style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Días hasta el abono
            <input value={payoutDays} onChange={(event) => setPayoutDays(event.target.value)} placeholder="2" style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </label>
          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Cierre de la semana
            <select value={closeWeekday} onChange={(event) => setCloseWeekday(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}>
              {WEEKDAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={busy || !providerName.trim()}
          style={{ marginTop: 16, padding: '12px 18px', background: '#635bff', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >
          Guardar esta regla
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Reglas guardadas</h2>
        {saved.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 14 }}>Todavía no hay un contrato confirmado.</div>
        ) : saved.map((item) => (
          <div key={item.id} style={{ padding: '12px 0', borderTop: '1px solid #e2e8f0', fontSize: 14 }}>
            <strong>{item.provider_name}</strong>
            {' · '}{String(item.fee_percent).replace('.', ',')}% + {String(item.fee_fixed).replace('.', ',')} €
            {item.payout_days != null ? ` · ${item.payout_days} días` : ''}
            {item.close_weekday ? ` · cierre ${weekdayLabel(item.close_weekday)}` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
