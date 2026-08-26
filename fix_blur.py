import re

path = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Setup.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Cambiar input de Porcentaje: value + onChange → defaultValue + onBlur
content = re.sub(
    r"value=\{providerFees\[p\.key\]\?\.percentage \?\? ''\}\s+onChange=\{\(e\) => updateFeeField\(p\.key, 'percentage', e\.target\.value\)\}",
    "defaultValue={providerFees[p.key]?.percentage ?? ''}\n                                onBlur={(e) => updateFeeField(p.key, 'percentage', e.target.value)}",
    content
)

# Cambiar input de Fijo: value + onChange → defaultValue + onBlur
content = re.sub(
    r"value=\{providerFees\[p\.key\]\?\.fixed \?\? ''\}\s+onChange=\{\(e\) => updateFeeField\(p\.key, 'fixed', e\.target\.value\)\}",
    "defaultValue={providerFees[p.key]?.fixed ?? ''}\n                                  onBlur={(e) => updateFeeField(p.key, 'fixed', e.target.value)}",
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('OK: inputs cambiados a defaultValue + onBlur')
