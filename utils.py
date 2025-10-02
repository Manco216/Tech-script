# utils.py - Utilidades para los reportes
from datetime import datetime, timedelta
from decimal import Decimal

def formatear_fecha_sql(fecha):
    """Formatea una fecha para consultas SQL"""
    if isinstance(fecha, str):
        return fecha
    return fecha.strftime('%Y-%m-%d %H:%M:%S')


def calcular_crecimiento(actual, anterior):
    """Calcula el porcentaje de crecimiento entre dos valores"""
    if anterior == 0:
        return 100.0 if actual > 0 else 0.0
    return round(((actual - anterior) / anterior) * 100, 1)


def obtener_rango_fechas(meses=6):
    """Obtiene un rango de fechas para consultas"""
    fecha_fin = datetime.now()
    fecha_inicio = fecha_fin - timedelta(days=30 * meses)
    return fecha_inicio, fecha_fin


def convertir_decimal_a_float(obj):
    """Convierte objetos Decimal a float para JSON"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convertir_decimal_a_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convertir_decimal_a_float(item) for item in obj]
    return obj


def obtener_nombre_mes(numero_mes):
    """Retorna el nombre del mes en español"""
    meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return meses[numero_mes - 1] if 1 <= numero_mes <= 12 else ''


def generar_datos_vacios_meses(meses=6):
    """Genera estructura de datos vacía para meses"""
    resultado = []
    fecha_actual = datetime.now()
    
    for i in range(meses):
        fecha = fecha_actual - timedelta(days=30 * i)
        resultado.append({
            'mes': obtener_nombre_mes(fecha.month),
            'total': 0
        })
    
    return list(reversed(resultado))


def validar_periodo(periodo):
    """Valida que el periodo sea válido"""
    try:
        periodo_int = int(periodo)
        return periodo_int if periodo_int in [3, 6, 12] else 6
    except (ValueError, TypeError):
        return 6


def calcular_estadisticas_basicas(datos):
    """Calcula estadísticas básicas de una lista de números"""
    if not datos:
        return {
            'promedio': 0,
            'minimo': 0,
            'maximo': 0,
            'total': 0
        }
    
    return {
        'promedio': sum(datos) / len(datos),
        'minimo': min(datos),
        'maximo': max(datos),
        'total': sum(datos)
    }


def formatear_moneda(valor):
    """Formatea un valor como moneda colombiana"""
    return f"${valor:,.0f}".replace(',', '.')


def sanitizar_busqueda(texto):
    """Sanitiza texto de búsqueda para evitar inyección SQL"""
    if not texto:
        return ""
    # Eliminar caracteres especiales peligrosos
    caracteres_peligrosos = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'DROP', 'DELETE', 'INSERT', 'UPDATE']
    texto_limpio = texto
    for caracter in caracteres_peligrosos:
        texto_limpio = texto_limpio.replace(caracter, '')
    return texto_limpio.strip()


def paginar_resultados(datos, pagina=1, por_pagina=10):
    """Pagina una lista de resultados"""
    inicio = (pagina - 1) * por_pagina
    fin = inicio + por_pagina
    
    return {
        'datos': datos[inicio:fin],
        'total': len(datos),
        'pagina': pagina,
        'por_pagina': por_pagina,
        'total_paginas': (len(datos) + por_pagina - 1) // por_pagina
    }


class ReportesCache:
    """Cache simple para reportes (en memoria)"""
    def __init__(self):
        self.cache = {}
        self.tiempos = {}
        self.duracion_cache = 300  # 5 minutos
    
    def obtener(self, clave):
        """Obtiene un valor del cache si no ha expirado"""
        if clave in self.cache:
            tiempo_guardado = self.tiempos.get(clave)
            if tiempo_guardado and (datetime.now() - tiempo_guardado).seconds < self.duracion_cache:
                return self.cache[clave]
        return None
    
    def guardar(self, clave, valor):
        """Guarda un valor en el cache"""
        self.cache[clave] = valor
        self.tiempos[clave] = datetime.now()
    
    def limpiar(self):
        """Limpia entradas expiradas del cache"""
        claves_expiradas = []
        for clave, tiempo in self.tiempos.items():
            if (datetime.now() - tiempo).seconds >= self.duracion_cache:
                claves_expiradas.append(clave)
        
        for clave in claves_expiradas:
            del self.cache[clave]
            del self.tiempos[clave]


# Instancia global del cache
cache_reportes = ReportesCache()


def obtener_color_estado(estado):
    """Retorna un color según el estado"""
    colores = {
        'activo': '#10b981',
        'inactivo': '#ef4444',
        'pendiente': '#f59e0b',
        'draft': '#64748b',
        'active': '#10b981',
        'archived': '#94a3b8'
    }
    return colores.get(estado.lower(), '#64748b')


def validar_datos_requeridos(datos, campos_requeridos):
    """Valida que los datos contengan los campos requeridos"""
    campos_faltantes = []
    for campo in campos_requeridos:
        if campo not in datos or datos[campo] is None:
            campos_faltantes.append(campo)
    
    return {
        'valido': len(campos_faltantes) == 0,
        'campos_faltantes': campos_faltantes
    }


def generar_reporte_resumen(datos_usuarios, datos_ingresos, datos_diplomados):
    """Genera un resumen general de todos los reportes"""
    return {
        'fecha_generacion': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'usuarios': {
            'total': datos_usuarios.get('total', 0),
            'crecimiento': datos_usuarios.get('crecimiento', 0)
        },
        'ingresos': {
            'total': datos_ingresos.get('total', 0),
            'proyeccion': datos_ingresos.get('proyeccion', 0)
        },
        'diplomados': {
            'total': len(datos_diplomados) if datos_diplomados else 0,
            'activos': sum(1 for d in datos_diplomados if d.get('estado') == 'active') if datos_diplomados else 0
        }
    }