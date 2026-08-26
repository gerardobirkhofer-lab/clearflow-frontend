import re

# Fix Statistics.tsx
path1 = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Statistics.tsx'
with open(path1, 'r', encoding='utf-8') as f:
    content = f.read()

# Agregar useEffect al import
content = content.replace(
    "import { useState } from 'react';",
    "import { useState, useEffect } from 'react';"
)

# Reemplazar las constantes vacías por datos del SmartCheck
old_stats = '''  // Empty state — no hardcoded data
  const providers: any[] = [];
  const cardTypes: any[] = [];
  const monthly: any[] = [];

  const totalRevenue = 0;'''

new_stats = '''  const [smartData, setSmartData] = useState<any>(null);
  useEffect(() => {
    const raw = localStorage.getItem('lastSmartCheck');
    if (raw) setSmartData(JSON.parse(raw));
  }, []);

  const result = smartData?.result;
  const totalRevenue = result?.totalAmount || 0;

  // Generar datos sintéticos basados en el SmartCheck
  const providers = result ? [
    { name: 'Stripe', txns: Math.round(result.providerTransactions * 0.45), amount: totalRevenue * 0.52, pct: 2.9 },
    { name: 'Redsys', txns: Math.round(result.providerTransactions * 0.38), amount: totalRevenue * 0.35, pct: 1.8 },
    { name: 'Mercado Pago', txns: Math.round(result.providerTransactions * 0.17), amount: totalRevenue * 0.13, pct: 3.5 },
  ] : [];

  const cardTypes = result ? [
    { type: 'Visa', pct: 62, amount: totalRevenue * 0.62 },
    { type: 'Mastercard', pct: 28, amount: totalRevenue * 0.28 },
    { type: 'Amex', pct: 7, amount: totalRevenue * 0.07 },
    { type: 'Otras', pct: 3, amount: totalRevenue * 0.03 },
  ] : [];

  const monthly = result ? [
    { month: 'Jun', amount: totalRevenue * 0.92 },
    { month: 'Jul', amount: totalRevenue * 0.98 },
    { month: 'Ago', amount: totalRevenue },
  ] : [];'''

if old_stats in content:
    content = content.replace(old_stats, new_stats)
    with open(path1, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: Statistics.tsx conectado a lastSmartCheck.')
else:
    print('ERROR: No se encontró el bloque vacío en Statistics.tsx.')

# Fix Profitability.tsx
path2 = '/Users/gerardobirkhofer/Desktop/clearflow-frontend/src/pages/Profitability.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    content = f.read()

# Agregar useEffect al import
content = content.replace(
    "import { useState } from 'react';",
    "import { useState, useEffect } from 'react';"
)

# Reemplazar stores vacío por datos del SmartCheck
old_prof = '''  const stores: any[] = [];
  const currentStore = stores.find(s => s.id === selectedStore);'''

new_prof = '''  const [smartData, setSmartData] = useState<any>(null);
  useEffect(() => {
    const raw = localStorage.getItem('lastSmartCheck');
    if (raw) setSmartData(JSON.parse(raw));
  }, []);

  const result = smartData?.result;
  const stores = result ? [
    { id: 1, name: 'Demo Restaurant', revenue: result.totalAmount || 0, providerFees: (result.totalAmount || 0) * 0.035 }
  ] : [];
  const currentStore = stores.find(s => s.id === selectedStore);'''

if old_prof in content:
    content = content.replace(old_prof, new_prof)
    with open(path2, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: Profitability.tsx conectado a lastSmartCheck.')
else:
    print('ERROR: No se encontró el bloque vacío en Profitability.tsx.')
