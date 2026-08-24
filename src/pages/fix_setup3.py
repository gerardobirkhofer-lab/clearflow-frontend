#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('Setup.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and remove the corrupted block:
# After the first "⚪ {t('setup.comingSoon')}" there should NOT be
# "</div>\n                  )}\n                </div>\n              ))}\n            </div>\n          </div>\n"
# before the next Mercado Pago card

# The corrupted pattern after the email grid closes:
old = """            </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', opacity: 0.6, marginBottom: 16 }}>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', opacity: 0.6, marginBottom: 16 }}>"""

new = """            </div>

          <div style={{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', opacity: 0.6, marginBottom: 16 }}>"""

if old in content:
    content = content.replace(old, new, 1)
    print('Fixed corrupted block')
else:
    print('Pattern not found, trying alternative...')
    # Try a more flexible approach
    import re
    pattern = r"(</div>\n\n          <div style=\{\{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', opacity: 0\.6, marginBottom: 16 \}\}>\n)\s+\}\)\}\n\s+</div>\n\s+\}\)\}\n\s+</div>\n\s+</div>\n"
    content = re.sub(pattern, r"\1", content)
    print('Fixed with regex')

with open('Setup.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
