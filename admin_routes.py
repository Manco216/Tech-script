from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import mysql
from gestionUsuarios import contar_usuarios, contar_por_rol
from MySQLdb.cursors import DictCursor
from datetime import datetime
import json

# Definimos el blueprint 
admin_bp = Blueprint("admin", __name__, template_folder="templates/admin")

def admin_required(f):
    """Decorador para verificar que el usuario sea administrador"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.fk_rol != 3:
            flash("Acceso denegado. Se requieren permisos de administrador.", "error")
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

# =====================================================
# PANEL PRINCIPAL
# =====================================================
@admin_bp.route("/admin/home", endpoint="home")
@login_required
@admin_required
def home_admin():
    return render_template("admin/home.html", user=current_user)

# =====================================================
# GESTIÓN DE USUARIOS
# =====================================================
@admin_bp.route("/admin/usuarios", endpoint="gestion_usuarios")
@login_required
@admin_required
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

@admin_bp.route("/usuarios/<int:user_id>", methods=["PUT"])
@login_required
@admin_required
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
@admin_required
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
@admin_required
def eliminar_usuario(user_id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM usuarios WHERE id=%s", (user_id,))
    mysql.connection.commit()
    cur.close()
    flash("Usuario eliminado correctamente", "success")
    return redirect(url_for("admin.gestion_usuarios"))

@admin_bp.route("/api/usuarios/filtrar", methods=["GET"])
@login_required
@admin_required
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

@admin_bp.route("/api/usuarios/stats")
@login_required
@admin_required
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

# =====================================================
# GESTIÓN DE DIPLOMADOS - PÁGINA
# =====================================================
@admin_bp.route("/admin/diplomados", endpoint="gestion_diplomados")
@login_required
@admin_required
def gestion_diplomados():
    return render_template("admin/diplomadosIns.html", user=current_user)

# =====================================================
# API DIPLOMADOS - CRUD COMPLETO
# =====================================================

@admin_bp.route("/api/diplomados", methods=["GET"])
@login_required
@admin_required
def api_listar_diplomados():
    """Listar todos los diplomados con información detallada"""
    try:
        print(f"📋 Admin {current_user.id} solicitando diplomados")
        
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("""
            SELECT 
                d.id, d.titulo, d.categoria, d.descripcion, d.nivel, 
                d.duracion_horas, d.lecciones_estimadas, d.objetivos, 
                d.precio, d.estado,
                DATE_FORMAT(d.fecha_creacion, '%%Y-%%m-%%d') as fecha_creacion,
                u.nombre as instructor_nombre,
                COUNT(DISTINCT m.usuario_id) as total_estudiantes,
                COUNT(DISTINCT c.id) as total_contenidos
            FROM diplomados d
            LEFT JOIN usuarios u ON d.usuario_id = u.id
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            LEFT JOIN contenidos c ON d.id = c.diplomado_id
            GROUP BY d.id
            ORDER BY d.fecha_creacion DESC
        """)
        rows = cur.fetchall()
        cur.close()
        
        print(f"📊 Diplomados encontrados: {len(rows)}")

        diplomados = []
        for row in rows:
            try:
                objetivos_data = row.get("objetivos", "[]")
                if isinstance(objetivos_data, bytes):
                    objetivos_data = objetivos_data.decode('utf-8')
                objetivos = json.loads(objetivos_data) if objetivos_data else []
            except:
                objetivos = []

            # Formatear según lo que espera el frontend
            diplomados.append({
                "id": row["id"],
                "title": row["titulo"],  # El JS espera 'title'
                "category": row["categoria"],  # El JS espera 'category'
                "description": row["descripcion"],  # El JS espera 'description'
                "level": row["nivel"],  # El JS espera 'level'
                "duration": f"{row['duracion_horas']}h",  # El JS espera 'duration' con formato
                "modules": row["lecciones_estimadas"],  # El JS espera 'modules'
                "price": float(row["precio"]) if row["precio"] else 0,
                "status": row["estado"],
                "instructor": row["instructor_nombre"] or "Sin instructor",
                "students": row["total_estudiantes"] or 0,
                "totalContent": row["total_contenidos"] or 0,
                "rating": 4.5,  # Valor por defecto
                "gradient": get_gradient_by_category(row["categoria"]),
                "created_at": row["fecha_creacion"],
                # También incluir datos en formato original por si acaso
                "titulo": row["titulo"],
                "categoria": row["categoria"],
                "descripcion": row["descripcion"],
                "nivel": row["nivel"],
                "duracion_horas": row["duracion_horas"],
                "lecciones_estimadas": row["lecciones_estimadas"],
                "objetivos": objetivos,
                "fecha_creacion": row["fecha_creacion"]
            })

        print(f"✅ Diplomados procesados: {len(diplomados)}")
        return jsonify(diplomados), 200
        
    except Exception as e:
        print(f"❌ ERROR al listar diplomados: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/diplomados/<int:diplomado_id>", methods=["GET"])
@login_required
@admin_required
def api_obtener_diplomado(diplomado_id):
    """Obtener un diplomado específico"""
    try:
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("""
            SELECT 
                d.*,
                u.nombre as instructor_nombre,
                COUNT(DISTINCT m.usuario_id) as total_estudiantes,
                COUNT(DISTINCT c.id) as total_contenidos
            FROM diplomados d
            LEFT JOIN usuarios u ON d.usuario_id = u.id
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            LEFT JOIN contenidos c ON d.id = c.diplomado_id
            WHERE d.id = %s
            GROUP BY d.id
        """, (diplomado_id,))
        row = cur.fetchone()
        cur.close()
        
        if not row:
            return jsonify({"error": "Diplomado no encontrado"}), 404
        
        try:
            objetivos_data = row.get("objetivos", "[]")
            if isinstance(objetivos_data, bytes):
                objetivos_data = objetivos_data.decode('utf-8')
            objetivos = json.loads(objetivos_data) if objetivos_data else []
        except:
            objetivos = []
        
        diplomado = {
            "id": row["id"],
            "titulo": row["titulo"],
            "categoria": row["categoria"],
            "descripcion": row["descripcion"],
            "nivel": row["nivel"],
            "duracion_horas": row["duracion_horas"],
            "lecciones_estimadas": row["lecciones_estimadas"],
            "objetivos": objetivos,
            "precio": float(row["precio"]) if row["precio"] else 0,
            "estado": row["estado"],
            "instructor": row["instructor_nombre"],
            "total_estudiantes": row["total_estudiantes"] or 0,
            "total_contenidos": row["total_contenidos"] or 0
        }
        
        return jsonify(diplomado), 200
        
    except Exception as e:
        print(f"❌ Error al obtener diplomado: {e}")
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/diplomados", methods=["POST"])
@login_required
@admin_required
def api_crear_diplomado():
    """Crear un nuevo diplomado"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se recibieron datos"}), 400

        titulo = data.get("titulo")
        categoria = data.get("categoria")
        descripcion = data.get("descripcion")
        nivel = data.get("nivel", "Principiante")
        duracion_horas = int(data.get("duracion_horas") or 0)
        lecciones_estimadas = int(data.get("lecciones_estimadas") or 0)
        objetivos = json.dumps(data.get("objetivos", []))
        precio = float(data.get("precio") or 0)
        estado = data.get("estado", "draft")

        if not titulo or not categoria or not descripcion:
            return jsonify({"error": "Faltan campos obligatorios"}), 400

        cur = mysql.connection.cursor()
        cur.execute("""
            INSERT INTO diplomados (titulo, categoria, descripcion, nivel,
                                    duracion_horas, lecciones_estimadas, objetivos,
                                    precio, estado, usuario_id, fecha_creacion)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
        """, (titulo, categoria, descripcion, nivel,
              duracion_horas, lecciones_estimadas, objetivos,
              precio, estado, current_user.id))
        mysql.connection.commit()
        nuevo_id = cur.lastrowid
        cur.close()

        print(f"✅ Diplomado creado con ID: {nuevo_id}")
        return jsonify({
            "success": True,
            "message": "Diplomado creado exitosamente", 
            "id": nuevo_id
        }), 201

    except Exception as e:
        print(f"❌ Error al crear diplomado: {e}")
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/diplomados/<int:diplomado_id>", methods=["PUT"])
@login_required
@admin_required
def api_editar_diplomado(diplomado_id):
    """Editar un diplomado existente"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se recibieron datos"}), 400

        # Verificar que existe
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("SELECT id FROM diplomados WHERE id = %s", (diplomado_id,))
        if not cur.fetchone():
            cur.close()
            return jsonify({"error": "Diplomado no encontrado"}), 404

        titulo = data.get("titulo")
        categoria = data.get("categoria")
        descripcion = data.get("descripcion")
        nivel = data.get("nivel", "Principiante")
        duracion_horas = int(data.get("duracion_horas") or 0)
        lecciones_estimadas = int(data.get("lecciones_estimadas") or 0)
        objetivos = json.dumps(data.get("objetivos", []))
        precio = float(data.get("precio") or 0)
        estado = data.get("estado", "draft")

        if not titulo or not categoria or not descripcion:
            return jsonify({"error": "Faltan campos obligatorios"}), 400

        cur.execute("""
            UPDATE diplomados
            SET titulo=%s, categoria=%s, descripcion=%s, nivel=%s,
                duracion_horas=%s, lecciones_estimadas=%s, objetivos=%s,
                precio=%s, estado=%s
            WHERE id=%s
        """, (titulo, categoria, descripcion, nivel,
              duracion_horas, lecciones_estimadas, objetivos,
              precio, estado, diplomado_id))
        mysql.connection.commit()
        cur.close()

        print(f"✅ Diplomado {diplomado_id} actualizado")
        return jsonify({
            "success": True,
            "message": "Diplomado actualizado exitosamente"
        }), 200

    except Exception as e:
        print(f"❌ Error al editar diplomado: {e}")
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/diplomados/<int:diplomado_id>", methods=["DELETE"])
@login_required
@admin_required
def api_eliminar_diplomado(diplomado_id):
    """Eliminar un diplomado"""
    try:
        cur = mysql.connection.cursor(DictCursor)
        
        # Verificar que existe
        cur.execute("SELECT id FROM diplomados WHERE id = %s", (diplomado_id,))
        if not cur.fetchone():
            cur.close()
            return jsonify({"error": "Diplomado no encontrado"}), 404
        
        # Verificar si tiene estudiantes
        cur.execute("SELECT COUNT(*) as total FROM matriculas WHERE diplomado_id = %s", (diplomado_id,))
        result = cur.fetchone()
        
        if result['total'] > 0:
            cur.close()
            return jsonify({
                "error": "No se puede eliminar un diplomado con estudiantes matriculados"
            }), 400
        
        # Eliminar
        cur.execute("DELETE FROM diplomados WHERE id=%s", (diplomado_id,))
        mysql.connection.commit()
        cur.close()
        
        print(f"✅ Diplomado {diplomado_id} eliminado")
        return jsonify({
            "success": True,
            "message": "Diplomado eliminado exitosamente"
        }), 200

    except Exception as e:
        print(f"❌ Error al eliminar diplomado: {e}")
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/diplomados/<int:diplomado_id>/estado", methods=["POST"])
@login_required
@admin_required
def cambiar_estado_diplomado(diplomado_id):
    """Cambiar estado de un diplomado"""
    data = request.get_json()
    nuevo_estado = data.get("estado")

    if nuevo_estado not in ["draft", "active", "archived"]:
        return jsonify({"error": "Estado inválido"}), 400

    try:
        cur = mysql.connection.cursor()
        cur.execute("UPDATE diplomados SET estado=%s WHERE id=%s", (nuevo_estado, diplomado_id))
        mysql.connection.commit()
        cur.close()

        return jsonify({"message": f"Diplomado cambiado a {nuevo_estado}"})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/diplomados/stats", methods=["GET"])
@login_required
@admin_required
def diplomados_stats():
    """Estadísticas de diplomados"""
    try:
        cur = mysql.connection.cursor(DictCursor)
        
        cur.execute("SELECT COUNT(*) as total FROM diplomados")
        total_diplomados = cur.fetchone()["total"]
        
        cur.execute("SELECT COUNT(*) as total FROM diplomados WHERE estado = 'active'")
        activos = cur.fetchone()["total"]
        
        cur.execute("SELECT COUNT(DISTINCT usuario_id) as total FROM matriculas")
        total_estudiantes = cur.fetchone()["total"]
        
        cur.execute("SELECT COUNT(*) as total FROM contenidos")
        total_contenidos = cur.fetchone()["total"]
        
        cur.close()
        
        return jsonify({
            "total_diplomados": total_diplomados,
            "activos": activos,
            "total_estudiantes": total_estudiantes,
            "total_contenidos": total_contenidos
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =====================================================
# MÉTRICAS
# =====================================================
@admin_bp.route("/admin/metricas", endpoint="metricas")
@login_required
@admin_required
def metricas():
    return render_template("admin/metricas.html", user=current_user)

# =====================================================
# SUBIR CONTENIDO
# =====================================================
@admin_bp.route("/admin/contenido", endpoint="subir_contenido")
@login_required
@admin_required
def subir_contenido():
    return render_template("admin/subirContenido.html", user=current_user)

# =====================================================
# REPORTES
# =====================================================
@admin_bp.route("/admin/reportes", endpoint="reportes")
@login_required
@admin_required
def reportes():
    return render_template("admin/reportes.html", user=current_user)

# =====================================================
# UTILIDADES
# =====================================================
def get_gradient_by_category(category):
    """Retorna un gradiente según la categoría"""
    gradients = {
        'Frontend': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'Backend': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'Data Science': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'DevOps': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    }
    return gradients.get(category, 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')