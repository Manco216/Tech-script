from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from extensions import mysql
import MySQLdb.cursors
from functools import wraps
from datetime import datetime, timedelta

instructor_bp = Blueprint(
    "instructor",
    __name__,
    url_prefix="/instructor"
)

# Decorador para verificar que el usuario es instructor
def instructor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "No autenticado"}), 401
        if current_user.fk_rol != 2:  # 2 = docente/instructor
            return jsonify({"error": "Acceso no autorizado"}), 403
        return f(*args, **kwargs)
    return decorated_function

# =================== VISTA: HOME INSTRUCTOR ===================
@instructor_bp.route("/home")
@login_required
@instructor_required
def home():
    """Página principal del instructor"""
    return render_template("instructor/home.html", user=current_user)

# =================== VISTA: SEGUIMIENTO ESTUDIANTES ===================
@instructor_bp.route("/seguimiento-estudiantes")
@login_required
@instructor_required
def seguimiento_estudiantes():
    """Página de seguimiento de estudiantes"""
    return render_template("instructor/seguimientoEstudiantes.html", user=current_user)

# =================== API: ESTADÍSTICAS GENERALES ===================
@instructor_bp.route("/api/estadisticas/generales", methods=["GET"])
@login_required
@instructor_required
def estadisticas_generales():
    """Obtiene estadísticas generales de todos los estudiantes del instructor"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Total de estudiantes en diplomados del instructor
        cur.execute("""
            SELECT COUNT(DISTINCT m.usuario_id) as total_estudiantes
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s
        """, (current_user.id,))
        
        total = cur.fetchone()
        
        # Estudiantes activos (con matrícula en curso o inscrita)
        cur.execute("""
            SELECT COUNT(DISTINCT m.usuario_id) as activos
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s 
            AND m.estado IN ('en_curso', 'inscrito')
        """, (current_user.id,))
        
        activos = cur.fetchone()
        
        # Total de diplomados activos del instructor
        cur.execute("""
            SELECT COUNT(*) as total_diplomados
            FROM diplomados
            WHERE usuario_id = %s AND estado = 'active'
        """, (current_user.id,))
        
        diplomados = cur.fetchone()
        
        # Certificados emitidos
        cur.execute("""
            SELECT COUNT(*) as total_certificados
            FROM certificados c
            JOIN diplomados d ON c.diplomado_id = d.id
            WHERE d.usuario_id = %s
        """, (current_user.id,))
        
        certificados = cur.fetchone()
        
        # Promedio de estudiantes por diplomado
        avg_estudiantes = 0
        if diplomados['total_diplomados'] > 0:
            avg_estudiantes = round(total['total_estudiantes'] / diplomados['total_diplomados'])
        
        cur.close()
        
        return jsonify({
            "total_estudiantes": total['total_estudiantes'] or 0,
            "estudiantes_activos": activos['activos'] or 0,
            "total_diplomados": diplomados['total_diplomados'] or 0,
            "total_certificados": certificados['total_certificados'] or 0,
            "avg_estudiantes_por_diplomado": avg_estudiantes
        }), 200
        
    except Exception as e:
        print(f"❌ Error en estadísticas generales: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: DIPLOMADOS CON ESTUDIANTES ===================
@instructor_bp.route("/api/diplomados-estudiantes", methods=["GET"])
@login_required
@instructor_required
def diplomados_con_estudiantes():
    """Lista diplomados del instructor con estadísticas de estudiantes"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT 
                d.id,
                d.titulo as name,
                d.categoria,
                COUNT(DISTINCT m.usuario_id) as students,
                COUNT(DISTINCT CASE WHEN m.estado IN ('en_curso', 'inscrito') THEN m.usuario_id END) as active,
                COUNT(DISTINCT CASE WHEN m.estado = 'completado' THEN m.usuario_id END) as completed,
                COALESCE(ROUND(AVG(m.progreso_porcentaje), 0), 0) as progress
            FROM diplomados d
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            WHERE d.usuario_id = %s AND d.estado = 'active'
            GROUP BY d.id
            ORDER BY students DESC
        """, (current_user.id,))
        
        diplomados = cur.fetchall()
        cur.close()
        
        # Mapeo de íconos por categoría
        iconos = {
            "Backend": "fab fa-python",
            "Frontend": "fab fa-react",
            "DevOps": "fas fa-server",
            "Data Science": "fas fa-chart-line",
            "Mobile": "fas fa-mobile-alt",
            "Blockchain": "fas fa-link",
            "UX/UI": "fas fa-palette"
        }
        
        colores = {
            "Backend": "#306998",
            "Frontend": "#61dafb",
            "DevOps": "#4facfe",
            "Data Science": "#fa709a",
            "Mobile": "#6c5ce7",
            "Blockchain": "#ffecd2",
            "UX/UI": "#ff6b6b"
        }
        
        resultado = []
        for dip in diplomados:
            resultado.append({
                "id": str(dip['id']),
                "name": dip['name'],
                "icon": iconos.get(dip['categoria'], "fas fa-graduation-cap"),
                "color": colores.get(dip['categoria'], "#6366f1"),
                "students": dip['students'] or 0,
                "active": dip['active'] or 0,
                "completed": dip['completed'] or 0,
                "progress": int(dip['progress'] or 0),
                "satisfaction": 4.5  # Valor fijo por ahora
            })
        
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"❌ Error al obtener diplomados con estudiantes: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: TENDENCIA DE INSCRIPCIONES ===================
@instructor_bp.route("/api/tendencia-inscripciones", methods=["GET"])
@login_required
@instructor_required
def tendencia_inscripciones():
    """Obtiene la tendencia de inscripciones por mes"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT 
                DATE_FORMAT(m.fecha_inscripcion, '%%Y-%%m') as mes,
                COUNT(*) as inscripciones
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s
            AND m.fecha_inscripcion >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY mes
            ORDER BY mes ASC
        """, (current_user.id,))
        
        datos = cur.fetchall()
        cur.close()
        
        meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        
        # Crear diccionario con todos los meses del último año
        hoy = datetime.now()
        labels = []
        values = []
        
        # Crear mapa de datos existentes
        datos_map = {dato['mes']: dato['inscripciones'] for dato in datos}
        
        # Generar últimos 12 meses
        for i in range(11, -1, -1):
            fecha = hoy - timedelta(days=30*i)
            mes_key = fecha.strftime('%Y-%m')
            mes_nombre = meses[fecha.month - 1]
            
            labels.append(mes_nombre)
            values.append(datos_map.get(mes_key, 0))
        
        return jsonify({
            "labels": labels,
            "data": values
        }), 200
        
    except Exception as e:
        print(f"❌ Error en tendencia de inscripciones: {e}")
        return jsonify({"error": str(e)}), 500
    
# =================== API: DISTRIBUCIÓN DE PROGRESO ===================
@instructor_bp.route("/api/distribucion-progreso", methods=["GET"])
@login_required
@instructor_required
def distribucion_progreso():
    """Obtiene la distribución de estudiantes por rango de progreso"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT 
                COUNT(CASE WHEN m.progreso_porcentaje BETWEEN 0 AND 25 THEN 1 END) as iniciando,
                COUNT(CASE WHEN m.progreso_porcentaje BETWEEN 26 AND 75 THEN 1 END) as en_progreso,
                COUNT(CASE WHEN m.progreso_porcentaje BETWEEN 76 AND 100 THEN 1 END) as avanzado
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s
        """, (current_user.id,))
        
        distribucion = cur.fetchone()
        cur.close()
        
        return jsonify({
            "iniciando": distribucion['iniciando'] or 0,
            "en_progreso": distribucion['en_progreso'] or 0,
            "avanzado": distribucion['avanzado'] or 0
        }), 200
        
    except Exception as e:
        print(f"❌ Error en distribución de progreso: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: ACTIVIDAD RECIENTE ===================
@instructor_bp.route("/api/actividad-reciente", methods=["GET"])
@login_required
@instructor_required
def actividad_reciente():
    """Obtiene estadísticas de actividad reciente"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Nuevas inscripciones hoy
        cur.execute("""
            SELECT COUNT(*) as nuevas_hoy
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s
            AND DATE(m.fecha_inscripcion) = CURDATE()
        """, (current_user.id,))
        nuevas_hoy = cur.fetchone()
        
        # Contenidos completados hoy
        cur.execute("""
            SELECT COUNT(*) as completados_hoy
            FROM progreso_contenidos pc
            JOIN contenidos c ON pc.contenido_id = c.id
            WHERE c.usuario_id = %s
            AND pc.completado = 1
            AND DATE(pc.fecha_completado) = CURDATE()
        """, (current_user.id,))
        completados_hoy = cur.fetchone()
        
        # Certificados emitidos hoy
        cur.execute("""
            SELECT COUNT(*) as certificados_hoy
            FROM certificados cert
            JOIN diplomados d ON cert.diplomado_id = d.id
            WHERE d.usuario_id = %s
            AND DATE(cert.fecha_emision) = CURDATE()
        """, (current_user.id,))
        certificados_hoy = cur.fetchone()
        
        cur.close()
        
        return jsonify({
            "nuevas_inscripciones": nuevas_hoy['nuevas_hoy'] or 0,
            "modulos_completados": completados_hoy['completados_hoy'] or 0,
            "certificados_emitidos": certificados_hoy['certificados_hoy'] or 0
        }), 200
        
    except Exception as e:
        print(f"❌ Error en actividad reciente: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: TOP DIPLOMADOS ===================
@instructor_bp.route("/api/top-diplomados", methods=["GET"])
@login_required
@instructor_required
def top_diplomados():
    """Obtiene los 3 diplomados más populares"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Primero obtenemos el total de estudiantes
        cur.execute("""
            SELECT COUNT(*) as total
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s
        """, (current_user.id,))
        
        total_result = cur.fetchone()
        total_estudiantes = total_result['total'] or 1
        
        # Ahora obtenemos los top diplomados
        cur.execute("""
            SELECT 
                d.titulo as nombre,
                COUNT(m.id) as total_estudiantes
            FROM diplomados d
            LEFT JOIN matriculas m ON d.id = m.diplomado_id
            WHERE d.usuario_id = %s
            GROUP BY d.id
            ORDER BY total_estudiantes DESC
            LIMIT 3
        """, (current_user.id,))
        
        top_diplomados = cur.fetchall()
        cur.close()
        
        resultado = []
        for idx, dip in enumerate(top_diplomados, 1):
            estudiantes = dip['total_estudiantes'] or 0
            porcentaje = round((estudiantes / total_estudiantes) * 100) if total_estudiantes > 0 else 0
            
            resultado.append({
                "rank": idx,
                "nombre": dip['nombre'],
                "estudiantes": estudiantes,
                "porcentaje": porcentaje
            })
        
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"❌ Error en top diplomados: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: FILTRAR POR DIPLOMADO ===================
@instructor_bp.route("/api/estadisticas/diplomado/<int:diplomado_id>", methods=["GET"])
@login_required
@instructor_required
def estadisticas_por_diplomado(diplomado_id):
    """Obtiene estadísticas filtradas por un diplomado específico"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Verificar que el diplomado pertenezca al instructor
        cur.execute("""
            SELECT id FROM diplomados 
            WHERE id = %s AND usuario_id = %s
        """, (diplomado_id, current_user.id))
        
        if not cur.fetchone():
            cur.close()
            return jsonify({"error": "Diplomado no encontrado"}), 404
        
        # Estadísticas del diplomado
        cur.execute("""
            SELECT 
                COUNT(DISTINCT m.usuario_id) as total_estudiantes,
                COUNT(DISTINCT CASE WHEN m.estado IN ('en_curso', 'inscrito') THEN m.usuario_id END) as activos,
                COUNT(DISTINCT CASE WHEN m.estado = 'completado' THEN m.usuario_id END) as completados,
                COALESCE(ROUND(AVG(m.progreso_porcentaje), 0), 0) as progreso_promedio
            FROM matriculas m
            WHERE m.diplomado_id = %s
        """, (diplomado_id,))
        
        stats = cur.fetchone()
        
        # Certificados del diplomado
        cur.execute("""
            SELECT COUNT(*) as total_certificados
            FROM certificados
            WHERE diplomado_id = %s
        """, (diplomado_id,))
        
        certs = cur.fetchone()
        
        cur.close()
        
        total = stats['total_estudiantes'] or 0
        activos = stats['activos'] or 0
        
        return jsonify({
            "total_estudiantes": total,
            "estudiantes_activos": activos,
            "completados": stats['completados'] or 0,
            "progreso_promedio": int(stats['progreso_promedio'] or 0),
            "total_certificados": certs['total_certificados'] or 0,
            "activos": activos,
            "inactivos": total - activos
        }), 200
        
    except Exception as e:
        print(f"❌ Error en estadísticas por diplomado: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: LISTA DE ESTUDIANTES ===================
@instructor_bp.route("/api/estudiantes", methods=["GET"])
@login_required
@instructor_required
def lista_estudiantes():
    """Obtiene lista de estudiantes con sus datos de progreso"""
    try:
        diplomado_id = request.args.get('diplomado_id', None)
        
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        if diplomado_id:
            # Filtrar por diplomado específico
            cur.execute("""
                SELECT 
                    u.id,
                    u.nombre,
                    u.correo,
                    m.progreso_porcentaje,
                    m.estado,
                    m.fecha_inscripcion,
                    d.titulo as diplomado,
                    CASE 
                        WHEN m.progreso_porcentaje BETWEEN 0 AND 25 THEN 'Iniciando'
                        WHEN m.progreso_porcentaje BETWEEN 26 AND 75 THEN 'En progreso'
                        WHEN m.progreso_porcentaje BETWEEN 76 AND 100 THEN 'Avanzado'
                    END as nivel_progreso
                FROM usuarios u
                JOIN matriculas m ON u.id = m.usuario_id
                JOIN diplomados d ON m.diplomado_id = d.id
                WHERE d.id = %s AND d.usuario_id = %s
                ORDER BY m.fecha_inscripcion DESC
            """, (diplomado_id, current_user.id))
        else:
            # Todos los estudiantes
            cur.execute("""
                SELECT 
                    u.id,
                    u.nombre,
                    u.correo,
                    AVG(m.progreso_porcentaje) as progreso_porcentaje,
                    COUNT(DISTINCT m.diplomado_id) as total_diplomados,
                    MAX(m.fecha_inscripcion) as fecha_inscripcion
                FROM usuarios u
                JOIN matriculas m ON u.id = m.usuario_id
                JOIN diplomados d ON m.diplomado_id = d.id
                WHERE d.usuario_id = %s
                GROUP BY u.id
                ORDER BY fecha_inscripcion DESC
            """, (current_user.id,))
        
        estudiantes = cur.fetchall()
        cur.close()
        
        resultado = []
        for est in estudiantes:
            resultado.append({
                "id": est['id'],
                "nombre": est['nombre'],
                "correo": est['correo'],
                "progreso": round(est['progreso_porcentaje'] or 0),
                "estado": est.get('estado', 'activo'),
                "fecha_inscripcion": est['fecha_inscripcion'].strftime('%Y-%m-%d') if est['fecha_inscripcion'] else None,
                "diplomado": est.get('diplomado', ''),
                "nivel_progreso": est.get('nivel_progreso', 'Iniciando'),
                "total_diplomados": est.get('total_diplomados', 1)
            })
        
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"❌ Error al obtener lista de estudiantes: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: DETALLE DE ESTUDIANTE ===================
@instructor_bp.route("/api/estudiante/<int:estudiante_id>", methods=["GET"])
@login_required
@instructor_required
def detalle_estudiante(estudiante_id):
    """Obtiene información detallada de un estudiante específico"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Información básica del estudiante
        cur.execute("""
            SELECT 
                u.id,
                u.nombre,
                u.correo,
                u.telefono,
                u.fecha_registro
            FROM usuarios u
            WHERE u.id = %s
        """, (estudiante_id,))
        
        estudiante = cur.fetchone()
        
        if not estudiante:
            cur.close()
            return jsonify({"error": "Estudiante no encontrado"}), 404
        
        # Diplomados en los que está inscrito (solo del instructor actual)
        cur.execute("""
            SELECT 
                d.id,
                d.titulo,
                m.progreso_porcentaje,
                m.estado,
                m.fecha_inscripcion,
                m.fecha_completado
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE m.usuario_id = %s AND d.usuario_id = %s
        """, (estudiante_id, current_user.id))
        
        diplomados = cur.fetchall()
        
        # Progreso en contenidos
        cur.execute("""
            SELECT 
                COUNT(*) as total_contenidos,
                SUM(CASE WHEN pc.completado = 1 THEN 1 ELSE 0 END) as completados
            FROM progreso_contenidos pc
            JOIN contenidos c ON pc.contenido_id = c.id
            WHERE pc.usuario_id = %s AND c.usuario_id = %s
        """, (estudiante_id, current_user.id))
        
        progreso_contenidos = cur.fetchone()
        
        cur.close()
        
        diplomados_lista = []
        for dip in diplomados:
            diplomados_lista.append({
                "id": dip['id'],
                "titulo": dip['titulo'],
                "progreso": round(dip['progreso_porcentaje'] or 0),
                "estado": dip['estado'],
                "fecha_inscripcion": dip['fecha_inscripcion'].strftime('%Y-%m-%d') if dip['fecha_inscripcion'] else None,
                "fecha_completado": dip['fecha_completado'].strftime('%Y-%m-%d') if dip['fecha_completado'] else None
            })
        
        return jsonify({
            "id": estudiante['id'],
            "nombre": estudiante['nombre'],
            "correo": estudiante['correo'],
            "telefono": estudiante['telefono'],
            "fecha_registro": estudiante['fecha_registro'].strftime('%Y-%m-%d') if estudiante['fecha_registro'] else None,
            "diplomados": diplomados_lista,
            "total_contenidos": progreso_contenidos['total_contenidos'] or 0,
            "contenidos_completados": progreso_contenidos['completados'] or 0
        }), 200
        
    except Exception as e:
        print(f"❌ Error al obtener detalle de estudiante: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: BÚSQUEDA DE ESTUDIANTES ===================
@instructor_bp.route("/api/estudiantes/buscar", methods=["GET"])
@login_required
@instructor_required
def buscar_estudiantes():
    """Busca estudiantes por nombre o correo"""
    try:
        termino = request.args.get('q', '')
        
        if not termino or len(termino) < 2:
            return jsonify([]), 200
        
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT DISTINCT
                u.id,
                u.nombre,
                u.correo,
                COUNT(DISTINCT m.diplomado_id) as total_diplomados
            FROM usuarios u
            JOIN matriculas m ON u.id = m.usuario_id
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE d.usuario_id = %s
            AND (u.nombre LIKE %s OR u.correo LIKE %s)
            GROUP BY u.id
            LIMIT 10
        """, (current_user.id, f'%{termino}%', f'%{termino}%'))
        
        resultados = cur.fetchall()
        cur.close()
        
        return jsonify(resultados), 200
        
    except Exception as e:
        print(f"❌ Error en búsqueda de estudiantes: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: EXPORTAR REPORTE ===================
@instructor_bp.route("/api/exportar-reporte", methods=["GET"])
@login_required
@instructor_required
def exportar_reporte():
    """Genera datos para exportar reporte completo"""
    try:
        diplomado_id = request.args.get('diplomado_id', None)
        
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        if diplomado_id:
            cur.execute("""
                SELECT 
                    u.nombre,
                    u.correo,
                    d.titulo as diplomado,
                    m.progreso_porcentaje,
                    m.estado,
                    m.fecha_inscripcion,
                    m.fecha_completado
                FROM usuarios u
                JOIN matriculas m ON u.id = m.usuario_id
                JOIN diplomados d ON m.diplomado_id = d.id
                WHERE d.id = %s AND d.usuario_id = %s
                ORDER BY u.nombre
            """, (diplomado_id, current_user.id))
        else:
            cur.execute("""
                SELECT 
                    u.nombre,
                    u.correo,
                    d.titulo as diplomado,
                    m.progreso_porcentaje,
                    m.estado,
                    m.fecha_inscripcion,
                    m.fecha_completado
                FROM usuarios u
                JOIN matriculas m ON u.id = m.usuario_id
                JOIN diplomados d ON m.diplomado_id = d.id
                WHERE d.usuario_id = %s
                ORDER BY u.nombre, d.titulo
            """, (current_user.id,))
        
        datos = cur.fetchall()
        cur.close()
        
        resultado = []
        for dato in datos:
            resultado.append({
                "nombre": dato['nombre'],
                "correo": dato['correo'],
                "diplomado": dato['diplomado'],
                "progreso": round(dato['progreso_porcentaje'] or 0),
                "estado": dato['estado'],
                "fecha_inscripcion": dato['fecha_inscripcion'].strftime('%Y-%m-%d') if dato['fecha_inscripcion'] else '',
                "fecha_completado": dato['fecha_completado'].strftime('%Y-%m-%d') if dato['fecha_completado'] else ''
            })
        
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"❌ Error al exportar reporte: {e}")
        return jsonify({"error": str(e)}), 500