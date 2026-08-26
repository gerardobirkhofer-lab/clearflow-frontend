import re

path = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Setup.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Quitar import de BackButton
content = content.replace("import BackButton from '../components/BackButton';\n", '')

# 2. Reemplazar <BackButton ... /> por botón nativo
old = '<BackButton to="/hub" label="← Volver al Panel" />'
new = '''<button
          onClick={() => window.location.href = '/hub'}
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            marginBottom: 20,
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            color: '#475569',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          ← Volver al Panel
        </button>'''

if old in content:
    content = content.replace(old, new)
    print('OK: BackButton reemplazado por botón nativo.')
else:
    print('ERROR: No se encontró <BackButton to="/hub" ... />')
    # Debug: buscar cualquier BackButton
    matches = re.findall(r'<BackButton[^/]*/>', content)
    print(f'Encontrados {len(matches)} BackButton: {matches}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
