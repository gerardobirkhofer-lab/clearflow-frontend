#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

with open('es.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Add missing setup keys
data['setup']['providerConnectDesc'] = 'Conectá proveedores de pago para sincronización automática de transacciones. La carga de CSV siempre está disponible como alternativa.'
data['setup']['noStoreSelected'] = 'No hay tienda seleccionada. Por favor seleccioná una tienda primero.'
data['setup']['comingSoon'] = 'Próximamente — cargá CSV por ahora'
data['setup']['currency'] = 'Moneda'
data['setup']['stores'] = 'TIENDAS'
data['setup']['legalNotice'] = '<strong>Aviso Legal:</strong> ClearFlow S.L. actúa únicamente como procesador de datos bajo el Artículo 28 del GDPR. Vos (el responsable del tratamiento) mantenés la propiedad total de tus datos comerciales. Procesamos tus datos únicamente para proporcionar el servicio de SmartCheck que solicitaste. No realizamos análisis fiscal, auditoría financiera ni reportes regulatorios en tu nombre. Si necesitás un Acuerdo de Procesamiento de Datos (DPA), contactanos en dpa@clearflow.app.'

with open('es.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('es.json setup keys added')
