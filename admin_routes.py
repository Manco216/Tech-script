# admin_routes.py
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import mysql
from gestionUsuarios import contar_usuarios, contar_por_rol
from MySQLdb.cursors import DictCursor
from datetime import datetime, timedelta
from decimal import Decimal

# Definimos el blueprint
admin_bp = Blueprint("admin", __name__, template_folder="templates/admin")

# ---------------------
# Panel principal
# ---------------------
@admin_bp.route("/admin/home", endpoint="home")
@login_required
def home_admin():
    return render_template("admin/home.html")


# ---------------------
# Gestión de Usuarios
# ---------------------
@admin_bp.route("/usuarios/<int:user_id>", methods=["PUT"])
def actualizar_usuario(user_id):
    data = request.get_json()
    nombre = data.get("nombre")
    correo = data.get("correo")
    telefono = data.get("telefono")
    rol = data.get("rol")

    cur = mysql.connection.cursor()
    cur.execute("""
        UPDATE usuarios
        SET nombre=%s, correo=%s, telefono=%s, fk_rol=%s
        WHERE id=%s
    """, (nombre, correo, telefono, rol, user_id))
    mysql.connection.commit()
    cur.close()

    return jsonify({"message": "Usuario actualizado correctamente"})


@admin_bp.route("/admin/usuarios/toggle_estado/<int:user_id>", methods=["POST"])
@login_required
def toggle_estado_usuario(user_id):
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("SELECT estado FROM usuarios WHERE id=%s", (user_id,))
    usuario = cur.fetchone()

    if usuario:
        estado_actual = usuario["estado"]
        nuevo_estado = "inactivo" if estado_actual == "activo" else "activo"
        cur.execute("UPDATE usuarios SET estado=%s WHERE id=%s", (nuevo_estado, user_id))
        mysql.connection.commit()
        flash(f"Estado cambiado a {nuevo_estado}", "success")

    cur.close()
    return redirect(url_for("admin.gestion_usuarios"))


@admin_bp.route("/admin/usuarios/eliminar/<int:user_id>", methods=["POST"])
@login_required
def eliminar_usuario(user_id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM usuarios WHERE id=%s", (user_id,))
    mysql.connection.commit()
    cur.close()
    flash("Usuario eliminado correctamente", "success")
    return redirect(url_for("admin.gestion_usuarios"))


@admin_bp.route("/api/usuarios/filtrar", methods=["GET"])
def filtrar_usuarios():
    q = request.args.get("q", "").strip()
    rol = request.args.get("rol", "todos")
    estado = request.args.get("estado", "todos")

    cur = mysql.connection.cursor()
    query = """
        SELECT u.id, u.nombre, u.documento, u.correo, u.telefono, u.estado, 
               u.fecha_creacion, u.fecha_actualizacion, r.nombre AS rol, u.fk_rol
        FROM usuarios u
        JOIN roles r ON u.fk_rol = r.id
        WHERE 1=1
    """
    params = []

    if q:
        query += " AND (u.nombre LIKE %s OR u.correo LIKE %s)"
        params.extend([f"%{q}%", f"%{q}%"])

    if rol != "todos":
        query += " AND r.nombre = %s"
        params.append(rol.capitalize())

    if estado != "todos":
        query += " AND u.estado = %s"
        params.append(estado)

    cur.execute(query, params)
    usuarios = cur.fetchall()
    cur.close()
    return jsonify(usuarios)


@admin_bp.route("/admin/usuarios")
@login_required
def gestion_usuarios():
    cur = mysql.connection.cursor()

    cur.execute("SELECT COUNT(*) AS total FROM usuarios")
    total_usuarios = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) AS total FROM usuarios WHERE fk_rol=1")
    estudiantes = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) AS total FROM usuarios WHERE fk_rol=2")
    instructores = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) AS total FROM usuarios WHERE fk_rol=3")
    administradores = cur.fetchone()["total"]

    cur.execute("""
        SELECT 
            u.id, u.nombre, u.documento, u.correo, u.telefono, u.estado, 
            r.nombre AS rol, u.fecha_creacion, u.fecha_actualizacion
        FROM usuarios u
        JOIN roles r ON u.fk_rol = r.id
    """)
    usuarios = cur.fetchall()
    cur.close()

    return render_template("admin/gestionUsuarios.html",
                        user=current_user,
                        total_usuarios=total_usuarios,
                        estudiantes=estudiantes,
                        instructores=instructores,
                        administradores=administradores,
                        usuarios=usuarios)


@admin_bp.route("/api/usuarios/stats")
def usuarios_stats():
    total = contar_usuarios(mysql)
    estudiantes = contar_por_rol(mysql, 1)
    instructores = contar_por_rol(mysql, 2)
    administradores = contar_por_rol(mysql, 3)

    return jsonify({
        "total": total,
        "estudiantes": estudiantes,
        "instructores": instructores,
        "administradores": administradores,
    })


# ---------------------
# REPORTES - Nuevos Endpoints
# ---------------------

@admin_bp.route("/admin/reportes")
@login_required
def reportes():
    return render_template("admin/reportes.html", user=current_user)


@admin_bp.route("/api/reportes/kpis")
@login_required
def reportes_kpis():
    """Obtiene los KPIs principales para el dashboard de reportes"""
    cur = mysql.connection.cursor(DictCursor)
    
    # Total de estudiantes
    cur.execute("SELECT COUNT(*) as total FROM usuarios WHERE fk_rol = 1")
    total_estudiantes = cur.fetchone()['total']
    
    # Calcular crecimiento (comparando con mes anterior)
    cur.execute("""
        SELECT COUNT(*) as total 
        FROM usuarios 
        WHERE fk_rol = 1 
        AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
    """)
    nuevos_mes_actual = cur.fetchone()['total']
    
    cur.execute("""
        SELECT COUNT(*) as total 
        FROM usuarios 
        WHERE fk_rol = 1 
        AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL 2 MONTH)
        AND fecha_creacion < DATE_SUB(NOW(), INTERVAL 1 MONTH)
    """)
    nuevos_mes_anterior = cur.fetchone()['total']
    
    crecimiento_estudiantes = 0
    if nuevos_mes_anterior > 0:
        crecimiento_estudiantes = round(((nuevos_mes_actual - nuevos_mes_anterior) / nuevos_mes_anterior) * 100, 1)
    
    # Ingresos totales (suma de montos pagados en matrículas)
    cur.execute("""
        SELECT COALESCE(SUM(monto_pagado), 0) as total 
        FROM matriculas
    """)
    ingresos_totales = float(cur.fetchone()['total'])
    
    # Tasa de finalización REAL basada en matrículas
    cur.execute("""
        SELECT 
            COUNT(*) as total_matriculas,
            COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados
        FROM matriculas
    """)
    resultado = cur.fetchone()
    
    tasa_finalizacion = 0
    if resultado['total_matriculas'] > 0:
        tasa_finalizacion = round((resultado['completados'] / resultado['total_matriculas']) * 100, 1)
    
    cur.close()
    
    return jsonify({
        "total_estudiantes": total_estudiantes,
        "crecimiento_estudiantes": crecimiento_estudiantes,
        "ingresos_totales": ingresos_totales,
        "tasa_finalizacion": tasa_finalizacion
    })


@admin_bp.route("/api/reportes/usuarios-crecimiento")
@login_required
def reportes_usuarios_crecimiento():
    """Obtiene el crecimiento de usuarios por mes"""
    meses = request.args.get('meses', 6, type=int)
    
    cur = mysql.connection.cursor(DictCursor)
    
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
    cur.close()
    
    # Formatear datos para el gráfico
    datos = []
    for row in resultados:
        mes_nombre = datetime.strptime(row['mes'], '%Y-%m').strftime('%B')
        datos.append({
            "mes": mes_nombre,
            "total": row['total']
        })
    
    # Si no hay datos suficientes, generar meses vacíos
    if len(datos) < meses:
        meses_faltantes = []
        fecha_actual = datetime.now()
        for i in range(meses):
            fecha = fecha_actual - timedelta(days=30*i)
            mes_nombre = fecha.strftime('%B')
            existe = any(d['mes'] == mes_nombre for d in datos)
            if not existe:
                meses_faltantes.append({
                    "mes": mes_nombre,
                    "total": 0
                })
        datos.extend(meses_faltantes)
        datos = sorted(datos, key=lambda x: datetime.strptime(x['mes'], '%B'))
    
    return jsonify(datos)


@admin_bp.route("/api/reportes/ingresos-categoria")
@login_required
def reportes_ingresos_categoria():
    """Obtiene ingresos por categoría de diplomado"""
    cur = mysql.connection.cursor(DictCursor)
    
    cur.execute("""
        SELECT 
            categoria,
            COUNT(*) as cantidad,
            COALESCE(SUM(precio), 0) as total_ingresos
        FROM diplomados
        WHERE estado = 'active'
        GROUP BY categoria
        ORDER BY total_ingresos DESC
    """)
    
    resultados = cur.fetchall()
    cur.close()
    
    datos = []
    for row in resultados:
        datos.append({
            "categoria": row['categoria'],
            "cantidad": row['cantidad'],
            "ingresos": float(row['total_ingresos'])
        })
    
    return jsonify(datos)


@admin_bp.route("/api/reportes/diplomados-rendimiento")
@login_required
def reportes_diplomados_rendimiento():
    """Obtiene el rendimiento de cada diplomado"""
    cur = mysql.connection.cursor(DictCursor)
    
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
            COUNT(c.id) as total_contenidos,
            d.fecha_creacion
        FROM diplomados d
        LEFT JOIN contenidos c ON d.id = c.diplomado_id
        GROUP BY d.id
        ORDER BY d.fecha_creacion DESC
    """)
    
    resultados = cur.fetchall()
    cur.close()
    
    datos = []
    for row in resultados:
        # Calcular progreso (basado en contenidos vs lecciones estimadas)
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
            "progreso": progreso
        })
    
    return jsonify(datos)


@admin_bp.route("/api/reportes/metricas-engagement")
@login_required
def reportes_metricas_engagement():
    """Obtiene métricas de engagement de usuarios"""
    cur = mysql.connection.cursor(DictCursor)
    
    # Usuarios activos (últimos 30 días)
    cur.execute("""
        SELECT COUNT(*) as total 
        FROM usuarios 
        WHERE estado = 'activo' 
        AND fecha_actualizacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    """)
    usuarios_activos = cur.fetchone()['total']
    
    # Total usuarios
    cur.execute("SELECT COUNT(*) as total FROM usuarios WHERE fk_rol = 1")
    total_usuarios = cur.fetchone()['total']
    
    tasa_retencion = 0
    if total_usuarios > 0:
        tasa_retencion = round((usuarios_activos / total_usuarios) * 100, 1)
    
    cur.close()
    
    # Datos simulados (puedes ajustar según tu lógica real)
    return jsonify({
        "tiempo_promedio_sesion": "2.4h",
        "sesiones_totales": 8934,
        "tasa_retencion": tasa_retencion,
        "usuarios_activos_porcentaje": 71.5
    })


# ---------------------
# Gestión de diplomados
# ---------------------
@admin_bp.route("/admin/diplomados")
@login_required
def gestion_diplomados():
    return render_template("admin/gestionDiplomados.html", user=current_user)


# ---------------------
# Métricas
# ---------------------
@admin_bp.route("/admin/metricas")
@login_required
def metricas():
    return render_template("admin/metricas.html", user=current_user)


# ---------------------
# Subir contenido
# ---------------------
@admin_bp.route("/admin/contenido")
@login_required
def subir_contenido():
    return render_template("admin/subirContenido.html", user=current_user)


# =====================================================
# ENDPOINTS PARA MATRÍCULAS Y PROGRESO
# =====================================================

@admin_bp.route("/api/matriculas", methods=["GET"])
@login_required
def listar_matriculas():
    """Lista todas las matrículas con filtros"""
    estado = request.args.get('estado', 'todos')
    diplomado_id = request.args.get('diplomado_id', None)
    
    cur = mysql.connection.cursor(DictCursor)
    
    query = """
        SELECT 
            m.id,
            m.fecha_inscripcion,
            m.fecha_inicio,
            m.fecha_finalizacion,
            m.estado,
            m.progreso_porcentaje,
            m.calificacion_final,
            m.monto_pagado,
            u.nombre as estudiante_nombre,
            u.correo as estudiante_correo,
            d.titulo as diplomado_titulo,
            d.categoria
        FROM matriculas m
        JOIN usuarios u ON m.usuario_id = u.id
        JOIN diplomados d ON m.diplomado_id = d.id
        WHERE 1=1
    """
    params = []
    
    if estado != 'todos':
        query += " AND m.estado = %s"
        params.append(estado)
    
    if diplomado_id:
        query += " AND m.diplomado_id = %s"
        params.append(diplomado_id)
    
    query += " ORDER BY m.fecha_inscripcion DESC"
    
    cur.execute(query, params)
    matriculas = cur.fetchall()
    cur.close()
    
    # Convertir Decimal a float
    for matricula in matriculas:
        if matricula['progreso_porcentaje']:
            matricula['progreso_porcentaje'] = float(matricula['progreso_porcentaje'])
        if matricula['calificacion_final']:
            matricula['calificacion_final'] = float(matricula['calificacion_final'])
        if matricula['monto_pagado']:
            matricula['monto_pagado'] = float(matricula['monto_pagado'])
    
    return jsonify(matriculas)


@admin_bp.route("/api/matriculas/<int:matricula_id>", methods=["GET"])
@login_required
def obtener_matricula(matricula_id):
    """Obtiene detalles de una matrícula específica"""
    cur = mysql.connection.cursor(DictCursor)
    
    cur.execute("""
        SELECT 
            m.*,
            u.nombre as estudiante_nombre,
            u.correo as estudiante_correo,
            u.telefono as estudiante_telefono,
            d.titulo as diplomado_titulo,
            d.categoria,
            d.duracion_horas,
            d.lecciones_estimadas
        FROM matriculas m
        JOIN usuarios u ON m.usuario_id = u.id
        JOIN diplomados d ON m.diplomado_id = d.id
        WHERE m.id = %s
    """, (matricula_id,))
    
    matricula = cur.fetchone()
    
    if not matricula:
        cur.close()
        return jsonify({"error": "Matrícula no encontrada"}), 404
    
    # Obtener progreso de contenidos
    cur.execute("""
        SELECT 
            pc.id,
            pc.completado,
            pc.fecha_completado,
            pc.tiempo_dedicado_minutos,
            pc.calificacion,
            c.titulo as contenido_titulo,
            c.tipo
        FROM progreso_contenidos pc
        JOIN contenidos c ON pc.contenido_id = c.id
        WHERE pc.usuario_id = %s AND pc.diplomado_id = %s
        ORDER BY c.orden
    """, (matricula['usuario_id'], matricula['diplomado_id']))
    
    progresos = cur.fetchall()
    cur.close()
    
    # Convertir Decimals
    if matricula['progreso_porcentaje']:
        matricula['progreso_porcentaje'] = float(matricula['progreso_porcentaje'])
    if matricula['calificacion_final']:
        matricula['calificacion_final'] = float(matricula['calificacion_final'])
    if matricula['monto_pagado']:
        matricula['monto_pagado'] = float(matricula['monto_pagado'])
    
    matricula['progresos'] = progresos
    
    return jsonify(matricula)


@admin_bp.route("/api/matriculas", methods=["POST"])
@login_required
def crear_matricula():
    """Crea una nueva matrícula"""
    data = request.get_json()
    
    usuario_id = data.get('usuario_id')
    diplomado_id = data.get('diplomado_id')
    monto_pagado = data.get('monto_pagado', 0)
    metodo_pago = data.get('metodo_pago', 'efectivo')
    
    if not usuario_id or not diplomado_id:
        return jsonify({"error": "Faltan datos requeridos"}), 400
    
    cur = mysql.connection.cursor(DictCursor)
    
    # Verificar que no exista ya una matrícula
    cur.execute("""
        SELECT id FROM matriculas 
        WHERE usuario_id = %s AND diplomado_id = %s
    """, (usuario_id, diplomado_id))
    
    if cur.fetchone():
        cur.close()
        return jsonify({"error": "El usuario ya está matriculado en este diplomado"}), 400
    
    # Crear matrícula
    cur.execute("""
        INSERT INTO matriculas 
        (usuario_id, diplomado_id, estado, monto_pagado, metodo_pago, fecha_inicio)
        VALUES (%s, %s, 'inscrito', %s, %s, NOW())
    """, (usuario_id, diplomado_id, monto_pagado, metodo_pago))
    
    mysql.connection.commit()
    matricula_id = cur.lastrowid
    cur.close()
    
    return jsonify({
        "message": "Matrícula creada exitosamente",
        "matricula_id": matricula_id
    }), 201


@admin_bp.route("/api/matriculas/<int:matricula_id>/progreso", methods=["PUT"])
@login_required
def actualizar_progreso_contenido(matricula_id):
    """Actualiza el progreso de un contenido"""
    data = request.get_json()
    
    contenido_id = data.get('contenido_id')
    completado = data.get('completado', False)
    tiempo_dedicado = data.get('tiempo_dedicado_minutos', 0)
    calificacion = data.get('calificacion', None)
    
    cur = mysql.connection.cursor(DictCursor)
    
    # Obtener info de la matrícula
    cur.execute("""
        SELECT usuario_id, diplomado_id 
        FROM matriculas 
        WHERE id = %s
    """, (matricula_id,))
    
    matricula = cur.fetchone()
    
    if not matricula:
        cur.close()
        return jsonify({"error": "Matrícula no encontrada"}), 404
    
    # Verificar si ya existe registro de progreso
    cur.execute("""
        SELECT id FROM progreso_contenidos
        WHERE usuario_id = %s AND contenido_id = %s
    """, (matricula['usuario_id'], contenido_id))
    
    existe = cur.fetchone()
    
    if existe:
        # Actualizar
        cur.execute("""
            UPDATE progreso_contenidos
            SET completado = %s,
                tiempo_dedicado_minutos = tiempo_dedicado_minutos + %s,
                calificacion = COALESCE(%s, calificacion),
                fecha_completado = CASE WHEN %s = 1 THEN NOW() ELSE fecha_completado END
            WHERE usuario_id = %s AND contenido_id = %s
        """, (completado, tiempo_dedicado, calificacion, completado, 
              matricula['usuario_id'], contenido_id))
    else:
        # Insertar
        cur.execute("""
            INSERT INTO progreso_contenidos
            (usuario_id, contenido_id, diplomado_id, completado, 
             tiempo_dedicado_minutos, calificacion, fecha_inicio, fecha_completado)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
        """, (matricula['usuario_id'], contenido_id, matricula['diplomado_id'],
              completado, tiempo_dedicado, calificacion, 
              datetime.now() if completado else None))
    
    mysql.connection.commit()
    
    # El trigger actualizará automáticamente el progreso de la matrícula
    
    cur.close()
    
    return jsonify({"message": "Progreso actualizado exitosamente"})


@admin_bp.route("/api/reportes/tasa-finalizacion-detallada")
@login_required
def tasa_finalizacion_detallada():
    """Obtiene estadísticas detalladas de finalización"""
    cur = mysql.connection.cursor(DictCursor)
    
    # Estadísticas generales
    cur.execute("""
        SELECT 
            COUNT(*) as total_matriculas,
            COUNT(CASE WHEN estado = 'completado' THEN 1 END) as completados,
            COUNT(CASE WHEN estado = 'en_curso' THEN 1 END) as en_curso,
            COUNT(CASE WHEN estado = 'abandonado' THEN 1 END) as abandonados,
            ROUND(AVG(progreso_porcentaje), 2) as progreso_promedio,
            ROUND(AVG(CASE WHEN estado = 'completado' THEN calificacion_final END), 2) as calificacion_promedio
        FROM matriculas
    """)
    
    estadisticas = cur.fetchone()
    
    # Tasa por diplomado
    cur.execute("""
        SELECT 
            d.id,
            d.titulo,
            d.categoria,
            COUNT(m.id) as total_inscritos,
            COUNT(CASE WHEN m.estado = 'completado' THEN 1 END) as completados,
            ROUND(AVG(m.progreso_porcentaje), 2) as progreso_promedio
        FROM diplomados d
        LEFT JOIN matriculas m ON d.id = m.diplomado_id
        WHERE d.estado = 'active'
        GROUP BY d.id
    """)
    
    por_diplomado = cur.fetchall()
    cur.close()
    
    # Calcular tasas
    tasa_general = 0
    if estadisticas['total_matriculas'] > 0:
        tasa_general = round((estadisticas['completados'] / estadisticas['total_matriculas']) * 100, 1)
    
    for dip in por_diplomado:
        if dip['total_inscritos'] > 0:
            dip['tasa_finalizacion'] = round((dip['completados'] / dip['total_inscritos']) * 100, 1)
        else:
            dip['tasa_finalizacion'] = 0
        dip['progreso_promedio'] = float(dip['progreso_promedio']) if dip['progreso_promedio'] else 0
    
    return jsonify({
        "tasa_general": tasa_general,
        "estadisticas": estadisticas,
        "por_diplomado": por_diplomado
    })