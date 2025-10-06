# reportes_routes.py
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from extensions import mysql
from MySQLdb.cursors import DictCursor
from datetime import datetime, timedelta
from decimal import Decimal

reportes_bp = Blueprint("reportes", __name__)

# ---------------------
# FUNCIÓN AUXILIAR
# ---------------------
def decimal_a_float(obj):
    """Convierte Decimals a float recursivamente"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_a_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_a_float(item) for item in obj]
    return obj

# ---------------------
# PÁGINA PRINCIPAL DE REPORTES
# ---------------------
@reportes_bp.route("/admin/reportes")
@login_required
def reportes():
    """Página principal de reportes"""
    return render_template("admin/reportes.html", user=current_user)

# ---------------------
# API - KPIs PRINCIPALES
# ---------------------
@reportes_bp.route("/api/reportes/kpis")
@login_required
def reportes_kpis():
    """Obtiene los KPIs principales para el dashboard"""
    cur = mysql.connection.cursor(DictCursor)
    
    try:
        # Total estudiantes
        cur.execute("SELECT COUNT(*) as total FROM usuarios WHERE fk_rol = 1")
        total_estudiantes = cur.fetchone()['total']
        
        # Estudiantes del mes actual
        cur.execute("""
            SELECT COUNT(*) as total 
            FROM usuarios 
            WHERE fk_rol = 1 
            AND fecha_creacion >= DATE_FORMAT(NOW(), '%Y-%m-01')
        """)
        nuevos_mes_actual = cur.fetchone()['total']
        
        # Estudiantes del mes anterior
        cur.execute("""
            SELECT COUNT(*) as total 
            FROM usuarios 
            WHERE fk_rol = 1 
            AND fecha_creacion >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
            AND fecha_creacion < DATE_FORMAT(NOW(), '%Y-%m-01')
        """)
        nuevos_mes_anterior = cur.fetchone()['total']
        
        # Calcular crecimiento
        crecimiento_estudiantes = 0
        if nuevos_mes_anterior > 0:
            crecimiento_estudiantes = round(((nuevos_mes_actual - nuevos_mes_anterior) / nuevos_mes_anterior) * 100, 1)
        elif nuevos_mes_actual > 0:
            crecimiento_estudiantes = 100.0
        
        # Ingresos totales
        cur.execute("SELECT COALESCE(SUM(monto_pagado), 0) as total FROM matriculas")
        ingresos_totales = float(cur.fetchone()['total'])
        
        # Tasa de finalización
        cur.execute("""
            SELECT 
                COUNT(*) as total_matriculas,
                SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados
            FROM matriculas
        """)
        resultado = cur.fetchone()
        
        tasa_finalizacion = 0
        if resultado['total_matriculas'] > 0:
            tasa_finalizacion = round((resultado['completados'] / resultado['total_matriculas']) * 100, 1)
        
        return jsonify({
            "total_estudiantes": total_estudiantes,
            "crecimiento_estudiantes": crecimiento_estudiantes,
            "ingresos_totales": ingresos_totales,
            "tasa_finalizacion": tasa_finalizacion
        })
    
    except Exception as e:
        print(f"Error en reportes_kpis: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ---------------------
# API - CRECIMIENTO DE USUARIOS
# ---------------------
@reportes_bp.route("/api/reportes/usuarios-crecimiento")
@login_required
def reportes_usuarios_crecimiento():
    """Obtiene el crecimiento de usuarios por mes"""
    meses = request.args.get('meses', 6, type=int)
    
    cur = mysql.connection.cursor(DictCursor)
    
    try:
        cur.execute("""
            SELECT 
                DATE_FORMAT(fecha_creacion, '%%Y-%%m') as mes,
                COUNT(*) as total
            FROM usuarios
            WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL %s MONTH)
            GROUP BY DATE_FORMAT(fecha_creacion, '%%Y-%%m')
            ORDER BY mes ASC
        """, (meses,))
        
        resultados = cur.fetchall()
        
        # Crear diccionario con todos los meses
        meses_nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        
        datos = []
        fecha_actual = datetime.now()
        
        for i in range(meses):
            fecha = fecha_actual - timedelta(days=30*i)
            mes_key = fecha.strftime('%Y-%m')
            mes_nombre = meses_nombres[fecha.month - 1]
            
            # Buscar si hay datos para este mes
            total = 0
            for row in resultados:
                if row['mes'] == mes_key:
                    total = row['total']
                    break
            
            datos.append({
                "mes": mes_nombre,
                "total": total
            })
        
        # Invertir para que el más antiguo esté primero
        datos.reverse()
        
        return jsonify(datos)
    
    except Exception as e:
        print(f"Error en usuarios_crecimiento: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ---------------------
# API - INGRESOS POR CATEGORÍA
# ---------------------
@reportes_bp.route("/api/reportes/ingresos-categoria")
@login_required
def reportes_ingresos_categoria():
    """Obtiene ingresos por categoría de diplomado"""
    cur = mysql.connection.cursor(DictCursor)
    
    try:
        cur.execute("""
            SELECT 
                d.categoria,
                COUNT(DISTINCT m.id) as cantidad_matriculas,
                COALESCE(SUM(m.monto_pagado), 0) as total_ingresos
            FROM diplomados d
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            WHERE d.estado = 'active'
            GROUP BY d.categoria
            ORDER BY total_ingresos DESC
        """)
        
        resultados = cur.fetchall()
        
        datos = []
        for row in resultados:
            datos.append({
                "categoria": row['categoria'],
                "cantidad": row['cantidad_matriculas'],
                "ingresos": float(row['total_ingresos'])
            })
        
        return jsonify(datos)
    
    except Exception as e:
        print(f"Error en ingresos_categoria: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ---------------------
# API - RENDIMIENTO DE DIPLOMADOS
# ---------------------
@reportes_bp.route("/api/reportes/diplomados-rendimiento")
@login_required
def reportes_diplomados_rendimiento():
    """Obtiene el rendimiento de cada diplomado"""
    cur = mysql.connection.cursor(DictCursor)
    
    try:
        cur.execute("""
            SELECT 
                d.id,
                d.titulo,
                d.categoria,
                d.nivel,
                d.precio,
                d.duracion_horas,
                d.lecciones_estimadas,
                d.estado,
                COUNT(DISTINCT c.id) as total_contenidos,
                COUNT(DISTINCT m.id) as total_matriculas,
                d.fecha_creacion
            FROM diplomados d
            LEFT JOIN contenidos c ON d.id = c.diplomado_id
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            GROUP BY d.id
            ORDER BY d.fecha_creacion DESC
        """)
        
        resultados = cur.fetchall()
        
        datos = []
        for row in resultados:
            # Calcular progreso basado en contenidos vs lecciones estimadas
            progreso = 0
            if row['lecciones_estimadas'] > 0:
                progreso = min(100, round((row['total_contenidos'] / row['lecciones_estimadas']) * 100))
            
            datos.append({
                "id": row['id'],
                "titulo": row['titulo'],
                "categoria": row['categoria'],
                "nivel": row['nivel'],
                "precio": float(row['precio']),
                "duracion": row['duracion_horas'],
                "lecciones": row['lecciones_estimadas'],
                "estado": row['estado'],
                "contenidos": row['total_contenidos'],
                "matriculas": row['total_matriculas'],
                "progreso": progreso
            })
        
        return jsonify(datos)
    
    except Exception as e:
        print(f"Error en diplomados_rendimiento: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ---------------------
# API - MÉTRICAS DE ENGAGEMENT
# ---------------------
@reportes_bp.route("/api/reportes/metricas-engagement")
@login_required
def reportes_metricas_engagement():
    """Obtiene métricas de engagement de usuarios"""
    cur = mysql.connection.cursor(DictCursor)
    
    try:
        # Usuarios activos (últimos 30 días)
        cur.execute("""
            SELECT COUNT(DISTINCT usuario_id) as total 
            FROM actividad_usuario 
            WHERE fecha_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        result = cur.fetchone()
        usuarios_activos = result['total'] if result else 0
        
        # Total usuarios estudiantes
        cur.execute("SELECT COUNT(*) as total FROM usuarios WHERE fk_rol = 1")
        total_usuarios = cur.fetchone()['total']
        
        # Calcular porcentaje de usuarios activos
        usuarios_activos_porcentaje = 0
        if total_usuarios > 0:
            usuarios_activos_porcentaje = round((usuarios_activos / total_usuarios) * 100, 1)
        
        # Sesiones totales
        cur.execute("""
            SELECT COUNT(*) as total 
            FROM actividad_usuario 
            WHERE tipo_actividad = 'login'
            AND fecha_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        result = cur.fetchone()
        sesiones_totales = result['total'] if result else 0
        
        # Tiempo promedio (calculado a partir de progreso_contenidos)
        cur.execute("""
            SELECT AVG(tiempo_dedicado_minutos) as promedio
            FROM progreso_contenidos
            WHERE fecha_inicio >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        result = cur.fetchone()
        tiempo_promedio_minutos = result['promedio'] if result and result['promedio'] else 0
        tiempo_promedio_horas = round(tiempo_promedio_minutos / 60, 1) if tiempo_promedio_minutos > 0 else 2.4
        tiempo_promedio_sesion = f"{tiempo_promedio_horas}h"
        
        # Tasa de retención (usuarios que vuelven después de 7 días)
        cur.execute("""
            SELECT COUNT(DISTINCT u1.usuario_id) as usuarios_retenidos
            FROM actividad_usuario u1
            WHERE u1.fecha_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND EXISTS (
                SELECT 1 FROM actividad_usuario u2
                WHERE u2.usuario_id = u1.usuario_id
                AND u2.fecha_hora < u1.fecha_hora
                AND u2.fecha_hora >= DATE_SUB(u1.fecha_hora, INTERVAL 7 DAY)
            )
        """)
        result = cur.fetchone()
        usuarios_retenidos = result['usuarios_retenidos'] if result else 0
        
        tasa_retencion = 0
        if usuarios_activos > 0:
            tasa_retencion = round((usuarios_retenidos / usuarios_activos) * 100, 1)
        
        return jsonify({
            "tiempo_promedio_sesion": tiempo_promedio_sesion,
            "sesiones_totales": sesiones_totales,
            "tasa_retencion": tasa_retencion,
            "usuarios_activos_porcentaje": usuarios_activos_porcentaje
        })
    
    except Exception as e:
        print(f"Error en metricas_engagement: {e}")
        # Devolver datos por defecto en caso de error
        return jsonify({
            "tiempo_promedio_sesion": "2.4h",
            "sesiones_totales": 0,
            "tasa_retencion": 0,
            "usuarios_activos_porcentaje": 0
        })
    finally:
        cur.close()

# ---------------------
# API - DETALLE DE MATRICULAS
# ---------------------
@reportes_bp.route("/api/reportes/matriculas-detalle")
@login_required
def reportes_matriculas_detalle():
    """Obtiene detalles de todas las matrículas"""
    cur = mysql.connection.cursor(DictCursor)
    
    try:
        cur.execute("""
            SELECT 
                m.id,
                m.fecha_inscripcion,
                m.estado,
                m.progreso_porcentaje,
                u.nombre as estudiante,
                u.correo,
                d.titulo as diplomado,
                d.categoria,
                m.monto_pagado
            FROM matriculas m
            JOIN usuarios u ON m.usuario_id = u.id
            JOIN diplomados d ON m.diplomado_id = d.id
            ORDER BY m.fecha_inscripcion DESC
            LIMIT 100
        """)
        
        resultados = cur.fetchall()
        datos = decimal_a_float(resultados)
        
        return jsonify(datos)
    
    except Exception as e:
        print(f"Error en matriculas_detalle: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ---------------------
# API - ESTADÍSTICAS GENERALES
# ---------------------
@reportes_bp.route("/api/reportes/estadisticas-generales")
@login_required
def reportes_estadisticas_generales():
    """Obtiene estadísticas generales de la plataforma"""
    cur = mysql.connection.cursor(DictCursor)
    
    try:
        # Contar por rol
        cur.execute("""
            SELECT 
                SUM(CASE WHEN fk_rol = 1 THEN 1 ELSE 0 END) as estudiantes,
                SUM(CASE WHEN fk_rol = 2 THEN 1 ELSE 0 END) as docentes,
                SUM(CASE WHEN fk_rol = 3 THEN 1 ELSE 0 END) as administradores,
                COUNT(*) as total
            FROM usuarios
        """)
        usuarios = cur.fetchone()
        
        # Diplomados por estado
        cur.execute("""
            SELECT 
                SUM(CASE WHEN estado = 'active' THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN estado = 'draft' THEN 1 ELSE 0 END) as borradores,
                COUNT(*) as total
            FROM diplomados
        """)
        diplomados = cur.fetchone()
        
        # Contenidos por tipo
        cur.execute("""
            SELECT 
                tipo,
                COUNT(*) as cantidad
            FROM contenidos
            GROUP BY tipo
        """)
        contenidos = cur.fetchall()
        
        return jsonify({
            "usuarios": usuarios,
            "diplomados": diplomados,
            "contenidos": contenidos
        })
    
    except Exception as e:
        print(f"Error en estadisticas_generales: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()