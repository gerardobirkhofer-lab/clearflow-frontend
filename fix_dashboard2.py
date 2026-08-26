import re

path = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Dashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar el grid actual de Acciones Rápidas y expandirlo
old_grid = '''        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Link to="/mismatches" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #fee2e2', background: '#fef2f2', color: '#991b1b', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Ver Discrepancias
          </Link>
          <Link to="/disputes" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #ffedd5', background: '#fff7ed', color: '#9a3412', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔴 Ver Disputas Abiertas
          </Link>
          <Link to="/communications" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📧 Ver Comunicaciones
          </Link>
          <Link to="/reports" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #d1fae5', background: '#f0fdf4', color: '#166534', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Ver Informes
          </Link>
        </div>'''

new_grid = '''        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <Link to="/mismatches" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #fee2e2', background: '#fef2f2', color: '#991b1b', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Ver Discrepancias
          </Link>
          <Link to="/disputes" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #ffedd5', background: '#fff7ed', color: '#9a3412', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔴 Ver Disputas Abiertas
          </Link>
          <Link to="/communications" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #dbeafe', background: '#eff6ff', color: '#1e40af', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📧 Ver Comunicaciones
          </Link>
          <Link to="/reports" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #d1fae5', background: '#f0fdf4', color: '#166534', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📊 Ver Informes
          </Link>
          <Link to="/revenue" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #e9d5ff', background: '#faf5ff', color: '#7e22ce', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            💰 Revenue Control (Beta)
          </Link>
          <Link to="/statistics" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #ccfbf1', background: '#f0fdfa', color: '#0f766e', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📈 Statistics
          </Link>
          <Link to="/profitability" style={{ textDecoration: 'none', padding: 16, borderRadius: 10, border: '1px solid #fef08a', background: '#fefce8', color: '#854d0e', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            📉 Profitability
          </Link>
        </div>'''

if old_grid in content:
    content = content.replace(old_grid, new_grid)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: Agregados Revenue Control, Statistics y Profitability.')
else:
    print('ERROR: No se encontró el grid de Acciones Rápidas.')
