# reportes_instructor_routes.py
from flask import Blueprint, render_template, jsonify
from flask_login import login_required, current_user
from extensions import mysql
from MySQLdb.cursors import DictCursor
from decimal import Decimal

reportes_instructor_bp = Blueprint("reportes_instructor", __name__, url_prefix="/instructor")

# ---------------------
# FUNCIÓN AUXILIAR
# ---------------------
def decimal_a_float(obj):
    """Convierte Decimals a float para serializar en JSON"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_a_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_a_float(i) for i in obj]
    return obj


# ---------------------
# VISTA PRINCIPAL DEL INSTRUCTOR
# ---------------------
@reportes_instructor_bp.route("/reportes")
@login_required
def reportes_instructor():
    return render_template("instructor/reportesIns.html", user=current_user)


# ---------------------
# API - KPI PRINCIPALES DEL INSTRUCTOR
# ---------------------
@reportes_instructor_bp.route("/api/reportes/kpis")
@login_required
def kpis_instructor():
    cur = mysql.connection.cursor(DictCursor)
    try:
        # 1️⃣ Estudiantes en sus diplomados
        cur.execute("""
            SELECT COUNT(DISTINCT m.usuario_id) AS total_estudiantes
            FROM matriculas m
            INNER JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.instructor_id = %s
        """, (current_user.id,))
        total_estudiantes = cur.fetchone()['total_estudiantes']

        # 2️⃣ Estudiantes que completaron un diplomado del instructor
        cur.execute("""
            SELECT COUNT(DISTINCT m.usuario_id) AS total_finalizados
            FROM matriculas m
            INNER JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.instructor_id = %s
            AND m.estado = 'completado'
        """, (current_user.id,))
        finalizados = cur.fetchone()['total_finalizados']

        # 3️⃣ Ingresos generados
        cur.execute("""
            SELECT COALESCE(SUM(m.monto_pagado), 0) AS total_ingresos
            FROM matriculas m
            INNER JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.instructor_id = %s
        """, (current_user.id,))
        ingresos = float(cur.fetchone()['total_ingresos'])

        # 4️⃣ Tasa de finalización
        tasa_finalizacion = round((finalizados / total_estudiantes * 100), 1) if total_estudiantes > 0 else 0

        data = {
            "total_estudiantes": total_estudiantes,
            "finalizados": finalizados,
            "ingresos_totales": ingresos,
            "tasa_finalizacion": tasa_finalizacion
        }

        return jsonify(decimal_a_float(data))

    except Exception as e:
        print("Error en kpis_instructor:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


# ---------------------
# API - DETALLE POR DIPLOMADO
# ---------------------
@reportes_instructor_bp.route("/api/reportes/detalle-diplomados")
@login_required
def detalle_diplomados():
    cur = mysql.connection.cursor(DictCursor)
    try:
        cur.execute("""
            SELECT 
                d.nombre AS diplomado,
                COUNT(DISTINCT m.usuario_id) AS estudiantes,
                SUM(CASE WHEN m.estado = 'completado' THEN 1 ELSE 0 END) AS finalizados,
                COALESCE(SUM(m.monto_pagado), 0) AS ingresos
            FROM diplomados d
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            WHERE d.instructor_id = %s
            GROUP BY d.nombre
        """, (current_user.id,))
        resultados = cur.fetchall()
        return jsonify(decimal_a_float(resultados))
    except Exception as e:
        print("Error en detalle_diplomados:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
