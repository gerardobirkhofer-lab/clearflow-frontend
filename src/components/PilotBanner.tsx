/** Global pilot disclaimer — generic for any merchant, not café-specific. */
export default function PilotBanner() {
  return (
    <div
      role="status"
      style={{
        background: '#0f172a',
        color: '#e2e8f0',
        padding: '10px 20px',
        fontSize: 13,
        lineHeight: 1.45,
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          background: '#fbbf24',
          color: '#0f172a',
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          padding: '3px 8px',
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        Piloto
      </span>
      <span style={{ maxWidth: 920 }}>
        <strong style={{ color: '#fff' }}>Propuesta del motor · no es un cierre firmado.</strong>
        {' '}
        Solo se auto-confirma con evidencia fuerte (referencia / settlement + importe o neto).
        Lo demás queda pendiente a propósito — no digas “todo conciliado” si hay pendientes.
      </span>
    </div>
  );
}
