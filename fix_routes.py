import re

path = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Dashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Arreglar rutas malas
content = content.replace('to="/mismatches"', 'to="/mismatch-tracker"')
content = content.replace('to="/disputes"', 'to="/dispute-tracker"')
content = content.replace('to="/revenue"', 'to="/revenue-control"')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('OK: Rutas corregidas.')
print('  /mismatches → /mismatch-tracker')
print('  /disputes   → /dispute-tracker')
print('  /revenue    → /revenue-control')
