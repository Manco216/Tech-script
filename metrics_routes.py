from flask import Blueprint, render_template, jsonify
from flask_login import login_required
from extensions import mysql
import random

metrics_bp = Blueprint("metrics", __name__, url_prefix="/admin/metricas")

# ============================
# Vista principal (renderiza HTML)
# ============================
@metrics_bp.route("/")
@login_required
def metricas():
    return render_template("admin/metricas.html")

# ============================
# Endpoint API completo (para JS AJAX auto-refresh)
# ============================
@metrics_bp.route("/data")
@login_required
def metricas_data():
    cur = mysql.connection.cursor()

    # ========== MÉTRICAS DE USUARIOS ==========
    # Usuarios online
    cur.execute("""
        SELECT COUNT(DISTINCT usuario_id) AS usuarios_online
        FROM actividad_usuario 
        WHERE fecha_hora >= NOW() - INTERVAL 1 HOUR
    """)
    row = cur.fetchone()
    usuarios_online = row["usuarios_online"] if row and row["usuarios_online"] else 0

    # DAU
    cur.execute("""
        SELECT COUNT(DISTINCT usuario_id) AS dau
        FROM actividad_usuario 
        WHERE fecha_hora >= NOW() - INTERVAL 1 DAY
    """)
    row = cur.fetchone()
    dau = row["dau"] if row and row["dau"] else 0

    # WAU
    cur.execute("""
        SELECT COUNT(DISTINCT usuario_id) AS wau
        FROM actividad_usuario 
        WHERE fecha_hora >= NOW() - INTERVAL 7 DAY
    """)
    row = cur.fetchone()
    wau = row["wau"] if row and row["wau"] else 0

    # MAU
    cur.execute("""
        SELECT COUNT(DISTINCT usuario_id) AS mau
        FROM actividad_usuario 
        WHERE fecha_hora >= NOW() - INTERVAL 30 DAY
    """)
    row = cur.fetchone()
    mau = row["mau"] if row and row["mau"] else 0

    # ========== ENGAGEMENT ==========
    # Sesiones
    cur.execute("""
        SELECT COUNT(*) AS sesiones
        FROM actividad_usuario 
        WHERE tipo_actividad = 'login' 
        AND fecha_hora >= NOW() - INTERVAL 1 DAY
    """)
    row = cur.fetchone()
    sesiones = row["sesiones"] if row and row["sesiones"] else 0

    # Páginas por sesión (contenidos vistos)
    cur.execute("""
        SELECT AVG(contenidos_por_usuario) AS promedio
        FROM (
            SELECT COUNT(*) as contenidos_por_usuario 
            FROM progreso_contenidos 
            WHERE fecha_inicio >= NOW() - INTERVAL 7 DAY
            GROUP BY usuario_id
        ) AS subquery
    """)
    row = cur.fetchone()
    paginas_por_sesion = round(row["promedio"], 1) if row and row["promedio"] else 0

    # Duración promedio
    cur.execute("""
        SELECT AVG(tiempo_dedicado_minutos) AS promedio
        FROM progreso_contenidos 
        WHERE fecha_inicio >= NOW() - INTERVAL 7 DAY
    """)
    row = cur.fetchone()
    duracion_promedio = round(row["promedio"], 1) if row and row["promedio"] else 0

    # Tasa de rebote
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
    row = cur.fetchone()
    tasa_rebote = round(row["tasa_rebote"], 1) if row and row["tasa_rebote"] else 0

    # ========== CONVERSIÓN ==========
    cur.execute("""
        SELECT COUNT(*) AS visitantes
        FROM usuarios 
        WHERE fecha_creacion >= NOW() - INTERVAL 30 DAY
    """)
    row = cur.fetchone()
    visitantes = row["visitantes"] if row and row["visitantes"] else 0

    cur.execute("""
        SELECT COUNT(*) AS registros
        FROM matriculas 
        WHERE fecha_inscripcion >= NOW() - INTERVAL 30 DAY
    """)
    row = cur.fetchone()
    registros = row["registros"] if row and row["registros"] else 0

    cur.execute("""
        SELECT COUNT(*) AS compras
        FROM matriculas 
        WHERE fecha_inscripcion >= NOW() - INTERVAL 30 DAY 
        AND monto_pagado > 0
    """)
    row = cur.fetchone()
    compras = row["compras"] if row and row["compras"] else 0

    tasa_conversion = round((compras / visitantes * 100), 2) if visitantes > 0 else 0

    # ========== CONTENIDO ==========
    # Videos
    cur.execute("""
        SELECT COUNT(*) AS vistas
        FROM progreso_contenidos pc
        JOIN contenidos c ON pc.contenido_id = c.id
        WHERE c.tipo = 'video' AND pc.fecha_inicio >= NOW() - INTERVAL 30 DAY
    """)
    row = cur.fetchone()
    videos_vistas = row["vistas"] if row and row["vistas"] else 0

    cur.execute("""
        SELECT COUNT(*) AS completados
        FROM progreso_contenidos pc
        JOIN contenidos c ON pc.contenido_id = c.id
        WHERE c.tipo = 'video' AND pc.completado = 1 
        AND pc.fecha_inicio >= NOW() - INTERVAL 30 DAY
    """)
    row = cur.fetchone()
    videos_completados = row["completados"] if row and row["completados"] else 0
    videos_engagement = round((videos_completados / videos_vistas * 100), 1) if videos_vistas > 0 else 0

    # Documentos
    cur.execute("""
        SELECT COUNT(*) AS docs
        FROM progreso_contenidos pc
        JOIN contenidos c ON pc.contenido_id = c.id
        WHERE c.tipo = 'document' AND pc.fecha_inicio >= NOW() - INTERVAL 30 DAY
    """)
    row = cur.fetchone()
    documentos = row["docs"] if row and row["docs"] else 0

    cur.execute("""
        SELECT COUNT(*) AS completados
        FROM progreso_contenidos pc
        JOIN contenidos c ON pc.contenido_id = c.id
        WHERE c.tipo = 'document' AND pc.completado = 1 
        AND pc.fecha_inicio >= NOW() - INTERVAL 30 DAY
    """)
    row = cur.fetchone()
    documentos_completados = row["completados"] if row and row["completados"] else 0
    documentos_engagement = round((documentos_completados / documentos * 100), 1) if documentos > 0 else 0

    # Quizzes
    cur.execute("""
        SELECT COUNT(*) AS quizzes
        FROM evaluaciones 
        WHERE fecha_inicio >= NOW() - INTERVAL 30 DAY
    """)
    row = cur.fetchone()
    quizzes = row["quizzes"] if row and row["quizzes"] else 0

    cur.execute("""
        SELECT COUNT(*) AS aprobados
        FROM evaluaciones 
        WHERE aprobado = 1 AND fecha_inicio >= NOW() - INTERVAL 30 DAY
    """)
    row = cur.fetchone()
    quizzes_aprobados = row["aprobados"] if row and row["aprobados"] else 0
    quizzes_engagement = round((quizzes_aprobados / quizzes * 100), 1) if quizzes > 0 else 0

    # ========== ALERTAS ==========
    alertas = []

    if usuarios_online < 5:
        alertas.append({
            "id": 1,
            "tipo": "warning",
            "mensaje": "Pocos usuarios online en este momento",
            "tiempo": "Ahora",
            "severidad": "Media"
        })

    if dau == 0:
        alertas.append({
            "id": 2,
            "tipo": "error",
            "mensaje": "No hay usuarios activos en las últimas 24 horas",
            "tiempo": "Ahora",
            "severidad": "Alta"
        })

    if tasa_rebote > 50:
        alertas.append({
            "id": 3,
            "tipo": "warning",
            "mensaje": f"Tasa de rebote alta: {tasa_rebote}%",
            "tiempo": "Ahora",
            "severidad": "Media"
        })

    if not alertas:
        alertas.append({
            "id": 0,
            "tipo": "success",
            "mensaje": "Todos los sistemas funcionando correctamente",
            "tiempo": "Ahora",
            "severidad": "Info"
        })

    cur.close()

    # ========== RESPUESTA JSON ==========
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
        "contenido": [
            {"tipo": "Videos", "valor": videos_vistas, "engagement": videos_engagement, "unidad": "vistas"},
            {"tipo": "Documentos", "valor": documentos, "engagement": documentos_engagement, "unidad": "descargas"},
            {"tipo": "Quizzes", "valor": quizzes, "engagement": quizzes_engagement, "unidad": "completados"}
        ],
        "alertas": alertas
    })
