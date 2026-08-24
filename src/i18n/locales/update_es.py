#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

# Read es.json
with open('es.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Add new sections
data['statistics'] = {
    'title': 'Estadísticas',
    'intelligence': 'Inteligencia',
    'subtitle': 'Entendé de dónde viene tu dinero y qué tan rápido llega.',
    'last7d': 'Últimos 7 días',
    'last30d': 'Últimos 30 días',
    'last90d': 'Últimos 90 días',
    'yearToDate': 'Año en curso',
    'emptyTitle': 'Aún no hay estadísticas',
    'emptyDesc': 'Cargá extractos bancarios e informes de proveedores para ver tu scorecard de salud, desglose por tipo de tarjeta y tendencias mensuales.'
}

data['profitability'] = {
    'title': 'Rentabilidad',
    'intelligence': 'Inteligencia de Negocio',
    'subtitle': 'Mirá si tu negocio realmente está ganando plata. Ingresos menos comisiones menos costos = ganancia real.',
    'emptyTitle': 'Aún no hay datos de tiendas',
    'emptyDesc': 'Completá la configuración de tu tienda y cargá datos de transacciones para ver el análisis de rentabilidad.',
    'analyzing': 'Analizando:',
    'monthlyRevenue': 'Ingresos Mensuales',
    'providerFees': 'Comisiones Proveedores',
    'totalCosts': 'Costos Totales',
    'netProfit': 'Ganancia Neta',
    'margin': 'margen',
    'monthlyCosts': 'Costos Mensuales',
    'addCost': '+ Agregar Costo',
    'costName': 'Nombre del Costo',
    'amount': 'Monto (€)',
    'frequency': 'Frecuencia',
    'daily': 'Diario',
    'weekly': 'Semanal',
    'monthly': 'Mensual',
    'add': 'Agregar',
    'noCosts': 'Aún no hay costos agregados. Hacé clic en "+ Agregar Costo" para empezar a trackear tus gastos.',
    'cost': 'Costo',
    'monthlyEquiv': 'Equiv. Mensual',
    'totalMonthlyCosts': 'Total Costos Mensuales'
}

data['reports'] = {
    'title': 'Informes',
    'subtitle': 'Generá y descargá informes profesionales para tu contador, tu banco o tus proveedores de pago.',
    'store': 'Tienda:',
    'download': 'Descargar',
    'records': 'registros',
    'usage': 'Uso de informes',
    'usageDesc': 'Estos informes se generan a partir de tus datos cargados y están destinados a análisis interno, revisión contable o disputas formales con proveedores de pago. Todos los montos se muestran en EUR. Para informes multi-moneda, asegurate de que tus cuentas bancarias estén configuradas en Configuración.',
    'dashboardSummary': 'Resumen del Panel',
    'dashboardSummaryDesc': 'Métricas clave, totales y cambios período a período en todas las tiendas.',
    'profitability': 'Informe de Rentabilidad',
    'profitabilityDesc': 'Ingresos, comisiones de proveedores, costos operativos y margen neto por tienda.',
    'mismatch': 'Informe de Discrepancias',
    'mismatchDesc': 'Todas las transacciones sin conciliar, pagos faltantes y diferencias de comisiones con seguimiento de estado.',
    'fees': 'Análisis de Comisiones por Proveedor y Tarjeta',
    'feesDesc': 'Desglose de comisiones por proveedor, tipo de tarjeta, cantidad de transacciones y tiempos de liquidación.',
    'reconciliation': 'Detalle de Conciliación Bancaria',
    'reconciliationDesc': 'Conciliación línea por línea entre extractos bancarios e informes de proveedores por tienda y cuenta.',
    'health': 'Scorecard de Salud de Proveedores',
    'healthDesc': 'Análisis ponderado de comisiones, riesgo por velocidad de liquidación e indicadores de salud por proveedor para negociación.'
}

with open('es.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('es.json updated')
