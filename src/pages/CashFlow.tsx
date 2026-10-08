import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const API = import.meta.env.VITE_API_URL;

const KINDS = [
  { value: 'rent', label: 'Alquiler' },
  { value: 'salary', label: 'Sueldos' },
  { value: 'wage', label: 'Jornales' },
  { value: 'supplier', label: 'Proveedores' },
  { value: 'tax', label: 'Impuestos' },
  { value: 'other', label: 'Otro' },
];

type ExpenseItem = {
  id: number;
  kind: string;
  kind_label: string;
  concept: string;
  amount: number;
  due_day?: number | null;
};

type Outlook = {
  waiting_amount: number;
  has_expenses: boolean;
  expenses_monthly: number;
  left_after_expenses: number;
  expenses: ExpenseItem[];
};

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json',
  };
}

function euros(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

export default function CashFlow() {
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const [outlook, setOutlook] = useState<Outlook | null>(null);
  const [kind, setKind] = useState('rent');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!tenant?.id) {
      setError('Falta elegir la empresa.');
      setLoading(false);
      return;
    }
    const response = await fetch(`${API}/api/v1/expenses/outlook?tenant_id=${tenant.id}`, { headers: authHeaders() });
    const data = await response.json();
    if (!response.ok) {
      setError(typeof data.detail === 'string' ? data.detail : 'No se pudo leer el flujo de caja.');
      setLoading(false);
      return;
    }
    setOutlook(data);
    setError('');
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tenant?.id]);

  const addExpense = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!amount.trim()) {
      setError('Escribe un importe aproximado.');
      return;
    }
    const response = await fetch(`${API}/api/v1/expenses?tenant_id=${tenant.id}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ kind, concept, amount, due_day: dueDay || null }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(typeof data.detail === 'string' ? data.detail : 'No se pudo guardar el gasto.');
      return;
    }
    setConcept('');
    setAmount('');
    setDueDay('');
    await load();
  };

  const removeExpense = async (id: number) => {
    setError('');
    const response = await fetch(`${API}/api/v1/expenses/${id}?tenant_id=${tenant.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(typeof data.detail === 'string' ? data.detail : 'No se pudo quitar el gasto.');
      return;
    }
    await load();
  };

  return (
    <main style={pageStyle}>
      <div style={panelStyle}>
        <BackButton />
        <p style={eyebrowStyle}>Flujo de caja</p>
        <h1 style={titleStyle}>Lo que entra y lo que sale</h1>
        <p style={leadStyle}>
          Lo que todavía debe entrar sale de los cobros pendientes. El día, el local y las ventas pasadas
          se cargan en <Link to="/setup">Setup</Link>.
        </p>

        <section style={answerStyle} aria-label="Resultado del mes">
          {loading && <p style={mutedStyle}>Calculando…</p>}
          {!loading && outlook && (
            <>
              <div style={countRow}>
                <div>
                  <div style={countNumber}>{euros(outlook.waiting_amount)}</div>
                  <div style={countLabel}>deben entrar</div>
                </div>
                <div>
                  <div style={countNumber}>{euros(outlook.expenses_monthly)}</div>
                  <div style={countLabel}>salen cada mes</div>
                </div>
                <div>
                  <div style={countNumber}>{outlook.has_expenses ? euros(outlook.left_after_expenses) : '—'}</div>
                  <div style={countLabel}>quedarían</div>
                </div>
              </div>
              <p style={feeStyle}>
                {outlook.has_expenses
                  ? 'Quedarían es lo que todavía debe entrar, menos los gastos que escribiste. Un número negativo significa que esos gastos no están cubiertos por cobros pendientes.'
                  : 'Añade el alquiler, los sueldos y el resto para ver qué queda.'}
              </p>
            </>
          )}
        </section>

        <section style={{ marginTop: 28 }} aria-label="Tus gastos">
          <h2 style={toolsHeading}>Tus gastos</h2>
          <p style={mutedStyle}>Un concepto y un importe aproximado. Puedes corregirlo cuando quieras.</p>
          <form onSubmit={addExpense} style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {KINDS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={kind === item.value}
                  onClick={() => setKind(item.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: kind === item.value ? '1px solid #635bff' : '1px solid #e2e8f0',
                    background: kind === item.value ? '#eef2ff' : 'white',
                    color: kind === item.value ? '#4338ca' : '#334155',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 12 }}>
              <input
                aria-label="Concepto del gasto"
                value={concept}
                placeholder="Concepto, por ejemplo local de Marbella"
                onChange={(event) => setConcept(event.target.value)}
                style={fieldStyle}
              />
              <input
                aria-label="Importe aproximado al mes"
                value={amount}
                inputMode="decimal"
                placeholder="Importe al mes"
                onChange={(event) => setAmount(event.target.value)}
                style={fieldStyle}
              />
              <input
                aria-label="Día de pago"
                value={dueDay}
                inputMode="numeric"
                placeholder="Día del mes, por ejemplo 5"
                onChange={(event) => setDueDay(event.target.value)}
                style={fieldStyle}
              />
            </div>
            <button type="submit" style={{ ...primaryButton, marginTop: 12 }}>Añadir gasto</button>
          </form>
          {error && <p style={errorStyle}>{error}</p>}
          <div style={{ marginTop: 16 }}>
            {(outlook?.expenses || []).map((item) => (
              <div key={item.id} style={expenseRow}>
                <div>
                  <div style={{ fontWeight: 800 }}>{item.concept}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{item.kind_label} · al mes{item.due_day ? ` · día ${item.due_day}` : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <strong>{euros(item.amount)}</strong>
                  <button type="button" onClick={() => removeExpense(item.id)} style={quietButton}>Quitar</button>
                </div>
              </div>
            ))}
            {!loading && outlook && outlook.expenses.length === 0 && (
              <p style={mutedStyle}>Todavía no hay gastos.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#f8fafc',
  fontFamily: 'sans-serif',
  padding: '32px 16px 64px',
  color: '#0f172a',
};

const panelStyle = { maxWidth: 720, margin: '0 auto' };
const eyebrowStyle = { margin: '0 0 8px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' as const, color: '#635bff' };
const titleStyle = { margin: 0, fontSize: 32, fontWeight: 800, lineHeight: 1.15 };
const leadStyle = { margin: '12px 0 0', fontSize: 16, lineHeight: 1.5, color: '#334155' };
const answerStyle = { marginTop: 24, padding: 20, borderRadius: 16, background: 'white', border: '1px solid #e2e8f0' };
const countRow = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };
const countNumber = { fontSize: 22, fontWeight: 800 };
const countLabel = { fontSize: 13, color: '#64748b', marginTop: 2 };
const feeStyle = { margin: '16px 0 0', fontSize: 14, lineHeight: 1.45, color: '#334155' };
const mutedStyle = { margin: '8px 0 0', fontSize: 14, color: '#64748b', lineHeight: 1.45 };
const errorStyle = { margin: '12px 0 0', fontSize: 14, color: '#991b1b' };
const toolsHeading = { margin: 0, fontSize: 18, fontWeight: 800 };
const fieldStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 };
const primaryButton = { padding: '12px 18px', borderRadius: 10, border: 'none', background: '#635bff', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer' };
const quietButton = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' };
const expenseRow = { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12, alignItems: 'center', padding: '12px 0', borderTop: '1px solid #f1f5f9' };
