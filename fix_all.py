import json, re

# 1. Fix en.json
with open('/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/i18n/locales/en.json', 'r') as f:
    data = json.load(f)
data['setup']['businessPortfolio'] = 'Business Portfolio'
with open('/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/i18n/locales/en.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# 2. Fix es.json
with open('/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/i18n/locales/es.json', 'r') as f:
    data = json.load(f)
data['setup']['businessPortfolio'] = 'Cartera de Negocios'
with open('/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/i18n/locales/es.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# 3. Fix Setup.tsx line 71 - hardcoded text
with open('/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Setup.tsx', 'r') as f:
    content = f.read()
content = content.replace(
    "const portfolioLabel = isOwner ? 'Cartera de Negocios' : t('setup.clientPortfolio');",
    "const portfolioLabel = isOwner ? t('setup.businessPortfolio') : t('setup.clientPortfolio');"
)
with open('/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Setup.tsx', 'w') as f:
    f.write(content)

# 4. Fix Login.tsx - remove localStorage.clear() that wipes config
with open('/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Login.tsx', 'r') as f:
    content = f.read()
# Replace localStorage.clear() with selective removal or just remove it
content = content.replace(
    'localStorage.clear();\n      localStorage.setItem(\'token\', data.token);',
    'localStorage.removeItem(\'token\');\n      localStorage.removeItem(\'user\');\n      localStorage.setItem(\'token\', data.token);'
)
content = content.replace(
    'localStorage.clear();\n      localStorage.setItem(\'token\', DEMO_TOKEN);',
    'localStorage.removeItem(\'token\');\n      localStorage.removeItem(\'user\');\n      localStorage.setItem(\'token\', DEMO_TOKEN);'
)
with open('/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Login.tsx', 'w') as f:
    f.write(content)

print('Done: translations + Setup label + Login localStorage fix')
