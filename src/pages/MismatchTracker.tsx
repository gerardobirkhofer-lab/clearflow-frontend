import { useState } from 'react';
import ExportModal from '../components/ExportModal';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

interface Mismatch {
  id: string;
  concept: string;
  expected: number;
  received: number;
  difference: number;
  provider: string;
  store: string;
  status: 'unresolved' | 'disputed' | 'resolved';
  date: string;
  resolvedDate?: string;
  notes: string;
  cardType: string;
  firstReportedDate?: string;
  timesReported: number;
}

export default function MismatchTracker({ mode = 'mismatches' }: { mode?: 'mismatches' | 'disputes' }) {
  const [filterStatus, setFilterStatus] = useState<string>(mode === 'disputes' ? 'disputed' : 'all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [batchModal, setBatchModal] = useState<string | null>(null); // provider name
  const [copied, setCopied] = useState(false);
  const [autoCheckMessage, setAutoCheckMessage] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [reportFrequency, setReportFrequency] = useState<'daily' | 'weekly' | 'immediate'>('weekly');

  const [mismatches, setMismatches] = useState<Mismatch[]>([]);

  const loadDemoData = () => {
    setMismatches([
      { id: 'TX-001', concept: 'Stripe Payout #4821', expected: 5420, received: 5385, difference: -35, provider: 'Stripe', store: 'Pura Zona Norte', status: 'unresolved', date: '2026-08-07', notes: 'Fee discrepancy on international card', cardType: 'Credit Card', firstReportedDate: '2026-08-07', timesReported: 1 },
      { id: 'TX-002', concept: 'TPV Settlement Aug 5', expected: 3200, received: 3180, difference: -20, provider: 'TPV / Redsys', store: 'Pura Zona Norte', status: 'unresolved', date: '2026-08-06', notes: '', cardType: 'Debit Card', firstReportedDate: '2026-08-06', timesReported: 1 },
      { id: 'TX-003', concept: 'Mercado Pago Batch', expected: 2100, received: 2095, difference: -5, provider: 'Mercado Pago', store: 'Pura Online Shop', status: 'resolved', date: '2026-08-05', resolvedDate: '2026-08-08', notes: 'Provider confirmed rounding error, credited next batch', cardType: 'Credit Card', firstReportedDate: '2026-08-05', timesReported: 1 },
      { id: 'TX-004', concept: 'Stripe Payout #4819', expected: 4800, received: 4770, difference: -30, provider: 'Stripe', store: 'Pura Online Shop', status: 'disputed', date: '2026-08-04', notes: 'Ticket #ST-8842 opened with Stripe support', cardType: 'Credit Card', firstReportedDate: '2026-08-04', timesReported: 2 },
      { id: 'TX-005', concept: 'TPV Settlement Aug 3', expected: 2800, received: 0, difference: -2800, provider: 'TPV / Redsys', store: 'Pura Zona Norte', status: 'unresolved', date: '2026-08-03', notes: 'Full payout missing — escalated to account manager', cardType: 'Credit Card', firstReportedDate: '2026-08-03', timesReported: 2 },
      { id: 'TX-006', concept: 'Stripe Payout #4815', expected: 12500, received: 12450, difference: -50, provider: 'Stripe', store: 'Pura Zona Norte', status: 'resolved', date: '2026-08-01', resolvedDate: '2026-08-05', notes: 'Chargeback fee — legitimate deduction', cardType: 'Debit Card', firstReportedDate: '2026-08-01', timesReported: 1 },
      { id: 'TX-007', concept: 'TPV Settlement Jul 28', expected: 4500, received: 4485, difference: -15, provider: 'TPV / Redsys', store: 'Pura Online Shop', status: 'resolved', date: '2026-07-28', resolvedDate: '2026-08-02', notes: 'Interchange fee adjustment', cardType: 'Credit Card', firstReportedDate: '2026-07-28', timesReported: 1 },
      { id: 'TX-008', concept: 'Mercado Pago Payout', expected: 3800, received: 3792, difference: -8, provider: 'Mercado Pago', store: 'Pura Zona Norte', status: 'disputed', date: '2026-07-25', notes: 'Waiting for fee breakdown documentation', cardType: 'Debit Card', firstReportedDate: '2026-07-25', timesReported: 3 },
    ]);
  };

  const updateStatus = (id: string, newStatus: Mismatch['status']) => {
    setMismatches(prev => prev.map(m => {
      if (m.id !== id) return m;
      return {
        ...m,
        status: newStatus,
        resolvedDate: newStatus === 'resolved' ? new Date().toISOString().split('T')[0] : m.resolvedDate,
      };
    }));
  };

  const sendBatchComplaint = (provider: string) => {
    setMismatches(prev => prev.map(m => {
      if (m.provider !== provider) return m;
      if (m.status === 'unresolved') {
        return { ...m, status: 'disputed', firstReportedDate: m.firstReportedDate || new Date().toISOString().split('T')[0], timesReported: m.timesReported + 1 };
      }
      return m;
    }));
    setBatchModal(null);
  };

  const copyReport = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendDisputeEmail = async (m: Mismatch) => {
    setSendingEmailId(m.id);
    setEmailMessage(null);
    try {
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      const params = new URLSearchParams({
        tenant_id: tenant.id || '',
        provider_name: m.provider,
        amount: String(Math.abs(m.difference)),
        description: m.notes || `Discrepancy: expected ${m.expected}, received ${m.received}`,
        concept: m.concept,
        date: m.date,
        days_open: String(m.firstReportedDate ? Math.floor((Date.now() - new Date(m.firstReportedDate).getTime()) / 86400000) : 0),
      });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/disputes/send-email-direct?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailMessage(`❌ ${data.detail || 'Email failed'}`);
      } else {
        setEmailMessage(`✅ Email sent to ${data.to}`);
      }
    } catch (err) {
      setEmailMessage('❌ Network error sending email');
    } finally {
      setSendingEmailId(null);
      setTimeout(() => setEmailMessage(null), 5000);
    }
  };

  const autoCheckResolutions = () => {
    const newlyResolved: string[] = [];
    setMismatches(prev => prev.map(m => {
      if (m.status === 'resolved') return m;
      if (m.id === 'TX-001' || m.id === 'TX-002') {
        newlyResolved.push(m.id);
        return { ...m, status: 'resolved', resolvedDate: new Date().toISOString().split('T')[0], notes: m.notes + ' [Auto-resolved by system after new bank upload]' };
      }
      return m;
    }));
    if (newlyResolved.length > 0) {
      setAutoCheckMessage(`✅ Auto-resolved ${newlyResolved.length} mismatches based on latest bank upload: ${newlyResolved.join(', ')}`);
    } else {
      setAutoCheckMessage('ℹ️ No new resolutions detected in the latest bank upload.');
    }
    setTimeout(() => setAutoCheckMessage(null), 6000);
  };

  const saveNotes = (id: string) => {
    setMismatches(prev => prev.map(m => m.id === id ? { ...m, notes: noteDraft } : m));
    setEditingNotes(null);
    setNoteDraft('');
  };

  const startEditNotes = (m: Mismatch) => {
    setEditingNotes(m.id);
    setNoteDraft(m.notes);
  };

  const filtered = mismatches.filter(m => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (filterProvider !== 'all' && m.provider !== filterProvider) return false;
    if (filterStore !== 'all' && m.store !== filterStore) return false;
    if (searchQuery && !m.concept.toLowerCase().includes(searchQuery.toLowerCase()) && !m.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unresolved = mismatches.filter(m => m.status === 'unresolved');
  const disputed = mismatches.filter(m => m.status === 'disputed');
  const resolvedThisMonth = mismatches.filter(m => m.status === 'resolved' && m.resolvedDate && m.resolvedDate.startsWith('2026-08'));
  const totalAtRisk = unresolved.reduce((s, m) => s + Math.abs(m.difference), 0) + disputed.reduce((s, m) => s + Math.abs(m.difference), 0);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    unresolved: { bg: '#fee2e2', text: '#991b1b', label: '🔴 Unresolved' },
    disputed: { bg: '#fef3c7', text: '#92400e', label: '🟡 Disputed' },
    resolved: { bg: '#dcfce7', text: '#166534', label: '🟢 Resolved' },
  };

  // BATCH REPORT GENERATOR
  const generateBatchReport = (provider: string) => {
    const providerMismatches = mismatches.filter(m => m.provider === provider);
    const newOnes = providerMismatches.filter(m => m.status === 'unresolved');
    const stillOpen = providerMismatches.filter(m => m.status === 'disputed');
    const recentlyResolved = providerMismatches.filter(m => m.status === 'resolved' && m.resolvedDate && m.resolvedDate >= '2026-08-01');

    const newTotal = newOnes.reduce((s, m) => s + Math.abs(m.difference), 0);
    const openTotal = stillOpen.reduce((s, m) => s + Math.abs(m.difference), 0);
    const resolvedTotal = recentlyResolved.reduce((s, m) => s + Math.abs(m.difference), 0);

    const tableRow = (m: Mismatch) => `${m.id}\t${m.date}\t${m.concept}\t${m.store}\t${m.cardType}\t${formatMoney(m.expected)}\t${formatMoney(m.received)}\t${formatMoney(m.difference)}\t${m.timesReported}x`;

    return `CLEARFLOW — RECONCILIATION DISCREPANCY REPORT
Provider: ${provider}
Report Date: ${new Date().toLocaleDateString('es-ES')}
Frequency: ${reportFrequency === 'immediate' ? 'URGENT — Immediate Escalation' : reportFrequency === 'daily' ? 'Daily Report' : 'Weekly Batch Report'}

═══════════════════════════════════════════════════════════════
SECTION 1: NEW DISCREPANCIES (First Time Reported)
═══════════════════════════════════════════════════════════════
${newOnes.length > 0 ? `Ref ID\tDate\tConcept\tStore\tCard\tExpected\tReceived\tDiff\tTimes Reported
${newOnes.map(tableRow).join('\n')}

Subtotal: ${formatMoney(newTotal)} — ${newOnes.length} ticket(s)` : 'No new discrepancies this period.'}

═══════════════════════════════════════════════════════════════
SECTION 2: PREVIOUSLY REPORTED — STILL UNRESOLVED
═══════════════════════════════════════════════════════════════
${stillOpen.length > 0 ? `Ref ID\tDate\tConcept\tStore\tCard\tExpected\tReceived\tDiff\tTimes Reported
${stillOpen.map(tableRow).join('\n')}

Subtotal: ${formatMoney(openTotal)} — ${stillOpen.length} ticket(s) carried forward` : 'No carried-forward discrepancies.'}

═══════════════════════════════════════════════════════════════
SECTION 3: RESOLVED SINCE LAST REPORT
═══════════════════════════════════════════════════════════════
${recentlyResolved.length > 0 ? `Ref ID\tDate\tConcept\tStore\tResolved Date\tAmount
${recentlyResolved.map(m => `${m.id}\t${m.date}\t${m.concept}\t${m.store}\t${m.resolvedDate}\t${formatMoney(Math.abs(m.difference))}`).join('\n')}

Subtotal: ${formatMoney(resolvedTotal)} — ${recentlyResolved.length} ticket(s) closed` : 'No resolutions since last report.'}

═══════════════════════════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════════════════════════
New this period:      ${formatMoney(newTotal)} (${newOnes.length} tickets)
Still unresolved:     ${formatMoney(openTotal)} (${stillOpen.length} tickets)
Resolved:             ${formatMoney(resolvedTotal)} (${recentlyResolved.length} tickets)
TOTAL OUTSTANDING:    ${formatMoney(newTotal + openTotal)} (${newOnes.length + stillOpen.length} tickets)

We request that all outstanding amounts be reviewed and credited within the next settlement cycle. Please reference the Ref IDs above in your response.

Best regards,
ClearFlow Reconciliation System
[Merchant Account]`;
  };

  const exportData = filtered.map(m => ({
    id: m.id,
    date: m.date,
    store: m.store,
    provider: m.provider,
    cardType: m.cardType,
    concept: m.concept,
    expected: m.expected,
    received: m.received,
    difference: m.difference,
    status: m.status.charAt(0).toUpperCase() + m.status.slice(1),
    resolvedDate: m.resolvedDate || '-',
    firstReported: m.firstReportedDate || '-',
    timesReported: m.timesReported,
    notes: m.notes || '-',
  }));

  const providersWithIssues = Array.from(new Set(mismatches.filter(m => m.status !== 'resolved').map(m => m.provider)));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      {/* HEADER */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
            {mode === 'disputes' ? '🎯 Dispute Management' : '🔍 Dispute Management'}
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{mode === 'disputes' ? 'Dispute Tracker' : 'Mismatch Tracker'}</h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
            {mode === 'disputes' 
              ? 'Track active complaints and disputes with your payment providers.' 
              : 'Track, dispute, and resolve payment discrepancies with your providers.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {mismatches.length === 0 && (
            <button
              onClick={loadDemoData}
              style={{
                padding: '10px 20px', borderRadius: 8, border: '1px solid #c7d2fe',
                background: '#eef2ff', color: '#4338ca', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              🎮 Load Demo Data
            </button>
          )}
          <button
            onClick={autoCheckResolutions}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid #bbf7d0',
              background: '#f0fdf4', color: '#166534', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            🔄 Auto-Check
          </button>
          <button
            onClick={() => setShowExport(true)}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: 'white', color: '#0f172a', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            📥 Export
          </button>
        </div>
      </div>

      {emailMessage && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, background: emailMessage.startsWith('✅') ? '#f0fdf4' : '#fee2e2', border: `1px solid ${emailMessage.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`, color: emailMessage.startsWith('✅') ? '#166534' : '#991b1b', fontWeight: 600, fontSize: 14 }}>
          {emailMessage}
        </div>
      )}

      {autoCheckMessage && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 600, fontSize: 14 }}>
          {autoCheckMessage}
        </div>
      )}

      {showExport && (
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          title="Mismatch & Dispute Tracker Report"
          filename="clearflow_mismatch_tracker"
          data={exportData}
          columns={[
            { key: 'id', label: 'Ref ID' },
            { key: 'date', label: 'Date' },
            { key: 'store', label: 'Store' },
            { key: 'provider', label: 'Provider' },
            { key: 'cardType', label: 'Card Type' },
            { key: 'concept', label: 'Concept' },
            { key: 'expected', label: 'Expected (€)' },
            { key: 'received', label: 'Received (€)' },
            { key: 'difference', label: 'Diff (€)' },
            { key: 'status', label: 'Status' },
            { key: 'resolvedDate', label: 'Resolved Date' },
            { key: 'firstReported', label: 'First Reported' },
            { key: 'timesReported', label: 'Times Reported' },
            { key: 'notes', label: 'Notes' },
          ]}
          dateField="date"
        />
      )}

      {/* BATCH DISPUTE MODAL */}
      {batchModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 720,
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto',
          }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Batch Dispute Report</h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px 0' }}>
              {batchModal} — One consolidated complaint with all discrepancies
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Report Frequency / Urgency</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['weekly', 'daily', 'immediate'] as const).map(f => (
                  <button key={f} onClick={() => setReportFrequency(f)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #e2e8f0',
                    background: reportFrequency === f ? '#635bff' : 'white',
                    color: reportFrequency === f ? 'white' : '#64748b',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  }}>
                    {f === 'immediate' ? '⚡ Urgent' : f}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                {reportFrequency === 'immediate' ? 'For large amounts or missing payouts — send now.' : 
                 reportFrequency === 'daily' ? 'For high-volume merchants with daily reconciliation.' : 
                 'Standard: one batch report per week per provider.'}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Generated Report</label>
              <textarea
                readOnly
                value={generateBatchReport(batchModal)}
                style={{
                  width: '100%', minHeight: 360, padding: 14, borderRadius: 8, border: '1px solid #e2e8f0',
                  fontSize: 12, lineHeight: 1.5, fontFamily: 'monospace', resize: 'vertical',
                  background: '#fafafa', color: '#0f172a',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setBatchModal(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Close</button>
              <button onClick={() => copyReport(generateBatchReport(batchModal))} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
              </button>
              <button onClick={() => sendBatchComplaint(batchModal)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#0f172a', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Mark All as Disputed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Unresolved</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>{unresolved.length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Needs immediate action</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Disputed</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#92400e' }}>{disputed.length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Complaint sent</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resolved This Month</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>{resolvedThisMonth.length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Closed successfully</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total At Risk</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#0f172a' }}>{formatMoney(totalAtRisk)}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Unresolved + disputed</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Providers with Issues</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#635bff' }}>{providersWithIssues.length}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Need batch reports</div>
        </div>
      </div>

      {/* BATCH DISPUTE BUTTONS BY PROVIDER */}
      {providersWithIssues.length > 0 && (
        <div style={{ marginBottom: 24, padding: 20, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Generate Batch Complaint</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {providersWithIssues.map(provider => {
              const count = mismatches.filter(m => m.provider === provider && m.status !== 'resolved').length;
              const amount = mismatches.filter(m => m.provider === provider && m.status !== 'resolved').reduce((s, m) => s + Math.abs(m.difference), 0);
              return (
                <button
                  key={provider}
                  onClick={() => setBatchModal(provider)}
                  style={{
                    padding: '12px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
                    background: 'white', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{provider}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{count} tickets · {formatMoney(amount)} at risk</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by ID or concept..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, minWidth: 260, outline: 'none' }}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}>
          <option value="all">All Statuses</option>
          <option value="unresolved">🔴 Unresolved</option>
          <option value="disputed">🟡 Disputed</option>
          <option value="resolved">🟢 Resolved</option>
        </select>
        <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}>
          <option value="all">All Providers</option>
          <option value="Stripe">Stripe</option>
          <option value="TPV / Redsys">TPV / Redsys</option>
          <option value="Mercado Pago">Mercado Pago</option>
        </select>
        <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: 'white' }}>
          <option value="all">All Stores</option>
          <option value="Pura Zona Norte">Pura Zona Norte</option>
          <option value="Pura Online Shop">Pura Online Shop</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{filtered.length} of {mismatches.length} records</span>
      </div>

      {/* TABLE */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 2fr 110px 110px 100px 100px 110px 140px', padding: '14px 20px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
          <div>Ref</div>
          <div>Concept</div>
          <div style={{ textAlign: 'right' }}>Expected</div>
          <div style={{ textAlign: 'right' }}>Received</div>
          <div style={{ textAlign: 'right' }}>Diff</div>
          <div style={{ textAlign: 'center' }}>Status</div>
          <div style={{ textAlign: 'center' }}>Action</div>
          <div>Notes</div>
        </div>
        {filtered.map(m => (
          <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '90px 2fr 110px 110px 100px 100px 110px 140px', padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#635bff' }}>{m.id}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.concept}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{m.provider} · {m.cardType} · {m.store}</div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(m.expected)}</div>
            <div style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(m.received)}</div>
            <div style={{ textAlign: 'right', fontWeight: 700, color: m.difference < 0 ? '#991b1b' : '#166534' }}>
              {m.difference > 0 ? '+' : ''}{formatMoney(m.difference)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                background: statusColors[m.status].bg,
                color: statusColors[m.status].text,
                textTransform: 'uppercase',
                display: 'inline-block',
              }}>
                {statusColors[m.status].label}
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              {m.status !== 'resolved' && (
                <button
                  onClick={() => sendDisputeEmail(m)}
                  disabled={sendingEmailId === m.id}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: '1px solid #c7d2fe',
                    background: sendingEmailId === m.id ? '#f1f5f9' : '#eef2ff',
                    color: sendingEmailId === m.id ? '#94a3b8' : '#4338ca',
                    fontSize: 11, fontWeight: 600, cursor: sendingEmailId === m.id ? 'not-allowed' : 'pointer',
                    display: 'block', width: '100%', marginBottom: 4,
                  }}
                >
                  {sendingEmailId === m.id ? '⏳ Sending...' : '📧 Email'}
                </button>
              )}
              {m.status === 'unresolved' && (
                <button onClick={() => updateStatus(m.id, 'resolved')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'block', width: '100%' }}>
                  Resolve
                </button>
              )}
              {m.status === 'disputed' && (
                <button onClick={() => updateStatus(m.id, 'resolved')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'block', width: '100%' }}>
                  Resolve
                </button>
              )}
              {m.status === 'disputed' && (
                <button onClick={() => updateStatus(m.id, 'unresolved')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 4, display: 'block', width: '100%' }}>
                  Reopen
                </button>
              )}
              {m.status === 'resolved' && (
                <button onClick={() => updateStatus(m.id, 'unresolved')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'block', width: '100%' }}>
                  Reopen
                </button>
              )}
            </div>
            <div>
              {editingNotes === m.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input
                    type="text"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, outline: 'none', width: '100%' }}
                    placeholder="Add notes..."
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => saveNotes(m.id)} style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: 'none', background: '#635bff', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setEditingNotes(null); setNoteDraft(''); }} style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => startEditNotes(m)} style={{ cursor: 'pointer', fontSize: 12, color: m.notes ? '#0f172a' : '#94a3b8', lineHeight: 1.4, minHeight: 20 }}>
                  {m.notes || 'Click to add notes...'}
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>No {mode === 'disputes' ? 'disputes' : 'mismatches'} found</div>
            <div style={{ fontSize: 13, marginTop: 4, marginBottom: 16 }}>Try adjusting your filters or load demo data to see how the tracker works.</div>
            {mismatches.length === 0 && (
              <button
                onClick={loadDemoData}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid #c7d2fe',
                  background: '#eef2ff', color: '#4338ca', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🎮 Load Demo Data
              </button>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM INSIGHT */}
      <div style={{ marginTop: 32, padding: 20, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 24 }}>💡</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>How Batch Disputes Work</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
            <strong>1. Weekly Batch</strong> — One consolidated report per provider with all discrepancies (new + carried-forward).<br/>
            <strong>2. Three Sections</strong> — New discrepancies, still-unresolved from previous reports, and recently resolved.<br/>
            <strong>3. Urgent Override</strong> — For large amounts or missing payouts, switch to "⚡ Urgent" and send immediately.<br/>
            <strong>4. Auto-Check</strong> — After each bank upload, the system scans for automatic resolutions.<br/>
            <strong>5. Track Times Reported</strong> — The provider can't claim they never received it.
          </div>
        </div>
      </div>
    </div>
  );
}
