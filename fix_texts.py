import re

changes = []

# 1. Fix Dashboard.tsx - botones en español consistentes
path = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Dashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('📊 Ver Informes', '📊 Ver Informes')
content = content.replace('💰 Revenue Control (Beta)', '💰 Control de Ingresos (Beta)')
content = content.replace('📈 Statistics', '📈 Estadísticas')
content = content.replace('📉 Profitability', '📉 Rentabilidad')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
changes.append('Dashboard.tsx: botones renombrados al español')

# 2. Fix DisputeTracker.tsx - verificar título
path2 = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/DisputeTracker.tsx'
try:
    with open(path2, 'r', encoding='utf-8') as f:
        content = f.read()
    # Buscar si hay texto de Discrepancia en el título y cambiarlo a Disputas
    if 'Discrepancia' in content or 'discrepancy' in content.lower():
        content = content.replace('Discrepancia', 'Disputa')
        content = content.replace('discrepancy', 'dispute')
        with open(path2, 'w', encoding='utf-8') as f:
            f.write(content)
        changes.append('DisputeTracker.tsx: título corregido a Disputas')
except FileNotFoundError:
    changes.append('DisputeTracker.tsx: no encontrado')

# 3. Fix Communications.tsx - verificar título  
path3 = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Communications.tsx'
try:
    with open(path3, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'Disputa' in content and 'Discrepancia' not in content:
        # Si solo dice Disputa, agregar Discrepancia
        content = content.replace('Disputa', 'Disputas y Discrepancias')
        with open(path3, 'w', encoding='utf-8') as f:
            f.write(content)
        changes.append('Communications.tsx: título corregido a Disputas y Discrepancias')
except FileNotFoundError:
    changes.append('Communications.tsx: no encontrado')

for c in changes:
    print(f'OK: {c}')
