from flask import Blueprint, request, jsonify, render_template, redirect, url_for, session
from flask_login import login_required, current_user
from extensions import mysql
import MySQLdb.cursors
from decimal import Decimal
import json
from datetime import datetime
import os
import braintree 

# CONFIGURACIÓN DE BRAINTREE (SANDBOX)
BRAINTREE_MERCHANT_ID = "yqtj75q8nw9j2zzt"
BRAINTREE_PUBLIC_KEY = "2x4x5ydfqrdjyzbh" 
BRAINTREE_PRIVATE_KEY = "4ec78a2285c9f94e329a185e43834d51" 
BRAINTREE_ENVIRONMENT = braintree.Environment.Sandbox 

braintree.Configuration.configure(
    BRAINTREE_ENVIRONMENT,
    BRAINTREE_MERCHANT_ID,
    BRAINTREE_PUBLIC_KEY,
    BRAINTREE_PRIVATE_KEY
)

pagos_bp = Blueprint(
    "pagos",
    __name__,
    url_prefix="/pagos"
)

# =================== VERIFICAR ACCESO A DIPLOMADO ===================
@pagos_bp.route("/api/verificar-acceso/<int:diplomado_id>", methods=["GET"])
@login_required
def verificar_acceso(diplomado_id):
    """
    Verifica si el usuario puede acceder al diplomado
    Retorna: free, enrolled, requires_payment
    """
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT d.id, d.titulo, d.precio, d.estado,
                   m.id as matricula_id, m.estado as estado_matricula
            FROM diplomados d
            LEFT JOIN matriculas m ON d.id = m.diplomado_id AND m.usuario_id = %s
            WHERE d.id = %s
        """, (current_user.id, diplomado_id))
        
        diplomado = cur.fetchone()
        cur.close()
        
        if not diplomado:
            return jsonify({"error": "Diplomado no encontrado"}), 404
        
        if diplomado['matricula_id']:
            return jsonify({
                "access": "enrolled",
                "message": "Ya estás matriculado",
                "matricula_id": diplomado['matricula_id'],
                "puede_acceder": True
            }), 200
        
        precio_float = float(diplomado['precio']) if diplomado['precio'] is not None else 0
        
        if precio_float == 0:
            return jsonify({
                "access": "free",
                "message": "Diplomado gratuito",
                "precio": 0,
                "puede_acceder": True
            }), 200
        
        return jsonify({
            "access": "requires_payment",
            "message": "Requiere pago",
            "precio": precio_float,
            "titulo": diplomado['titulo'],
            "puede_acceder": False
        }), 200
        
    except Exception as e:
        print(f"Error en verificar_acceso: {e}")
        return jsonify({"error": str(e)}), 500


# =================== MATRICULAR GRATIS ===================
@pagos_bp.route("/api/matricular-gratis/<int:diplomado_id>", methods=["POST"])
@login_required
def matricular_gratis(diplomado_id):
    """Matricula al usuario en un diplomado gratuito"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("SELECT precio FROM diplomados WHERE id = %s", (diplomado_id,))
        diplomado = cur.fetchone()
        
        if not diplomado:
            cur.close()
            return jsonify({"error": "Diplomado no encontrado"}), 404
        
        precio_float = float(diplomado['precio']) if diplomado['precio'] is not None else 0
        
        if precio_float > 0:
            cur.close()
            return jsonify({"error": "Este diplomado requiere pago"}), 400
        
        cur.execute("""
            SELECT id FROM matriculas 
            WHERE usuario_id = %s AND diplomado_id = %s
        """, (current_user.id, diplomado_id))
        
        if cur.fetchone():
            cur.close()
            return jsonify({"error": "Ya estás matriculado"}), 400
        
        cur.execute("""
            INSERT INTO matriculas 
            (usuario_id, diplomado_id, estado, fecha_inicio, monto_pagado, metodo_pago)
            VALUES (%s, %s, 'inscrito', NOW(), 0, 'gratuito')
        """, (current_user.id, diplomado_id))
        
        mysql.connection.commit()
        matricula_id = cur.lastrowid
        cur.close()
        
        return jsonify({
            "success": True,
            "message": "Matriculado exitosamente",
            "matricula_id": matricula_id,
            "redirect_url": f"/estudiante/modulos/{diplomado_id}"
        }), 201
        
    except Exception as e:
        print(f"Error al matricular gratis: {e}")
        return jsonify({"error": str(e)}), 500


# =================== GENERAR CLIENT TOKEN ===================
@pagos_bp.route("/api/generar-client-token", methods=["GET"])
@login_required
def generar_client_token():
    """Genera un token de autorización temporal para el frontend (Braintree)."""
    try:
        client_token = braintree.ClientToken.generate()
        return jsonify({"client_token": client_token}), 200
    except Exception as e:
        print(f"Error al generar client token: {e}")
        return jsonify({"error": "Fallo en la conexión de Braintree"}), 500


# =================== PROCESAR PAGO BRAINTREE ===================
@pagos_bp.route("/api/procesar-pago-bt", methods=["POST"])
@login_required
def procesar_pago_braintree():
    """
    Procesa el pago usando el nonce (token) generado por Braintree en el frontend.
    Sirve para Tarjeta, PayPal o Google Pay.
    """
    try:
        data = request.json
        diplomado_id = data.get('diplomado_id')
        payment_nonce = data.get('payment_nonce')
        
        if not diplomado_id or not payment_nonce:
            return jsonify({"error": "Datos incompletos (diplomado_id o nonce)"}), 400
        
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cur.execute("SELECT id, titulo, precio FROM diplomados WHERE id = %s AND precio > 0", (diplomado_id,))
        diplomado = cur.fetchone()
        
        if not diplomado:
            cur.close()
            return jsonify({"error": "Diplomado no encontrado o es gratuito"}), 404
            
        monto = float(diplomado['precio'])
        
        # Verificar si ya está matriculado
        cur.execute("""
            SELECT id FROM matriculas 
            WHERE usuario_id = %s AND diplomado_id = %s
        """, (current_user.id, diplomado_id))
        
        if cur.fetchone():
            cur.close()
            return jsonify({"error": "Ya estás matriculado"}), 400
            
        # Realizar la transacción con Braintree
        result = braintree.Transaction.sale({
            "amount": f"{monto:.2f}",
            "payment_method_nonce": payment_nonce,
            "order_id": f"DIP-{diplomado_id}-USR-{current_user.id}-{int(datetime.now().timestamp())}",
            "options": {
                "submit_for_settlement": True
            }
        })
        
        # Verificar el resultado
        if not result.is_success:
            error_msg = "Pago rechazado."
            if result.message:
                error_msg = result.message
            elif hasattr(result, 'transaction') and result.transaction:
                error_msg = result.transaction.processor_response_text or error_msg
            
            return jsonify({
                "success": False, 
                "error": error_msg
            }), 400
            
        # Crear matrícula
        transaction = result.transaction
        metodo_pago = transaction.payment_instrument_type 
        
        cur.execute("""
            INSERT INTO matriculas 
            (usuario_id, diplomado_id, estado, fecha_inicio, monto_pagado, metodo_pago, notas, transaccion_id)
            VALUES (%s, %s, 'inscrito', NOW(), %s, %s, %s, %s)
        """, (
            current_user.id,
            diplomado_id,
            monto,
            metodo_pago,
            f"Braintree: {transaction.id} ({metodo_pago})",
            transaction.id
        ))
        
        mysql.connection.commit()
        matricula_id = cur.lastrowid
        cur.close()
        
        return jsonify({
            "success": True,
            "message": "Pago procesado exitosamente",
            "matricula_id": matricula_id,
            "redirect_url": f"/estudiante/modulos/{diplomado_id}"
        }), 200
        
    except Exception as e:
        print(f"Error al procesar Braintree: {e}")
        return jsonify({"error": str(e)}), 500


# =================== HISTORIAL DE PAGOS ===================
@pagos_bp.route("/api/historial", methods=["GET"])
@login_required
def historial_pagos():
    """Obtiene el historial de pagos del usuario"""
    try:
        cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        cur.execute("""
            SELECT 
                m.id,
                m.fecha_inscripcion,
                m.monto_pagado,
                m.metodo_pago,
                d.titulo as diplomado_titulo,
                d.categoria,
                m.estado
            FROM matriculas m
            JOIN diplomados d ON m.diplomado_id = d.id
            WHERE m.usuario_id = %s AND m.monto_pagado > 0
            ORDER BY m.fecha_inscripcion DESC
        """, (current_user.id,))
        
        pagos = cur.fetchall()
        cur.close()
        
        resultado = []
        for pago in pagos:
            resultado.append({
                "id": pago['id'],
                "fecha": pago['fecha_inscripcion'].strftime('%Y-%m-%d %H:%M'),
                "monto": float(pago['monto_pagado']),
                "metodo": pago['metodo_pago'],
                "diplomado": pago['diplomado_titulo'],
                "categoria": pago['categoria'],
                "estado": pago['estado']
            })
        
        return jsonify(resultado), 200
        
    except Exception as e:
        print(f"Error al obtener historial: {e}")
        return jsonify({"error": str(e)}), 500