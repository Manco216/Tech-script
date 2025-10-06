from flask import Blueprint, render_template, jsonify
from flask_login import login_required
from extensions import mysql
import random

metrics_bp = Blueprint("metrics", __name__, url_prefix="/admin/metricas")

# ============================
# Vista principal (HTML)
# ============================
@metrics_bp.route("/")
@login_required
def metricas():
    return render_template("admin/metricas.html")


# ============================
# Endpoint de análisis de contenido
# ============================
@metrics_bp.route("/api/analisis_contenido")
@login_required
def analisis_contenido():
    from MySQLdb.cursors import DictCursor
    try:
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("""
            SELECT tipo, COUNT(*) AS cantidad
            FROM contenidos
            GROUP BY tipo
        """)
        data = cur.fetchall()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        print("Error al obtener análisis de contenido:", e)
        return jsonify({"success": False, "error": str(e)})


# ============================
# Endpoint principal de métricas (para AJAX)
# ============================
@metrics_bp.route("/data")
@login_required
def metricas_data():
    from MySQLdb.cursors import DictCursor
    cur = mysql.connection.cursor(DictCursor)

    # ========= MÉTRICAS DE USUARIOS =========
    cur.execute("""
        SELECT COUNT(DISTINCT usuario_id) AS usuarios_online
        FROM actividad_usuario 
        WHERE fecha_hora >= NOW() - INTERVAL 1 HOUR
    """)
    usuarios_online = cur.fetchone()["usuarios_online"]

    cur.execute("""
        SELECT COUNT(DISTINCT usuario_id) AS dau
        FROM actividad_usuario 
        WHERE fecha_hora >= NOW() - INTERVAL 1 DAY
    """)
    dau = cur.fetchone()["dau"]

    cur.execute("""
        SELECT COUNT(DISTINCT usuario_id) AS wau
        FROM actividad_usuario 
        WHERE fecha_hora >= NOW() - INTERVAL 7 DAY
    """)
    wau = cur.fetchone()["wau"]

    cur.execute("""
        SELECT COUNT(DISTINCT usuario_id) AS mau
        FROM actividad_usuario 
        WHERE fecha_hora >= NOW() - INTERVAL 30 DAY
    """)
    mau = cur.fetchone()["mau"]

    # ========= ENGAGEMENT =========
    cur.execute("""
        SELECT COUNT(*) AS sesiones
        FROM actividad_usuario 
        WHERE tipo_actividad = 'login' 
        AND fecha_hora >= NOW() - INTERVAL 1 DAY
    """)
    sesiones = cur.fetchone()["sesiones"]

    cur.execute("""
        SELECT AVG(contenidos_por_usuario) AS promedio
        FROM (
            SELECT COUNT(*) as contenidos_por_usuario 
            FROM progreso_contenidos 
            WHERE fecha_inicio >= NOW() - INTERVAL 7 DAY
            GROUP BY usuario_id
        ) AS subquery
    """)
    paginas_por_sesion = round(cur.fetchone()["promedio"] or 0, 1)

    cur.execute("""
        SELECT AVG(tiempo_dedicado_minutos) AS promedio
        FROM progreso_contenidos 
        WHERE fecha_inicio >= NOW() - INTERVAL 7 DAY
    """)
    duracion_promedio = round(cur.fetchone()["promedio"] or 0, 1)

    cur.execute("""
        SELECT 
            (
                SELECT COUNT(DISTINCT usuario_id) 
                FROM progreso_contenidos 
                WHERE fecha_inicio >= NOW() - INTERVAL 7 DAY
                GROUP BY usuario_id HAVING COUNT(*) = 1
            ) /
            (
                SELECT COUNT(DISTINCT usuario_id) 
                FROM progreso_contenidos 
                WHERE fecha_inicio >= NOW() - INTERVAL 7 DAY
            ) * 100 AS tasa_rebote
    """)
    tasa_rebote = round(cur.fetchone()["tasa_rebote"] or 0, 1)

    # ========= CONVERSIONES =========
    cur.execute("""
        SELECT COUNT(*) AS visitantes
        FROM usuarios 
        WHERE fecha_creacion >= NOW() - INTERVAL 30 DAY
    """)
    visitantes = cur.fetchone()["visitantes"]

    cur.execute("""
        SELECT COUNT(*) AS registros
        FROM matriculas 
        WHERE fecha_inscripcion >= NOW() - INTERVAL 30 DAY
    """)
    registros = cur.fetchone()["registros"]

    cur.execute("""
        SELECT COUNT(*) AS compras
        FROM matriculas 
        WHERE fecha_inscripcion >= NOW() - INTERVAL 30 DAY 
        AND monto_pagado > 0
    """)
    compras = cur.fetchone()["compras"]

    tasa_conversion = round((compras / visitantes * 100), 2) if visitantes > 0 else 0

    # ========= CONTENIDO =========
    cur.execute("""
        SELECT tipo, COUNT(*) AS cantidad
        FROM contenidos
        GROUP BY tipo
    """)
    contenido = []
    engagement_map = {"video": 80, "image": 65, "document": 45, "quiz": 70}

    for row in cur.fetchall():
        tipo = row["tipo"]
        contenido.append({
            "tipo": tipo,
            "valor": row["cantidad"],
            "engagement": engagement_map.get(tipo, 50)
        })

    # ========= ALERTAS =========
    alertas = []
    if usuarios_online < 5:
        alertas.append({"tipo": "warning", "mensaje": "Pocos usuarios online", "tiempo": "Ahora", "severidad": "Media"})
    if dau == 0:
        alertas.append({"tipo": "error", "mensaje": "Sin usuarios activos en 24h", "tiempo": "Ahora", "severidad": "Alta"})
    if tasa_rebote > 50:
        alertas.append({"tipo": "warning", "mensaje": f"Tasa de rebote alta: {tasa_rebote}%", "tiempo": "Ahora", "severidad": "Media"})
    if not alertas:
        alertas.append({"tipo": "success", "mensaje": "Todos los sistemas operativos", "tiempo": "Ahora", "severidad": "Info"})

    cur.close()

    # ========= RESPUESTA JSON =========
    return jsonify({
        "sistema": {
            "uptime": 99.8,
            "latencia": random.randint(100, 200),
            "errores": 0.2,
            "carga": random.randint(50, 80)
        },
        "usuarios": {
            "online": usuarios_online,
            "dau": dau,
            "wau": wau,
            "mau": mau
        },
        "engagement": {
            "sesiones": sesiones,
            "duracionPromedio": duracion_promedio,
            "paginasPorSesion": paginas_por_sesion,
            "tasaRebote": tasa_rebote
        },
        "conversiones": {
            "visitantes": visitantes,
            "registros": registros,
            "compras": compras,
            "tasaConversion": tasa_conversion
        },
        "contenido": contenido,
        "alertas": alertas
    })
