# admin_routes.py
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import mysql
from gestionUsuarios import contar_usuarios, contar_por_rol
from MySQLdb.cursors import DictCursor
from datetime import datetime
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
    cur = mysql.connection.cursor(DictCursor)

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
    cur.close()
    
    return jsonify({"message": "Progreso actualizado exitosamente"})

@admin_bp.route("/admin/reportes")
@login_required
def reportes():
    return render_template("admin/reportes.html", user=current_user)

