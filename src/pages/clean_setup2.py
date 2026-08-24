#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('Setup.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove duplicate STORES + count block
# Pattern: {t('setup.stores')} + count + STORES + count
import re
content = re.sub(
    r"(<div style=\{\{ fontSize: 11, color: '#94a3b8', fontWeight: 600 \}\}>\{t\('setup\.stores'\)\}</div>\n\s+<div style=\{\{ fontSize: 18, fontWeight: 800 \}\}>\{client\.stores\.length\}</div>)\n\s+<div style=\{\{ fontSize: 11, color: '#94a3b8', fontWeight: 600 \}\}>STORES</div>\n\s+<div style=\{\{ fontSize: 18, fontWeight: 800 \}\}>\{client\.stores\.length\}</div>",
    r"\1",
    content
)

# Fix 2: Remove the corrupted provider duplicate block
# Everything from "{t('setup.providerConnectDesc')}" after </p> and {tenantId ?
# up to but not including "📧 {t('setup.disputeEmailConfig')}"
content = re.sub(
    r"(\{tenantId \? <StripeConnect tenantId=\{tenantId\} /> : \(\n\s+<div style=\{\{ padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', marginBottom: 16 \}\}>\n\s+\{t\('setup\.noStoreSelected'\)\}\n\s+</div>\n\s+\)\})\n\s+\{t\('setup\.providerConnectDesc'\)\}\n\s+</p>\n\s+\{tenantId \? <StripeConnect tenantId=\{tenantId\} /> : \(\n\s+\{t\('setup\.providerConnectDesc'\)\}\n\s+</p>\n\s+(.+?)<h3 style=\{\{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700 \}\}>📧",
    r"\1\n          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700 }}>📧",
    content,
    flags=re.DOTALL
)

# Fix 3: Remove empty/div after legal notice
content = re.sub(
    r"(<div style=\{\{ fontSize: 12, color: '#64748b', lineHeight: 1\.6 \}\} dangerouslySetInnerHTML=\{\{ __html: t\('setup\.legalNotice'\) \}\} />)\n\s+</div>\n\s+<div style=\{\{ fontSize: 12, color: '#64748b', lineHeight: 1\.6 \}\}>\n\s+</div>",
    r"\1\n          </div>",
    content
)

with open('Setup.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Setup.tsx cleaned with regex')
