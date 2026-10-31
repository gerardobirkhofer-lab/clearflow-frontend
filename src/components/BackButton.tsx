interface BackButtonProps {
  /** Explicit destination for "Volver". Defaults to hub. */
  to?: string;
  label?: string;
  /** Destination for "Ir al Inicio". Defaults to hub. */
  fallbackTo?: string;
  showHome?: boolean;
}

/**
 * In-app back/home controls.
 * Uses full page navigation (location.assign) so buttons still work after
 * external redirects (Tink Open Banking) where React Router history is unreliable.
 */
export default function BackButton({
  to = '/hub',
  label,
  fallbackTo = '/hub',
  showHome = true,
}: BackButtonProps) {
  const go = (path: string) => {
    const target = path.startsWith('/') ? path : `/${path}`;
    window.location.assign(target);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        marginBottom: 20,
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 20,
      }}
    >
      <button
        type="button"
        onClick={() => go(to)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 18px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          color: '#475569',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        ← {label || 'Volver'}
      </button>
      {showHome && (
        <button
          type="button"
          onClick={() => go(fallbackTo)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            backgroundColor: '#eef2ff',
            border: '1px solid #c7d2fe',
            borderRadius: 8,
            color: '#4338ca',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          🏠 Ir al Inicio
        </button>
      )}
    </div>
  );
}
