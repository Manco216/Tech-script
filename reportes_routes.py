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
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_a_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_a_float(i) for i in obj]
    return obj

# ---------------------
# PÁGINA PRINCIPAL
# ---------------------
@reportes_bp.route("/admin/reportes")
@login_required
def reportes():
    return render_template("admin/reportes.html", user=current_user)

@reportes_bp.route("/instructor/reportesIns")
@login_required
def reportesIns():
    return render_template("instructor/reportesIns.html", user=current_user)

# ---------------------
# API - KPIs PRINCIPALES
# ---------------------
@reportes_bp.route("/api/reportes/kpis")
@login_required
def reportes_kpis():
    cur = mysql.connection.cursor(DictCursor)
    try:
        cur.execute("SELECT COUNT(*) as total FROM usuarios WHERE fk_rol = 1")
        total_estudiantes = cur.fetchone()['total']

        cur.execute("SELECT COALESCE(SUM(monto_pagado),0) as total FROM matriculas")
        ingresos_totales = float(cur.fetchone()['total'])

        cur.execute("""
            SELECT COUNT(*) as total_matriculas,
                   SUM(CASE WHEN estado='completado' THEN 1 ELSE 0 END) as completados
            FROM matriculas
        """)
        resultado = cur.fetchone()
        tasa_finalizacion = 0
        if resultado['total_matriculas'] > 0:
            tasa_finalizacion = round((resultado['completados'] / resultado['total_matriculas']) * 100, 1)

        cur.execute("""
            SELECT COUNT(*) as total_mes_actual FROM usuarios
            WHERE fk_rol = 1 AND fecha_creacion >= DATE_FORMAT(NOW(), '%Y-%m-01')
        """)
        mes_actual = cur.fetchone()['total_mes_actual']
        cur.execute("""
            SELECT COUNT(*) as total_mes_anterior FROM usuarios
            WHERE fk_rol = 1 AND fecha_creacion >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 1 MONTH)
            AND fecha_creacion < DATE_FORMAT(NOW(), '%Y-%m-01')
        """)
        mes_anterior = cur.fetchone()['total_mes_anterior']

        crecimiento = 0
        if mes_anterior > 0:
            crecimiento = round(((mes_actual - mes_anterior) / mes_anterior) * 100, 1)
        elif mes_actual > 0:
            crecimiento = 100.0

        return jsonify({
            "total_estudiantes": total_estudiantes,
            "ingresos_totales": ingresos_totales,
            "tasa_finalizacion": tasa_finalizacion,
            "crecimiento_estudiantes": crecimiento
        })
    except Exception as e:
        print("Error en reportes_kpis:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ---------------------
# API - CRECIMIENTO DE USUARIOS
# ---------------------
@reportes_bp.route("/api/reportes/usuarios-crecimiento")
@login_required
def reportes_usuarios_crecimiento():
    meses = request.args.get('meses', 6, type=int)
    cur = mysql.connection.cursor(DictCursor)
    try:
        cur.execute("""
            SELECT DATE_FORMAT(fecha_creacion, '%%Y-%%m') as mes, COUNT(*) as total
            FROM usuarios
            WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL %s MONTH)
            GROUP BY DATE_FORMAT(fecha_creacion, '%%Y-%%m')
            ORDER BY mes ASC
        """, (meses,))
        resultados = cur.fetchall()

        nombres_meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
        datos = []
        fecha_actual = datetime.now()
        for i in range(meses):
            fecha = fecha_actual - timedelta(days=30*i)
            mes_key = fecha.strftime('%Y-%m')
            nombre = nombres_meses[fecha.month - 1]
            total = next((r['total'] for r in resultados if r['mes'] == mes_key), 0)
            datos.append({"mes": nombre, "total": total})
        datos.reverse()
        return jsonify(datos)
    except Exception as e:
        print("Error en usuarios_crecimiento:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ---------------------
# API - INGRESOS POR CATEGORÍA
# ---------------------
@reportes_bp.route("/api/reportes/ingresos-categoria")
@login_required
def reportes_ingresos_categoria():
    cur = mysql.connection.cursor(DictCursor)
    try:
        cur.execute("""
            SELECT d.categoria, COALESCE(SUM(m.monto_pagado),0) as total_ingresos
            FROM diplomados d
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            GROUP BY d.categoria
        """)
        return jsonify(cur.fetchall())
    except Exception as e:
        print("Error en ingresos_categoria:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ---------------------
# API - MÉTRICAS DE ENGAGEMENT
# ---------------------
@reportes_bp.route("/api/reportes/metricas-engagement")
@login_required
def reportes_metricas_engagement():
    cur = mysql.connection.cursor(DictCursor)
    try:
        cur.execute("""
            SELECT COUNT(DISTINCT usuario_id) as total 
            FROM actividad_usuario 
            WHERE fecha_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        activos = cur.fetchone()['total']

        cur.execute("SELECT COUNT(*) as total FROM usuarios WHERE fk_rol=1")
        total = cur.fetchone()['total']
        porcentaje_activos = round((activos / total) * 100, 1) if total > 0 else 0

        cur.execute("""
            SELECT COUNT(*) as total 
            FROM actividad_usuario 
            WHERE tipo_actividad='login' AND fecha_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        sesiones = cur.fetchone()['total']

        cur.execute("""
            SELECT AVG(tiempo_dedicado_minutos) as promedio 
            FROM progreso_contenidos 
            WHERE fecha_inicio >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """)
        promedio = cur.fetchone()['promedio'] or 120
        promedio_horas = round(promedio / 60, 1)

        cur.execute("""
            SELECT COUNT(DISTINCT u1.usuario_id) as retenidos
            FROM actividad_usuario u1
            WHERE u1.fecha_hora >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND EXISTS (
                SELECT 1 FROM actividad_usuario u2
                WHERE u2.usuario_id = u1.usuario_id
                AND u2.fecha_hora BETWEEN DATE_SUB(u1.fecha_hora, INTERVAL 7 DAY) AND u1.fecha_hora
            )
        """)
        retenidos = cur.fetchone()['retenidos']
        retencion = round((retenidos / activos) * 100, 1) if activos > 0 else 0

        return jsonify({
            "usuarios_activos": porcentaje_activos,
            "sesiones": sesiones,
            "retencion": retencion,
            "tiempo_promedio": f"{promedio_horas}h"
        })
    except Exception as e:
        print("Error en metricas_engagement:", e)
        return jsonify({
            "usuarios_activos": 0,
            "sesiones": 0,
            "retencion": 0,
            "tiempo_promedio": "0h"
        }), 500
    finally:
        cur.close()
