from flask import Blueprint, request, jsonify, send_file, render_template
from flask_login import login_required, current_user
from extensions import mysql
import MySQLdb.cursors
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO

pagosH_bp = Blueprint('pagosH', __name__, url_prefix='/estudiante')

# =================== PÁGINA DE PAGOS ===================
@pagosH_bp.route('/pagos')
@login_required
def pagos():
    """Página de pagos y facturación"""
    return render_template('estudiante/pagos.html', user=current_user)


# =================== HISTORIAL DE PAGOS ===================
@pagosH_bp.route('/api/pagos/historial', methods=['GET'])
@login_required
def obtener_historial_pagos():
    """Obtiene el historial de pagos del usuario"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT 
                m.id,
                m.fecha_inscripcion,
                d.titulo as diplomado,
                d.categoria,
                m.monto_pagado,
                m.metodo_pago,
                m.estado,
                m.transaccion_id,
                m.notas
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE m.usuario_id = %s
            ORDER BY m.fecha_inscripcion DESC
        """, (current_user.id,))
        
        pagos = cur.fetchall()
        cur.close()
        
        resultado = []
        for pago in pagos:
            # Determinar estado del pago
            status = 'completed' if pago['estado'] in ['inscrito', 'en_curso', 'completado'] else 'pending'
            
            # Formatear método de pago
            metodo_texto = {
                'gratuito': 'Curso Gratuito',
                'credit_card': 'Tarjeta de Crédito',
                'paypal': 'PayPal',
                'bank_transfer': 'Transferencia Bancaria'
            }.get(pago['metodo_pago'], 'Método de Pago')
            
            resultado.append({
                "id": pago['id'],
                "date": pago['fecha_inscripcion'].strftime('%Y-%m-%d'),
                "description": f"Diplomado: {pago['diplomado']}",
                "amount": float(pago['monto_pagado']),
                "status": status,
                "method": metodo_texto,
                "invoice": f"INV-{pago['id']:05d}",
                "course": pago['diplomado'],
                "categoria": pago['categoria'],
                "transaccion_id": pago['transaccion_id']
            })
        
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"Error al obtener historial: {e}")
        return jsonify({"error": str(e)}), 500


# =================== OBTENER FACTURA ESPECÍFICA ===================
@pagosH_bp.route('/api/factura/<int:matricula_id>', methods=['GET'])
@login_required
def obtener_factura(matricula_id):
    """Obtiene los detalles de una factura específica"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT 
                m.id,
                m.fecha_inscripcion,
                m.monto_pagado,
                m.metodo_pago,
                m.transaccion_id,
                d.titulo as diplomado,
                d.categoria,
                d.duracion_horas,
                u.nombre,
                u.correo,
                u.direccion,
                u.telefono
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.id = %s AND m.usuario_id = %s
        """, (matricula_id, current_user.id))
        
        factura = cur.fetchone()
        cur.close()
        
        if not factura:
            return jsonify({"error": "Factura no encontrada"}), 404
        
        return jsonify({
            "id": factura['id'],
            "numero_factura": f"INV-{factura['id']:05d}",
            "fecha": factura['fecha_inscripcion'].strftime('%Y-%m-%d'),
            "cliente": {
                "nombre": factura['nombre'],
                "correo": factura['correo'],
                "direccion": factura['direccion'] or 'No registrada',
                "telefono": factura['telefono'] or 'No registrado'
            },
            "diplomado": {
                "titulo": factura['diplomado'],
                "categoria": factura['categoria'],
                "duracion": factura['duracion_horas']
            },
            "monto": float(factura['monto_pagado']),
            "metodo_pago": factura['metodo_pago'],
            "transaccion_id": factura['transaccion_id']
        }), 200
        
    except Exception as e:
        print(f"Error al obtener factura: {e}")
        return jsonify({"error": str(e)}), 500


# =================== DESCARGAR FACTURA PDF ===================
@pagosH_bp.route('/api/factura/<int:matricula_id>/descargar', methods=['GET'])
@login_required
def descargar_factura(matricula_id):
    """Genera y descarga el PDF de la factura"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT 
                m.id,
                m.fecha_inscripcion,
                m.monto_pagado,
                m.metodo_pago,
                m.transaccion_id,
                d.titulo as diplomado,
                d.categoria,
                d.duracion_horas,
                u.nombre,
                u.correo,
                u.direccion,
                u.telefono
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.id = %s AND m.usuario_id = %s
        """, (matricula_id, current_user.id))
        
        factura = cur.fetchone()
        cur.close()
        
        if not factura:
            return jsonify({"error": "Factura no encontrada"}), 404
        
        # Crear PDF
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Header - Fondo azul
        p.setFillColor(colors.HexColor('#6366f1'))
        p.rect(0, height - 120, width, 120, fill=True, stroke=False)
        
        # Logo y nombre empresa
        p.setFillColor(colors.white)
        p.setFont("Helvetica-Bold", 24)
        p.drawString(50, height - 70, "TECH-SCRIPT")
        
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 90, "Plataforma de Educación Online")
        p.drawString(50, height - 105, "www.tech-script.com")
        
        # Número de factura
        p.setFont("Helvetica-Bold", 16)
        numero_factura = f"FACTURA #{factura['id']:05d}"
        p.drawRightString(width - 50, height - 70, numero_factura)
        
        # Fecha
        p.setFont("Helvetica", 10)
        fecha_factura = factura['fecha_inscripcion'].strftime('%d/%m/%Y')
        p.drawRightString(width - 50, height - 90, f"Fecha: {fecha_factura}")
        
        # Información del cliente
        y = height - 160
        p.setFillColor(colors.black)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "CLIENTE:")
        
        p.setFont("Helvetica", 10)
        y -= 20
        p.drawString(50, y, f"Nombre: {factura['nombre']}")
        y -= 15
        p.drawString(50, y, f"Correo: {factura['correo']}")
        y -= 15
        p.drawString(50, y, f"Teléfono: {factura['telefono'] or 'No registrado'}")
        
        # Línea separadora
        y -= 30
        p.setStrokeColor(colors.HexColor('#e2e8f0'))
        p.setLineWidth(1)
        p.line(50, y, width - 50, y)
        
        # Detalles del diplomado
        y -= 30
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, "DETALLES DEL SERVICIO:")
        
        # Tabla de conceptos
        y -= 40
        
        # Headers de tabla
        p.setFillColor(colors.HexColor('#f1f5f9'))
        p.rect(50, y - 20, width - 100, 25, fill=True, stroke=False)
        
        p.setFillColor(colors.black)
        p.setFont("Helvetica-Bold", 10)
        p.drawString(60, y - 10, "CONCEPTO")
        p.drawRightString(width - 150, y - 10, "DURACIÓN")
        p.drawRightString(width - 60, y - 10, "MONTO")
        
        # Datos de la tabla
        y -= 45
        p.setFont("Helvetica", 10)
        p.drawString(60, y, f"Diplomado: {factura['diplomado']}")
        p.drawRightString(width - 150, y, f"{factura['duracion_horas']} horas")
        p.drawRightString(width - 60, y, f"${factura['monto_pagado']:.2f}")
        
        y -= 15
        p.drawString(60, y, f"Categoría: {factura['categoria']}")
        
        # Línea separadora
        y -= 30
        p.setStrokeColor(colors.HexColor('#e2e8f0'))
        p.line(50, y, width - 50, y)
        
        # Total
        y -= 40
        p.setFont("Helvetica-Bold", 14)
        p.drawString(width - 250, y, "TOTAL:")
        p.setFillColor(colors.HexColor('#6366f1'))
        p.drawRightString(width - 60, y, f"${factura['monto_pagado']:.2f}")
        
        # Información de pago
        y -= 50
        p.setFillColor(colors.black)
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "INFORMACIÓN DE PAGO:")
        
        y -= 20
        p.setFont("Helvetica", 9)
        
        metodo_texto = {
            'gratuito': 'Curso Gratuito',
            'credit_card': 'Tarjeta de Crédito',
            'paypal': 'PayPal',
            'bank_transfer': 'Transferencia Bancaria'
        }.get(factura['metodo_pago'], 'Método de Pago')
        
        p.drawString(50, y, f"Método de pago: {metodo_texto}")
        
        if factura['transaccion_id']:
            y -= 15
            p.drawString(50, y, f"ID de Transacción: {factura['transaccion_id']}")
        
        # Footer
        p.setFont("Helvetica", 8)
        p.setFillColor(colors.HexColor('#64748b'))
        p.drawCentredString(width / 2, 50, "Gracias por confiar en Tech-Script")
        p.drawCentredString(width / 2, 35, "Este documento es una factura electrónica válida")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"Factura_{factura['id']:05d}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error al descargar factura: {e}")
        return jsonify({"error": str(e)}), 500


# =================== ESTADÍSTICAS DE PAGOS ===================
@pagosH_bp.route('/api/pagos/estadisticas', methods=['GET'])
@login_required
def obtener_estadisticas():
    """Obtiene estadísticas de pagos del usuario"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        # Total gastado
        cur.execute("""
            SELECT COALESCE(SUM(monto_pagado), 0) as total_gastado
            FROM matriculas
            WHERE usuario_id = %s
        """, (current_user.id,))
        
        total = cur.fetchone()
        
        # Diplomados activos
        cur.execute("""
            SELECT COUNT(*) as activos
            FROM matriculas
            WHERE usuario_id = %s AND estado IN ('inscrito', 'en_curso')
        """, (current_user.id,))
        
        activos = cur.fetchone()
        
        # Diplomados completados
        cur.execute("""
            SELECT COUNT(*) as completados
            FROM matriculas
            WHERE usuario_id = %s AND estado = 'completado'
        """, (current_user.id,))
        
        completados = cur.fetchone()
        
        cur.close()
        
        return jsonify({
            "total_gastado": float(total['total_gastado']),
            "diplomados_activos": activos['activos'],
            "diplomados_completados": completados['completados']
        }), 200
        
    except Exception as e:
        print(f"Error al obtener estadísticas: {e}")
        return jsonify({"error": str(e)}), 500