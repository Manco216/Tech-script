from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from extensions import mysql
from MySQLdb.cursors import DictCursor
from functools import wraps
from datetime import datetime

# ===============================
# BLUEPRINT DE INSTRUCTOR
# ===============================
instructor_bp = Blueprint("instructor", __name__, url_prefix="/instructor")

# ===============================
# DECORADOR: Solo instructores
# ===============================
def instructor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "No autenticado"}), 401
        if current_user.fk_rol != 2:  # Rol 2 = Instructor
            return jsonify({"error": "Acceso no autorizado"}), 403
        return f(*args, **kwargs)
    return decorated_function

# ===============================
# VISTA PRINCIPAL
# ===============================
@instructor_bp.route("/home")
@login_required
@instructor_required
def home():
    return render_template("instructor/home.html", user=current_user)

# ===============================
# VISTA: Seguimiento de Estudiantes
# ===============================
@instructor_bp.route("/seguimiento-estudiantes")
@login_required
@instructor_required
def seguimiento_estudiantes():
    return render_template("instructor/seguimientoEstudiantes.html", user=current_user)

# ===============================
# API: Datos generales del instructor
# ===============================
@instructor_bp.route("/seguimiento-estudiantes/data")
@login_required
@instructor_required
def obtener_datos_estudiantes():
    """
    Devuelve métricas principales del instructor
    """
    cur = mysql.connection.cursor(DictCursor)
    try:
        # 1. Obtener diplomados del instructor con estadísticas
        cur.execute("""
            SELECT 
                d.id, 
                d.titulo AS nombre, 
                COUNT(DISTINCT m.id) AS inscritos,
                COUNT(DISTINCT CASE WHEN m.estado = 'completado' THEN m.id END) AS completados,
                COUNT(DISTINCT CASE WHEN m.estado = 'en_curso' THEN m.id END) AS en_curso,
                COUNT(DISTINCT CASE WHEN m.estado = 'inscrito' THEN m.id END) AS solo_inscritos
            FROM diplomados d
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            WHERE d.usuario_id = %s AND d.estado = 'active'
            GROUP BY d.id, d.titulo
        """, (current_user.id,))
        
        diplomados = cur.fetchall()

        # 2. Calcular totales generales
        total_estudiantes = sum(d["inscritos"] for d in diplomados)
        total_completados = sum(d["completados"] for d in diplomados)
        # Activos = en_curso + solo_inscritos
        total_activos = sum(d["en_curso"] + d["solo_inscritos"] for d in diplomados)
        total_diplomados = len(diplomados)

        # 3. Certificados emitidos HOY
        cur.execute("""
            SELECT COUNT(*) as certificados_hoy
            FROM certificados c
            INNER JOIN diplomados d ON c.diplomado_id = d.id
            WHERE d.usuario_id = %s
            AND DATE(c.fecha_emision) = CURDATE()
        """, (current_user.id,))
        
        cert_hoy = cur.fetchone()
        certificados_hoy = cert_hoy['certificados_hoy'] if cert_hoy else 0

        # 4. Total de certificados emitidos
        cur.execute("""
            SELECT COUNT(*) as total_certificados
            FROM certificados c
            INNER JOIN diplomados d ON c.diplomado_id = d.id
            WHERE d.usuario_id = %s
        """, (current_user.id,))
        
        total_cert = cur.fetchone()
        total_certificados = total_cert['total_certificados'] if total_cert else 0

        # 5. Crecimiento de estudiantes por mes (últimos 6 meses)
        cur.execute("""
            SELECT 
                DATE_FORMAT(m.fecha_inscripcion, '%%b %%Y') AS mes, 
                COUNT(*) AS total
            FROM matriculas m
            INNER JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s
            AND m.fecha_inscripcion >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(m.fecha_inscripcion, '%%Y-%%m'),
                     DATE_FORMAT(m.fecha_inscripcion, '%%b %%Y')
            ORDER BY MIN(m.fecha_inscripcion) ASC
        """, (current_user.id,))
        
        crecimiento = cur.fetchall()

        # 6. Nuevas inscripciones este mes
        cur.execute("""
            SELECT COUNT(*) as nuevos
            FROM matriculas m
            INNER JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s
            AND MONTH(m.fecha_inscripcion) = MONTH(CURDATE())
            AND YEAR(m.fecha_inscripcion) = YEAR(CURDATE())
        """, (current_user.id,))
        
        nuevos_mes = cur.fetchone()
        crecimiento_texto = f"+{nuevos_mes['nuevos']} este mes" if nuevos_mes else "+0 este mes"

        # 7. Diplomados más populares (preparar datos para gráfica)
        populares = sorted(diplomados, key=lambda x: x["inscritos"], reverse=True)[:5]

        # 8. Actividad reciente (hoy)
        cur.execute("""
            SELECT COUNT(*) as nuevas_inscripciones
            FROM matriculas m
            INNER JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s
            AND DATE(m.fecha_inscripcion) = CURDATE()
        """, (current_user.id,))
        nuevas_hoy = cur.fetchone()

        cur.execute("""
            SELECT COUNT(*) as modulos_completados
            FROM progreso_contenidos pc
            INNER JOIN diplomados d ON pc.diplomado_id = d.id
            WHERE d.usuario_id = %s
            AND DATE(pc.fecha_completado) = CURDATE()
            AND pc.completado = 1
        """, (current_user.id,))
        modulos_hoy = cur.fetchone()

        return jsonify({
            "resumen": {
                "total_estudiantes": total_estudiantes,
                "activos": total_activos,
                "total_diplomados": total_diplomados,
                "certificados": total_certificados,
                "crecimiento_mes": crecimiento_texto
            },
            "crecimiento": crecimiento if crecimiento else [],
            "populares": populares if populares else [],
            "actividad_hoy": {
                "nuevas_inscripciones": nuevas_hoy['nuevas_inscripciones'] if nuevas_hoy else 0,
                "modulos_completados": modulos_hoy['modulos_completados'] if modulos_hoy else 0,
                "certificados_emitidos": certificados_hoy
            }
        })
        
    except Exception as e:
        print("Error obteniendo datos de seguimiento:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ===============================
# API: Obtener perfil del instructor
# ===============================
@instructor_bp.route("/api/perfil", methods=["GET"])
@login_required
@instructor_required
def obtener_perfil():
    """Devuelve los datos del perfil del instructor"""
    try:
        cur = mysql.connection.cursor(DictCursor)
        
        cur.execute("""
            SELECT u.id, u.nombre, u.correo, u.documento, 
                   u.telefono, u.direccion, u.fecha_creacion,
                   r.nombre as rol
            FROM usuarios u
            JOIN roles r ON u.fk_rol = r.id
            WHERE u.id = %s
        """, (current_user.id,))
        
        usuario = cur.fetchone()
        
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        cur.execute("""
            SELECT COUNT(DISTINCT m.id) as total_matriculas
            FROM diplomados d
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            WHERE d.usuario_id = %s
        """, (current_user.id,))
        
        stats = cur.fetchone()
        
        palabras = usuario['nombre'].split()
        iniciales = ''.join([p[0].upper() for p in palabras[:2]])
        
        return jsonify({
            "nombre": usuario['nombre'],
            "correo": usuario['correo'],
            "documento": usuario['documento'] or '',
            "telefono": usuario['telefono'] or '',
            "direccion": usuario['direccion'] or '',
            "rol": usuario['rol'].capitalize(),
            "fecha_ingreso": usuario['fecha_creacion'].strftime('%d/%m/%Y'),
            "iniciales": iniciales,
            "estadisticas": {
                "total_matriculas": stats['total_matriculas'] or 0
            }
        })
        
    except Exception as e:
        print("Error al obtener perfil:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

# ===============================
# API: Actualizar perfil
# ===============================
@instructor_bp.route("/api/perfil", methods=["PUT"])
@login_required
@instructor_required
def actualizar_perfil():
    """Actualiza los datos del perfil del instructor"""
    try:
        datos = request.get_json()
        
        cur = mysql.connection.cursor()
        cur.execute("""
            UPDATE usuarios 
            SET nombre = %s, telefono = %s, direccion = %s
            WHERE id = %s
        """, (datos['nombre'], datos['telefono'], datos['direccion'], current_user.id))
        
        mysql.connection.commit()
        
        return jsonify({"message": "Perfil actualizado correctamente"})
        
    except Exception as e:
        mysql.connection.rollback()
        print("Error al actualizar perfil:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()