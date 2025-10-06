from flask import Blueprint, request, jsonify, send_file, render_template
from flask_login import login_required, current_user
from extensions import mysql
import MySQLdb.cursors
from datetime import datetime
import hashlib
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from io import BytesIO

contenidos_bp = Blueprint('contenidos', __name__, url_prefix='/estudiante')



@contenidos_bp.route('/api/diplomado/<int:diplomado_id>/primer-contenido', methods=['GET'])
@login_required
def obtener_primer_contenido(diplomado_id):
    """Obtiene el primer contenido del diplomado"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Verificar que el usuario esté matriculado
        cur.execute("""
            SELECT id FROM matriculas 
            WHERE usuario_id = %s AND diplomado_id = %s
        """, (current_user.id, diplomado_id))
        
        if not cur.fetchone():
            cur.close()
            return jsonify({"error": "No estás matriculado en este diplomado"}), 403
        
        # Obtener el primer contenido
        cur.execute("""
            SELECT id FROM contenidos 
            WHERE diplomado_id = %s 
            ORDER BY orden, id 
            LIMIT 1
        """, (diplomado_id,))
        
        contenido = cur.fetchone()
        cur.close()
        
        if not contenido:
            return jsonify({"error": "Este diplomado no tiene contenidos"}), 404
        
        return jsonify({"contenido_id": contenido['id']}), 200
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@contenidos_bp.route('/api/clase/<int:contenido_id>', methods=['GET'])
@login_required
def obtener_contenido(contenido_id):
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Obtener el contenido con su diplomado
        cur.execute("""
            SELECT c.*, d.titulo as diplomado_titulo, d.id as diplomado_id,
                   mat.id as matricula_id,
                   u.nombre as profesor_nombre
            FROM contenidos c
            JOIN diplomados d ON c.diplomado_id = d.id
            JOIN usuarios u ON d.usuario_id = u.id
            JOIN matriculas mat ON mat.diplomado_id = d.id AND mat.usuario_id = %s
            WHERE c.id = %s
        """, (current_user.id, contenido_id))
        
        contenido = cur.fetchone()
        
        if not contenido:
            cur.close()
            return jsonify({"error": "Contenido no encontrado o no tienes acceso"}), 404
        
        # Convertir BLOB a ruta
        archivo_url = None
        if contenido['archivo_url']:
            try:
                archivo_url = contenido['archivo_url'].decode('utf-8')
            except:
                archivo_url = str(contenido['archivo_url'])
        
        # Obtener todos los contenidos del diplomado para navegación
        cur.execute("""
            SELECT c.id, c.orden, c.titulo, c.tipo
            FROM contenidos c
            WHERE c.diplomado_id = %s
            ORDER BY c.orden, c.id
        """, (contenido['diplomado_id'],))
        
        todos_contenidos = cur.fetchall()
        cur.close()
        
        # Encontrar contenido anterior y siguiente
        contenido_anterior = None
        contenido_siguiente = None
        
        for i, item in enumerate(todos_contenidos):
            if item['id'] == contenido_id:
                if i > 0:
                    contenido_anterior = todos_contenidos[i-1]['id']
                if i < len(todos_contenidos) - 1:
                    contenido_siguiente = todos_contenidos[i+1]['id']
                break
        
        # Preparar materiales (si existen archivos relacionados)
        materiales = []
        if archivo_url:
            # Determinar tipo de archivo
            extension = archivo_url.split('.')[-1].lower() if '.' in archivo_url else ''
            tipo_map = {
                'pdf': 'pdf',
                'doc': 'document',
                'docx': 'document',
                'xls': 'excel',
                'xlsx': 'excel',
                'png': 'image',
                'jpg': 'image',
                'jpeg': 'image'
            }
            
            tipo_archivo = tipo_map.get(extension, 'document')
            
            materiales.append({
                'nombre': contenido['titulo'] + '.' + extension,
                'url': archivo_url,
                'tipo': tipo_archivo,
                'tamano': 'N/A'
            })
        
        return jsonify({
            "contenido": {
                "id": contenido['id'],
                "titulo": contenido['titulo'],
                "descripcion": contenido['descripcion'] or 'Sin descripción disponible',
                "tipo": contenido['tipo'],
                "url_video": archivo_url if contenido['tipo'] == 'video' else None,
                "duracion": '45 min',  # Por defecto
                "modulo_titulo": contenido['leccion'] or 'Contenido',
                "diplomado_titulo": contenido['diplomado_titulo'],
                "diplomado_id": contenido['diplomado_id'],
                "profesor": contenido['profesor_nombre'],
                "materiales": materiales
            },
            "progreso": {
                "estado": 'no_iniciado',
                "porcentaje_visto": 0,
                "tiempo_visto": 0
            },
            "navegacion": {
                "anterior": contenido_anterior,
                "siguiente": contenido_siguiente
            }
        }), 200
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@contenidos_bp.route('/api/clase/<int:contenido_id>/progreso', methods=['POST'])
@login_required
def actualizar_progreso(contenido_id):
    try:
        data = request.json
        porcentaje = data.get('porcentaje_visto', 0)
        tiempo_visto = data.get('tiempo_visto', 0)
        
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Obtener matrícula
        cur.execute("""
            SELECT mat.id as matricula_id, d.id as diplomado_id
            FROM contenidos c
            JOIN diplomados d ON c.diplomado_id = d.id
            JOIN matriculas mat ON mat.diplomado_id = d.id AND mat.usuario_id = %s
            WHERE c.id = %s
        """, (current_user.id, contenido_id))
        
        matricula = cur.fetchone()
        
        if not matricula:
            cur.close()
            return jsonify({"error": "No tienes acceso"}), 403
        
        matricula_id = matricula['matricula_id']
        
        # Verificar si existe progreso
        cur.execute("""
            SELECT id FROM progreso_contenidos 
            WHERE usuario_id = %s AND contenido_id = %s AND diplomado_id = %s
        """, (current_user.id, contenido_id, matricula['diplomado_id']))
        
        progreso_existe = cur.fetchone()
        
        completado = 1 if porcentaje >= 90 else 0
        fecha_completado = datetime.now() if completado else None
        
        if progreso_existe:
            # Actualizar
            cur.execute("""
                UPDATE progreso_contenidos 
                SET completado = %s,
                    fecha_completado = %s,
                    tiempo_dedicado_minutos = %s,
                    ultima_posicion = %s
                WHERE usuario_id = %s AND contenido_id = %s
            """, (completado, fecha_completado, int(tiempo_visto / 60), str(tiempo_visto), 
                  current_user.id, contenido_id))
        else:
            # Insertar
            cur.execute("""
                INSERT INTO progreso_contenidos 
                (usuario_id, contenido_id, diplomado_id, completado, fecha_inicio, 
                 fecha_completado, tiempo_dedicado_minutos, ultima_posicion)
                VALUES (%s, %s, %s, %s, NOW(), %s, %s, %s)
            """, (current_user.id, contenido_id, matricula['diplomado_id'], completado, 
                  fecha_completado, int(tiempo_visto / 60), str(tiempo_visto)))
        
        mysql.connection.commit()
        
        # Obtener progreso actualizado de la matrícula
        cur.execute("""
            SELECT progreso_porcentaje, estado, certificado_emitido 
            FROM matriculas WHERE id = %s
        """, (matricula_id,))
        
        matricula_actualizada = cur.fetchone()
        cur.close()
        
        certificado_generado = False
        if matricula_actualizada and matricula_actualizada['estado'] == 'completado':
            if not matricula_actualizada['certificado_emitido']:
                certificado_generado = generar_certificado_interno(matricula_id)
        
        return jsonify({
            "success": True,
            "progreso_general": float(matricula_actualizada['progreso_porcentaje']) if matricula_actualizada else 0,
            "estado_matricula": matricula_actualizada['estado'] if matricula_actualizada else 'inscrito',
            "certificado_disponible": certificado_generado
        }), 200
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def generar_certificado_interno(matricula_id):
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("SELECT id FROM certificados WHERE matricula_id = %s", (matricula_id,))
        if cur.fetchone():
            cur.close()
            return True
        
        cur.execute("""
            SELECT u.nombre, d.titulo as diplomado_titulo,
                   m.progreso_porcentaje, m.usuario_id, m.diplomado_id
            FROM matriculas m
            JOIN usuarios u ON m.usuario_id = u.id
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE m.id = %s
        """, (matricula_id,))
        
        datos = cur.fetchone()
        if not datos:
            cur.close()
            return False
        
        codigo = hashlib.md5(f"{matricula_id}-{datetime.now()}".encode()).hexdigest()[:12].upper()
        
        cur.execute("""
            INSERT INTO certificados 
            (matricula_id, usuario_id, diplomado_id, codigo_certificado, calificacion_final)
            VALUES (%s, %s, %s, %s, %s)
        """, (matricula_id, datos['usuario_id'], datos['diplomado_id'], codigo, datos['progreso_porcentaje']))
        
        cur.execute("""
            UPDATE matriculas 
            SET certificado_emitido = 1, fecha_finalizacion = NOW()
            WHERE id = %s
        """, (matricula_id,))
        
        mysql.connection.commit()
        cur.close()
        
        print(f"Certificado generado: {codigo}")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False


@contenidos_bp.route('/api/certificados', methods=['GET'])
@login_required
def obtener_certificados():
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT c.*, d.titulo as diplomado_titulo, d.categoria
            FROM certificados c
            JOIN diplomados d ON c.diplomado_id = d.id
            WHERE c.usuario_id = %s
            ORDER BY c.fecha_emision DESC
        """, (current_user.id,))
        
        certificados = cur.fetchall()
        cur.close()
        
        resultado = []
        for cert in certificados:
            resultado.append({
                "id": cert['id'],
                "codigo": cert['codigo_certificado'],
                "diplomado": cert['diplomado_titulo'],
                "categoria": cert['categoria'],
                "fecha_emision": cert['fecha_emision'].strftime('%d/%m/%Y'),
                "calificacion": float(cert['calificacion_final'] or 0),
                "url_descarga": f"/estudiante/api/certificado/{cert['id']}/descargar"
            })
        
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


@contenidos_bp.route('/api/certificado/<int:certificado_id>/descargar', methods=['GET'])
@login_required
def descargar_certificado(certificado_id):
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT c.*, u.nombre, d.titulo as diplomado_titulo
            FROM certificados c
            JOIN usuarios u ON c.usuario_id = u.id
            JOIN diplomados d ON c.diplomado_id = d.id
            WHERE c.id = %s AND c.usuario_id = %s
        """, (certificado_id, current_user.id))
        
        cert = cur.fetchone()
        cur.close()
        
        if not cert:
            return jsonify({"error": "Certificado no encontrado"}), 404
        
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)
        
        p.setFillColor(colors.HexColor('#f8f9fa'))
        p.rect(0, 0, width, height, fill=True, stroke=False)
        
        p.setStrokeColor(colors.HexColor('#6366f1'))
        p.setLineWidth(3)
        p.rect(30, 30, width-60, height-60, fill=False, stroke=True)
        
        p.setFillColor(colors.HexColor('#1e293b'))
        p.setFont("Helvetica-Bold", 40)
        p.drawCentredString(width/2, height-100, "CERTIFICADO DE FINALIZACION")
        
        p.setStrokeColor(colors.HexColor('#8b5cf6'))
        p.setLineWidth(2)
        p.line(150, height-130, width-150, height-130)
        
        p.setFont("Helvetica", 18)
        p.setFillColor(colors.HexColor('#475569'))
        p.drawCentredString(width/2, height-180, "Se otorga el presente certificado a:")
        
        p.setFont("Helvetica-Bold", 32)
        p.setFillColor(colors.HexColor('#6366f1'))
        nombre_completo = cert['nombre']
        p.drawCentredString(width/2, height-230, nombre_completo)
        
        p.setFont("Helvetica", 16)
        p.setFillColor(colors.HexColor('#475569'))
        p.drawCentredString(width/2, height-280, "Por haber completado exitosamente el diplomado:")
        
        p.setFont("Helvetica-Bold", 22)
        p.setFillColor(colors.HexColor('#1e293b'))
        p.drawCentredString(width/2, height-320, cert['diplomado_titulo'])
        
        p.setFont("Helvetica", 14)
        p.setFillColor(colors.HexColor('#64748b'))
        fecha_emision = cert['fecha_emision'].strftime('%d de %B de %Y')
        p.drawCentredString(width/2, 120, f"Fecha de emision: {fecha_emision}")
        p.drawCentredString(width/2, 90, f"Codigo: {cert['codigo_certificado']}")
        
        p.setFont("Helvetica-Bold", 16)
        p.setFillColor(colors.HexColor('#6366f1'))
        p.drawCentredString(width/2, 60, "Tech-script")
        
        p.showPage()
        p.save()
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"Certificado_{cert['codigo_certificado']}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


@contenidos_bp.route('/clase/<int:contenido_id>')
@login_required
def ver_contenido(contenido_id):
    return render_template('estudiante/clases.html', user=current_user)