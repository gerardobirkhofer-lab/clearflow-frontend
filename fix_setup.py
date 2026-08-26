import re

path = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Setup.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar el bloque duplicado mal formado
old_block = '''                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Porcentaje</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={providerFees[p.key]?.percentage ?? ''}
                                onChange={(e) => updateFeeField(p.key, 'percentage', e.target.value)}
                                placeholder="2.9"
                                style={{ width: 80, padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                              />
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Porcentaje</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="number"
                                step="0.01"
                                value={providerFees[p.key]?.percentage ?? ''}
                                onChange={(e) => updateFeeField(p.key, 'percentage', e.target.value)}
                                placeholder="2.9"
                                style={{ width: 80, padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                              />
                              <span style={{ fontSize: 13, color: '#64748b' }}>%</span>
                            </div>
                          </div>'''

new_block = '''                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Porcentaje</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={providerFees[p.key]?.percentage ?? ''}
                                onChange={(e) => updateFeeField(p.key, 'percentage', e.target.value)}
                                placeholder="2.9"
                                style={{ width: 80, padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                              />
                              <span style={{ fontSize: 13, color: '#64748b' }}>%</span>
                            </div>
                          </div>'''

if old_block in content:
    content = content.replace(old_block, new_block, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: Bloque duplicado reemplazado.')
else:
    print('ERROR: No se encontró el bloque duplicado.')
    # Debug: buscar líneas con "type=\"text\"" y "inputMode=\"decimal\""
    import re
    matches = list(re.finditer(r'type="text"\s+inputMode="decimal"', content))
    print(f'Encontrados {len(matches)} type=text inputMode=decimal')
    for m in matches:
        start = max(0, m.start()-200)
        end = min(len(content), m.end()+200)
        print('--- snippet ---')
        print(content[start:end])
        print('---')
PYEOF