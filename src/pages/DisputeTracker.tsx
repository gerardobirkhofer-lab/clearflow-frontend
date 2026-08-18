import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

const formatMoney = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const API = import.meta.env.VITE_API_URL;
const getAuth = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

interface Dispute {
  id: number;
  provider_name: string;
  dispute_type: string;
  status: string;
  amount: number;
  description: string;
  opened_at: string;
  resolved_at: string | null;
  expected_resolution: string | null;
  days_to_resolve: number | null;
  recovery_amount: number;
  age_days: number;
}

export default function DisputeTracker() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({});
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
    if (!tenant.id) {
      setError('No tenant selected');
      setLoading(false);
      return;
    }
    fetchData(tenant.id);
  }, []);

  const fetchData = async (tenantId: number) => {
    setLoading(true);
    try {
      const [sumRes, listRes] = await Promise.all([
        fetch(`${API}/api/v1/disputes/summary?tenant_id=${tenantId}`, { headers: getAuth() }),
        fetch(`${API}/api/v1/disputes/?tenant_id=${tenantId}`, { headers: getAuth() }),
      ]);
      if (!sumRes.ok || !listRes.ok) throw new Error('Failed to fetch disputes');
      const sumData = await sumRes.json();
      const listData = await listRes.json();
      setSummary(sumData);
      setDisputes(listData.disputes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = disputes.filter(d => filter === 'all' ? true : d.status === filter);

  const aging = summary.aging || {};
  const agingAmounts = summary.aging_amounts || {};

  const agingBuckets = [
    { label: '0-7 días', count: aging['0_7'] || 0, amount: agingAmounts['0_7'] || 0, color: '#dcfce7', text: '#166534', bar: '#22c55e' },
    { label: '8-15 días', count: aging['8_15'] || 0, amount: agingAmounts['8_15'] || 0, color: '#fef9c3', text: '#854d0e', bar: '#eab308' },
    { label: '16-30 días', count: aging['16_30'] || 0, amount: agingAmounts['16_30'] || 0, color: '#ffedd5', text: '#9a3412', bar: '#f97316' },
    { label: '31-45 días', count: aging['31_45'] || 0, amount: agingAmounts['31_45'] || 0, color: '#fee2e2', text: '#991b1b', bar: '#ef4444' },
    { label: '+45 días', count: aging['46_plus'] || 0, amount: agingAmounts['46_plus'] || 0, color: '#f3e8ff', text: '#6b21a8', bar: '#a855f7' },
  ];

  const maxCount = Math.max(...agingBuckets.map(b => b.count), 1);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontFamily: 'sans-serif', color: '#64748b' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Loading disputes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: '#991b1b' }}>{error}</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#0f172a' }}>
      <BackButton />
      
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: '#635bff', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
          🎯 Acción
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Dispute Tracker</h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
          Track every euro in dispute. See what's getting resolved and what's stuck.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Open Disputes</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>
            {summary.by_status?.open?.count || 0}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{formatMoney(summary.by_status?.open?.amount)} at risk</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resolved (This Month)</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>
            {summary.by_status?.resolved?.count || 0}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{formatMoney(summary.total_recovered)} recovered</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg Resolution</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#0f172a' }}>
            {summary.avg_resolution_days || 0}d
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>From open to closed</div>
        </div>
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recovery Rate</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#166534' }}>
            {summary.total_disputes ? Math.round(((summary.by_status?.resolved?.count || 0) / summary.total_disputes) * 100) : 0}%
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Of all disputes</div>
        </div>
      </div>

      {/* AGING BUCKETS */}
      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 32 }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700 }}>Aging: How long have they been open?</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, paddingBottom: 30 }}>
          {agingBuckets.map((bucket, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: bucket.text }}>
                {bucket.count}
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 40,
                  height: `${(bucket.count / maxCount) * 140}px`,
                  background: bucket.bar,
                  borderRadius: '6px 6px 0 0',
                  minHeight: 4,
                  transition: 'height 0.5s',
                }} />
              </div>
              <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textAlign: 'center' }}>{bucket.label}</span>
              <span style={{ fontSize: 10, color: bucket.text, fontWeight: 700 }}>{formatMoney(bucket.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* WEEKLY TREND */}
      {summary.weekly_trend && summary.weekly_trend.length > 0 && (
        <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700 }}>Weekly Trend: Opened vs Resolved</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, paddingBottom: 24 }}>
            {summary.weekly_trend.map((w: any, i: number) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 120 }}>
                  <div style={{
                    width: 12,
                    height: `${Math.max((w.opened / Math.max(...summary.weekly_trend.map((x: any) => Math.max(x.opened, x.resolved)))) * 100, 4)}px`,
                    background: '#991b1b',
                    borderRadius: '3px 3px 0 0',
                    minHeight: 4,
                  }} title={`Opened: ${w.opened}`} />
                  <div style={{
                    width: 12,
                    height: `${Math.max((w.resolved / Math.max(...summary.weekly_trend.map((x: any) => Math.max(x.opened, x.resolved)))) * 100, 4)}px`,
                    background: '#166534',
                    borderRadius: '3px 3px 0 0',
                    minHeight: 4,
                  }} title={`Resolved: ${w.resolved}`} />
                </div>
                <span style={{ fontSize: 10, color: '#64748b' }}>{w.week}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#991b1b' }} />Opened</span>
            <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#166534' }} />Resolved</span>
          </div>
        </div>
      )}

      {/* DISPUTE LIST */}
      <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>All Disputes</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'open', 'resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: filter === f ? '#0f172a' : 'white',
                  color: filter === f ? 'white' : '#64748b',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {f === 'all' ? 'All' : f === 'open' ? '🔴 Open' : '🟢 Resolved'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
            <div>No disputes in this category.</div>
          </div>
        ) : (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px 1fr', padding: '12px 16px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>
              <div>Description</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
              <div style={{ textAlign: 'center' }}>Provider</div>
              <div style={{ textAlign: 'center' }}>Age</div>
              <div style={{ textAlign: 'center' }}>Status</div>
              <div style={{ textAlign: 'right' }}>Recovered</div>
            </div>
            {filtered.map(d => (
              <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px 1fr', padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.description || '—'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Opened {new Date(d.opened_at).toLocaleDateString('es-ES')}</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, color: '#991b1b' }}>{formatMoney(d.amount)}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
                    {d.provider_name}
                  </span>
                </div>
                <div style={{ textAlign: 'center', fontWeight: 700, color: d.age_days > 30 ? '#991b1b' : d.age_days > 15 ? '#92400e' : '#166534' }}>
                  {d.age_days}d
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    background: d.status === 'resolved' ? '#dcfce7' : '#fee2e2',
                    color: d.status === 'resolved' ? '#166534' : '#991b1b',
                  }}>
                    {d.status === 'resolved' ? '✅' : '🔴'}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                  {d.status === 'resolved' ? formatMoney(d.recovery_amount) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
