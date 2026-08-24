#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

with open('en.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

data['setup']['providerConnectDesc'] = 'Connect payment providers for automatic transaction syncing. CSV upload is always available as a fallback.'
data['setup']['noStoreSelected'] = 'No store selected. Please select a store first.'
data['setup']['comingSoon'] = 'Coming soon — upload CSV for now'
data['setup']['currency'] = 'Currency'
data['setup']['stores'] = 'STORES'
data['setup']['legalNotice'] = '<strong>Legal Notice:</strong> ClearFlow S.L. acts solely as a data processor under GDPR Article 28. You (the data controller) retain full ownership of your business data. We process your data only to provide the reconciliation service you requested. We do not perform tax analysis, financial auditing, or regulatory reporting on your behalf. If you require a Data Processing Agreement (DPA), contact us at dpa@clearflow.app.'

with open('en.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('en.json setup keys added')
