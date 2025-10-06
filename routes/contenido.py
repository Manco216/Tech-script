from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
import MySQLdb.cursors
import os
import json
from datetime import datetime

ALLOWED_EXTENSIONS = {
    'video': {'mp4', 'avi', 'mov', 'mkv'},
    'document': {'pdf', 'docx', 'pptx', 'doc', 'ppt'},
    'image': {'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'},
}

MAX_FILE_SIZES = {
    'video': 500 * 1024 * 1024,      # 500MB
    'document': 50 * 1024 * 1024,     # 50MB
    'image': 10 * 1024 * 1024,        # 10MB
    'quiz': 0                          # No requiere archivo
}

def normalize_row(row):
    """Convierte bytes a str en un diccionario de resultados MySQL"""
    normalized = {}
    for k, v in row.items():
        if isinstance(v, (bytes, bytearray)):
            normalized[k] = v.decode("utf-8")
        else:
            normalized[k] = v
    return normalized

def allowed_file(filename, content_type):
    """Verifica si el archivo tiene una extensión permitida"""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS.get(content_type, set())

def get_file_size(file):
    """Obtiene el tamaño del archivo"""
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    return size

def create_contenido_blueprint(mysql):
    contenido_bp = Blueprint(
        "contenido",
        __name__,
        url_prefix="/contenido"
    )

    # =================== API: LISTAR CONTENIDOS ===================
    @contenido_bp.route("/api/listar/<int:diplomado_id>", methods=["GET"])
    @login_required
    def listar_contenidos(diplomado_id):
        try:
            cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            
            # Verificar que el diplomado pertenece al usuario
            cur.execute("""
                SELECT id FROM diplomados 
                WHERE id = %s AND usuario_id = %s
            """, (diplomado_id, current_user.id))
            
            if not cur.fetchone():
                cur.close()
                return jsonify({"error": "Diplomado no encontrado"}), 404
            
            # Listar contenidos - CORREGIDO: convertir BLOB a texto
            cur.execute("""
                SELECT 
                    id, titulo, descripcion, tipo, 
                    CONVERT(archivo_url USING utf8) as archivo_url,
                    leccion, orden, dificultad, estado, is_public, allow_download,
                    enable_comments, 
                    DATE_FORMAT(fecha_creacion, '%%Y-%%m-%%d %%H:%%i') as fecha_creacion,
                    publish_date, expire_date, notify, prerequisito, 
                    quiz_preguntas, quiz_tiempo, quiz_score_min, quiz_intentos
                FROM contenidos
                WHERE diplomado_id = %s AND usuario_id = %s
                ORDER BY orden ASC, fecha_creacion DESC
            """, (diplomado_id, current_user.id))
            
            contenidos = cur.fetchall()
            cur.close()
            
            contenidos = [normalize_row(row) for row in contenidos]
            return jsonify(contenidos), 200
            
        except Exception as e:
            print(f"❌ Error al listar contenidos: {e}")
            return jsonify({"error": str(e)}), 500

    # =================== API: OBTENER TODOS LOS CONTENIDOS DEL INSTRUCTOR ===================
    @contenido_bp.route("/api/listar-todos", methods=["GET"])
    @login_required
    def listar_todos_contenidos():
        try:
            cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            
            # CORREGIDO: Convertir BLOB a texto
            cur.execute("""
                SELECT 
                    c.id, c.titulo, c.descripcion, c.tipo, 
                    CONVERT(c.archivo_url USING utf8) as archivo_url,
                    c.leccion, c.orden, c.dificultad, c.estado,
                    d.titulo as diplomado_titulo,
                    DATE_FORMAT(c.fecha_creacion, '%%Y-%%m-%%d %%H:%%i') as fecha_creacion
                FROM contenidos c
                INNER JOIN diplomados d ON c.diplomado_id = d.id
                WHERE c.usuario_id = %s
                ORDER BY c.fecha_creacion DESC
            """, (current_user.id,))
            
            contenidos = cur.fetchall()
            cur.close()
            
            contenidos = [normalize_row(row) for row in contenidos]
            return jsonify(contenidos), 200
            
        except Exception as e:
            print(f"❌ Error al listar todos los contenidos: {e}")
            return jsonify({"error": str(e)}), 500

    # =================== API: CREAR CONTENIDO CON ARCHIVO ===================
    @contenido_bp.route("/api/crear", methods=["POST"])
    @login_required
    def crear_contenido():
        try:
            # Obtener datos del formulario
            tipo = request.form.get("tipo")
            titulo = request.form.get("titulo")
            descripcion = request.form.get("descripcion", "")
            diplomado_id = request.form.get("diplomado_id")
            leccion = request.form.get("leccion", "")
            orden = int(request.form.get("orden", 0))
            dificultad = request.form.get("dificultad", "beginner")
            estado = request.form.get("estado", "draft")
            
            # Configuración adicional
            is_public = request.form.get("is_public", "true") == "true"
            allow_download = request.form.get("allow_download", "false") == "true"
            enable_comments = request.form.get("enable_comments", "true") == "true"
            publish_date = request.form.get("publish_date") or None
            expire_date = request.form.get("expire_date") or None
            notify = request.form.get("notify", "never")
            prerequisito = request.form.get("prerequisito") or None
            
            # Datos específicos para quiz
            quiz_preguntas = request.form.get("quiz_preguntas") or None
            quiz_tiempo = request.form.get("quiz_tiempo") or None
            quiz_score_min = request.form.get("quiz_score_min") or None
            quiz_intentos = request.form.get("quiz_intentos", "1")

            # Validaciones básicas
            if not all([tipo, titulo, diplomado_id]):
                return jsonify({"error": "Faltan campos obligatorios"}), 400

            # Verificar que el diplomado pertenece al usuario
            cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            cur.execute("""
                SELECT id FROM diplomados 
                WHERE id = %s AND usuario_id = %s
            """, (diplomado_id, current_user.id))
            
            if not cur.fetchone():
                cur.close()
                return jsonify({"error": "Diplomado no encontrado"}), 404

            archivo_url = None

            # Manejo de archivo (excepto para quiz)
            if tipo != 'quiz':
                if 'archivo' not in request.files:
                    cur.close()
                    return jsonify({"error": "No se proporcionó archivo"}), 400
                
                file = request.files['archivo']
                
                if file.filename == '':
                    cur.close()
                    return jsonify({"error": "Archivo sin nombre"}), 400
                
                if not allowed_file(file.filename, tipo):
                    cur.close()
                    return jsonify({
                        "error": f"Tipo de archivo no permitido para {tipo}"
                    }), 400
                
                # Verificar tamaño
                file_size = get_file_size(file)
                if file_size > MAX_FILE_SIZES[tipo]:
                    cur.close()
                    max_mb = MAX_FILE_SIZES[tipo] / (1024 * 1024)
                    return jsonify({
                        "error": f"Archivo demasiado grande. Máximo: {max_mb}MB"
                    }), 400
                
                # Guardar archivo
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                unique_filename = f"{current_user.id}_{timestamp}_{filename}"
                
                # Crear directorio si no existe
                upload_folder = os.path.join(
                    current_app.root_path, 
                    'static', 
                    'uploads', 
                    tipo + 's'
                )
                os.makedirs(upload_folder, exist_ok=True)
                
                # Guardar archivo
                file_path = os.path.join(upload_folder, unique_filename)
                file.save(file_path)
                
                # URL relativa para la BD
                archivo_url = f"/static/uploads/{tipo}s/{unique_filename}"

            # Insertar en base de datos
            cur.execute("""
                INSERT INTO contenidos (
                    titulo, descripcion, tipo, archivo_url, diplomado_id,
                    leccion, orden, dificultad, estado, is_public,
                    allow_download, enable_comments, publish_date, expire_date,
                    notify, prerequisito, quiz_preguntas, quiz_tiempo,
                    quiz_score_min, quiz_intentos, usuario_id, fecha_creacion
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            """, (
                titulo, descripcion, tipo, archivo_url, diplomado_id,
                leccion, orden, dificultad, estado, is_public,
                allow_download, enable_comments, publish_date, expire_date,
                notify, prerequisito, quiz_preguntas, quiz_tiempo,
                quiz_score_min, quiz_intentos, current_user.id
            ))
            
            mysql.connection.commit()
            nuevo_id = cur.lastrowid
            cur.close()
            
            return jsonify({
                "message": "Contenido creado exitosamente",
                "id": nuevo_id,
                "archivo_url": archivo_url
            }), 201
            
        except Exception as e:
            print(f"❌ Error al crear contenido: {e}")
            if 'cur' in locals():
                cur.close()
            return jsonify({"error": str(e)}), 500

    # =================== API: ELIMINAR CONTENIDO ===================
    @contenido_bp.route("/api/eliminar/<int:contenido_id>", methods=["DELETE"])
    @login_required
    def eliminar_contenido(contenido_id):
        try:
            cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            
            # Obtener info del archivo antes de eliminar - CORREGIDO
            cur.execute("""
                SELECT CONVERT(archivo_url USING utf8) as archivo_url 
                FROM contenidos
                WHERE id = %s AND usuario_id = %s
            """, (contenido_id, current_user.id))
            
            contenido = cur.fetchone()
            if not contenido:
                cur.close()
                return jsonify({"error": "Contenido no encontrado"}), 404
            
            # Eliminar archivo físico si existe
            archivo_url = contenido.get("archivo_url")
            
            if archivo_url:
                # Construir ruta completa del archivo
                file_path = os.path.join(
                    current_app.root_path,
                    archivo_url.lstrip("/")
                )
                
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        print(f"✅ Archivo eliminado: {file_path}")
                    except Exception as e:
                        print(f"⚠️ No se pudo eliminar archivo: {e}")
            
            # Eliminar registro de BD
            cur.execute("""
                DELETE FROM contenidos
                WHERE id = %s AND usuario_id = %s
            """, (contenido_id, current_user.id))
            
            mysql.connection.commit()
            cur.close()
            
            return jsonify({"message": "Contenido eliminado exitosamente"}), 200
            
        except Exception as e:
            print(f"❌ Error al eliminar contenido: {e}")
            return jsonify({"error": str(e)}), 500

    # =================== API: OBTENER DIPLOMADOS DEL INSTRUCTOR ===================
    @contenido_bp.route("/api/diplomados", methods=["GET"])
    @login_required
    def obtener_diplomados():
        try:
            cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            cur.execute("""
                SELECT id, titulo, categoria, nivel, estado
                FROM diplomados
                WHERE usuario_id = %s AND estado != 'archived'
                ORDER BY titulo ASC
            """, (current_user.id,))
            
            diplomados = cur.fetchall()
            cur.close()
            
            return jsonify(diplomados), 200
            
        except Exception as e:
            print(f"❌ Error al obtener diplomados: {e}")
            return jsonify({"error": str(e)}), 500

    return contenido_bp