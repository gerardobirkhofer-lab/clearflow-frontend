import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

interface BankLine {
  id: number;
  concept: string;
  amount: number;
  date: string;
  matched: boolean;
}

export default function RevenueControl() {
  const [lines, setLines] = useState<BankLine[]>([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    if (!tenant.id) {
      setError('No hay cuenta configurada.');
      return;
    }
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/bank-statements/?tenant_id=${tenant.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('No se pudo leer el extracto');
        const data = await res.json();
        const parsed: BankLine[] = (data.transactions || []).map((row: any) => ({
          id: row.id,
          concept: row.concept || 'Movimiento',
          amount: Number(row.amount) || 0,
          date: (row.transaction_date || '').split('T')[0],
          matched: !!row.matched,
        }));
        setLines(parsed);
        const days = Array.from(new Set(parsed.map((row) => row.date).filter(Boolean)));
        setSelectedDay(days[0] || '');
      })
      .catch((err) => setError(err.message));
  }, []);

  const days = Array.from(new Set(lines.map((row) => row.date).filter(Boolean)));
  const dayLines = lines.filter((row) => row.date === selectedDay);
  const dayTotal = dayLines.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          Control de ingresos
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Movimientos en banco</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Importes tomados del extracto subido. No hay facturas ni comisiones estimadas en esta vista.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 10, background: '#fef2f2', color: '#991b1b' }}>{error}</div>
      )}

      {days.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', color: '#64748b' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏦</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Todavía no hay extractos</div>
          <div>Sube un CSV bancario en SmartCheck para ver el dinero que llegó a la cuenta.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: selectedDay === day ? '#0f172a' : 'white',
                  color: selectedDay === day ? 'white' : '#64748b',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {day}
              </button>
            ))}
          </div>
          <div style={{ padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 700 }}>En banco el {selectedDay}</div>
              <div style={{ fontWeight: 800 }}>{formatMoney(dayTotal)}</div>
            </div>
            {dayLines.map((row) => (
              <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{row.concept}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{row.matched ? 'Conciliado' : 'Sin contrapartida'}</div>
                </div>
                <div style={{ fontWeight: 700, color: row.amount < 0 ? '#991b1b' : '#166534' }}>{formatMoney(row.amount)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
