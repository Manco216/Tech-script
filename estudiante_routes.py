from flask import Blueprint, render_template, jsonify, request, redirect, url_for
from flask_login import login_required, current_user
from extensions import mysql
import MySQLdb.cursors
import json
from decimal import Decimal

estudiante_bp = Blueprint(
    "estudiante",
    __name__,
    url_prefix="/estudiante"
)

def decimal_to_float(obj):
    """Convierte Decimals a float recursivamente"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    return obj

def get_gradient_by_category(category):
    """Retorna un gradiente según la categoría"""
    gradients = {
        "Backend": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "Frontend": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "DevOps": "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "Data Science": "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "Mobile": "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        "Blockchain": "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    }
    return gradients.get(category, "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")

# =================== VISTA: HOME ESTUDIANTE ===================
@estudiante_bp.route("/home")
@login_required
def home():
    """Página principal del estudiante"""
    return render_template("estudiante/home.html", user=current_user)

# =================== VISTA: DIPLOMADOS ===================
@estudiante_bp.route("/diplomados")
@login_required
def diplomados():
    """Página de diplomados del estudiante"""
    return render_template("estudiante/diplomados.html", user=current_user)

# =================== API: LISTAR DIPLOMADOS DISPONIBLES ===================
@estudiante_bp.route("/api/diplomados", methods=["GET"])
@login_required
def listar_diplomados():
    """Lista todos los diplomados activos con información de matrícula del estudiante"""
    print(f"🔍 DEBUG: Usuario actual ID: {current_user.id}")
    print(f"🔍 DEBUG: Intentando listar diplomados...")
    
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Obtener todos los diplomados activos con estado de matrícula
        cur.execute("""
            SELECT 
                d.id,
                d.titulo,
                d.categoria,
                d.descripcion,
                d.nivel,
                d.duracion_horas,
                d.lecciones_estimadas,
                d.objetivos,
                d.precio,
                d.estado,
                u.nombre as instructor_nombre,
                COUNT(DISTINCT c.id) as total_contenidos,
                COUNT(DISTINCT m_estudiantes.id) as total_estudiantes,
                m.id as matricula_id,
                m.estado as estado_matricula,
                m.progreso_porcentaje,
                m.fecha_inscripcion
            FROM diplomados d
            LEFT JOIN usuarios u ON d.usuario_id = u.id
            LEFT JOIN contenidos c ON d.id = c.diplomado_id
            LEFT JOIN matriculas m_estudiantes ON d.id = m_estudiantes.diplomado_id
            LEFT JOIN matriculas m ON d.id = m.diplomado_id AND m.usuario_id = %s
            WHERE d.estado = 'active'
            GROUP BY d.id
            ORDER BY d.fecha_creacion DESC
        """, (current_user.id,))
        
        diplomados = cur.fetchall()
        cur.close()
        
        print(f"✅ DEBUG: Se encontraron {len(diplomados)} diplomados")
        
        # Procesar cada diplomado
        resultado = []
        for dip in diplomados:
            # Determinar el estado para el estudiante
            status = "inscribirse"
            
            if dip['precio'] == 0 or dip['precio'] is None:
                status = "inscribirse"
            elif dip['matricula_id']:
                if dip['estado_matricula'] == 'completado':
                    status = "completado"
                elif dip['estado_matricula'] in ['en_curso', 'inscrito']:
                    status = "continuar"
            else:
                status = "comprar"
            
            # Parsear objetivos JSON
            objetivos = []
            if dip['objetivos']:
                try:
                    objetivos = json.loads(dip['objetivos'])
                except:
                    objetivos = []
            
            resultado.append({
                "id": dip['id'],
                "title": dip['titulo'],
                "description": dip['descripcion'],
                "level": dip['nivel'],
                "category": dip['categoria'],
                "rating": 4.7,
                "students": dip['total_estudiantes'] or 0,
                "duration": f"{dip['duracion_horas']} horas" if dip['duracion_horas'] else "Por definir",
                "modules": dip['total_contenidos'] or 0,
                "instructor": dip['instructor_nombre'] or "Instructor",
                "currentPrice": float(dip['precio']) if dip['precio'] else 0,
                "originalPrice": float(dip['precio']) * 1.3 if dip['precio'] and dip['precio'] > 0 else 0,
                "status": status,
                "gradient": get_gradient_by_category(dip['categoria']),
                "matricula_id": dip['matricula_id'],
                "progreso": float(dip['progreso_porcentaje']) if dip['progreso_porcentaje'] else 0,
                "objetivos": objetivos,
                "lecciones_estimadas": dip['lecciones_estimadas'] or 0
            })
        
        print(f"✅ DEBUG: Diplomados procesados correctamente")
        return jsonify(resultado), 200
        
    except Exception as e:
        import traceback
        print(f"❌ Error al listar diplomados: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# =================== VISTA: MÓDULOS DE UN DIPLOMADO ===================
@estudiante_bp.route("/modulos/<int:diplomado_id>")
@login_required
def modulos(diplomado_id):
    """Página de módulos de un diplomado específico"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT 
                d.*,
                u.nombre as instructor_nombre,
                m.id as matricula_id,
                m.estado as estado_matricula,
                m.progreso_porcentaje
            FROM diplomados d
            LEFT JOIN usuarios u ON d.usuario_id = u.id
            LEFT JOIN matriculas m ON d.id = m.diplomado_id AND m.usuario_id = %s
            WHERE d.id = %s
        """, (current_user.id, diplomado_id))
        
        diplomado = cur.fetchone()
        cur.close()
        
        if not diplomado:
            return "Diplomado no encontrado", 404
        
        return render_template(
            "estudiante/modulos.html", 
            user=current_user,
            diplomado_id=diplomado_id
        )
        
    except Exception as e:
        print(f"❌ Error al cargar módulos: {e}")
        return "Error al cargar el diplomado", 500

# =================== API: INFORMACIÓN DETALLADA DE DIPLOMADO ===================
@estudiante_bp.route("/api/diplomados/<int:diplomado_id>", methods=["GET"])
@login_required
def detalle_diplomado(diplomado_id):
    """Obtiene información detallada de un diplomado"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT 
                d.*,
                u.nombre as instructor_nombre,
                u.correo as instructor_correo,
                COUNT(DISTINCT c.id) as total_contenidos,
                COUNT(DISTINCT m_est.id) as total_estudiantes,
                m.id as matricula_id,
                m.estado as estado_matricula,
                m.progreso_porcentaje,
                m.fecha_inscripcion
            FROM diplomados d
            LEFT JOIN usuarios u ON d.usuario_id = u.id
            LEFT JOIN contenidos c ON d.id = c.diplomado_id AND c.estado = 'published'
            LEFT JOIN matriculas m_est ON d.id = m_est.diplomado_id
            LEFT JOIN matriculas m ON d.id = m.diplomado_id AND m.usuario_id = %s
            WHERE d.id = %s
            GROUP BY d.id
        """, (current_user.id, diplomado_id))
        
        diplomado = cur.fetchone()
        
        if not diplomado:
            cur.close()
            return jsonify({"error": "Diplomado no encontrado"}), 404
        
        objetivos = []
        if diplomado['objetivos']:
            try:
                objetivos = json.loads(diplomado['objetivos'])
            except:
                objetivos = []
        
        resultado = {
            "id": diplomado['id'],
            "titulo": diplomado['titulo'],
            "descripcion": diplomado['descripcion'],
            "categoria": diplomado['categoria'],
            "nivel": diplomado['nivel'],
            "duracion_horas": diplomado['duracion_horas'] or 0,
            "lecciones_estimadas": diplomado['lecciones_estimadas'] or 0,
            "precio": float(diplomado['precio']) if diplomado['precio'] else 0,
            "estado": diplomado['estado'],
            "objetivos": objetivos,
            "instructor": {
                "nombre": diplomado['instructor_nombre'],
                "correo": diplomado['instructor_correo']
            },
            "estadisticas": {
                "total_contenidos": diplomado['total_contenidos'],
                "total_estudiantes": diplomado['total_estudiantes'],
                "rating": 4.7
            },
            "matricula": {
                "matriculado": bool(diplomado['matricula_id']),
                "estado": diplomado['estado_matricula'],
                "progreso": float(diplomado['progreso_porcentaje']) if diplomado['progreso_porcentaje'] else 0,
                "fecha_inscripcion": diplomado['fecha_inscripcion'].strftime('%Y-%m-%d') if diplomado['fecha_inscripcion'] else None
            }
        }
        
        cur.close()
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"❌ Error al obtener detalle del diplomado: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: CONTENIDOS DE UN DIPLOMADO ===================
@estudiante_bp.route("/api/diplomados/<int:diplomado_id>/contenidos", methods=["GET"])
@login_required
def contenidos_diplomado(diplomado_id):
    """Obtiene los contenidos agrupados por lección de un diplomado"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT id FROM matriculas 
            WHERE usuario_id = %s AND diplomado_id = %s
        """, (current_user.id, diplomado_id))
        
        matricula = cur.fetchone()
        
        cur.execute("""
            SELECT 
                c.id,
                c.titulo,
                c.descripcion,
                c.tipo,
                c.leccion,
                c.orden,
                c.dificultad,
                c.archivo_url,
                pc.completado,
                pc.fecha_completado,
                pc.tiempo_dedicado_minutos
            FROM contenidos c
            LEFT JOIN progreso_contenidos pc ON c.id = pc.contenido_id 
                AND pc.usuario_id = %s
            WHERE c.diplomado_id = %s 
            AND c.estado = 'published'
            ORDER BY c.leccion, c.orden ASC
        """, (current_user.id, diplomado_id))
        
        contenidos = cur.fetchall()
        cur.close()
        
        modulos = {}
        for contenido in contenidos:
            leccion = contenido['leccion'] or 'Sin categoría'
            
            if leccion not in modulos:
                modulos[leccion] = {
                    "titulo": leccion.replace('_', ' ').title(),
                    "lecciones": []
                }
            
            estado = "pending"
            if contenido['completado']:
                estado = "completed"
            elif contenido['tiempo_dedicado_minutos'] and contenido['tiempo_dedicado_minutos'] > 0:
                estado = "in-progress"
            
            archivo_url = contenido['archivo_url']
            if isinstance(archivo_url, (bytes, bytearray)):
                archivo_url = archivo_url.decode('utf-8')
            
            modulos[leccion]["lecciones"].append({
                "id": contenido['id'],
                "titulo": contenido['titulo'],
                "descripcion": contenido['descripcion'],
                "tipo": contenido['tipo'],
                "duracion": "30 minutos",
                "estado": estado,
                "completado": bool(contenido['completado']),
                "archivo_url": archivo_url,
                "puede_acceder": bool(matricula)
            })
        
        resultado = [
            {"leccion": key, **value}
            for key, value in modulos.items()
        ]
        
        return jsonify({
            "diplomado_id": diplomado_id,
            "matriculado": bool(matricula),
            "modulos": resultado
        }), 200
        
    except Exception as e:
        print(f"❌ Error al obtener contenidos: {e}")
        return jsonify({"error": str(e)}), 500

# =================== API: MATRICULARSE EN DIPLOMADO ===================
@estudiante_bp.route("/api/diplomados/<int:diplomado_id>/matricular", methods=["POST"])
@login_required
def matricular_diplomado(diplomado_id):
    """Matricula al estudiante en un diplomado"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("SELECT * FROM diplomados WHERE id = %s", (diplomado_id,))
        diplomado = cur.fetchone()
        
        if not diplomado:
            cur.close()
            return jsonify({"error": "Diplomado no encontrado"}), 404
        
        cur.execute("""
            SELECT id FROM matriculas 
            WHERE usuario_id = %s AND diplomado_id = %s
        """, (current_user.id, diplomado_id))
        
        if cur.fetchone():
            cur.close()
            return jsonify({"error": "Ya estás matriculado en este diplomado"}), 400
        
        cur.execute("""
            INSERT INTO matriculas 
            (usuario_id, diplomado_id, estado, fecha_inicio, monto_pagado)
            VALUES (%s, %s, 'inscrito', NOW(), %s)
        """, (current_user.id, diplomado_id, diplomado['precio'] or 0))
        
        mysql.connection.commit()
        matricula_id = cur.lastrowid
        cur.close()
        
        return jsonify({
            "message": "Matriculado exitosamente",
            "matricula_id": matricula_id
        }), 201
        
    except Exception as e:
        print(f"❌ Error al matricular: {e}")
        return jsonify({"error": str(e)}), 500