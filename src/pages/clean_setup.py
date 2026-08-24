#!/usr/bin/env python3
# -*- coding: utf-8 -*-

with open('Setup.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and remove duplicate blocks
output = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Skip duplicate STORES line (already fixed but check anyway)
    if 'STORES' in line and 't(' not in line and i > 0 and 'setup.stores' in lines[i-1]:
        i += 1
        continue
    
    # Skip the corrupted provider duplicate block starting with "{t('setup.providerConnectDesc')}" 
    # that appears AFTER the correct closing </p> and before the correct {tenantId ?...
    if line.strip() == "{t('setup.providerConnectDesc')}" and i > 0:
        # Check if previous line is the correct closing </p>
        if lines[i-1].strip() == '</p>':
            # Skip until we find the correct {tenantId block
            while i < len(lines) and '{tenantId ?' not in lines[i]:
                i += 1
            # Now i points to a {tenantId line - but we need to check if it's the duplicate or correct one
            # Actually the correct {tenantId is BEFORE this block. So skip everything until we hit "📧"
            while i < len(lines) and '📧' not in lines[i]:
                i += 1
            output.append(lines[i])
            i += 1
            continue
    
    # Skip duplicate legal notice block
    if '<strong>Legal Notice:</strong>' in line:
        # Skip until closing </div> that ends this corrupted block
        while i < len(lines) and not (lines[i].strip() == '</div>' and 'marginTop' not in lines[i] and 'padding' not in lines[i]):
            i += 1
        i += 1  # skip the closing </div>
        continue
    
    output.append(line)
    i += 1

with open('Setup.tsx', 'w', encoding='utf-8') as f:
    f.writelines(output)

print('Setup.tsx cleaned')
