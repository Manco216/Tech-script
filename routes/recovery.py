from flask import Blueprint, render_template, request, jsonify, url_for
from flask_mail import Message
from werkzeug.security import generate_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import MySQLdb.cursors
from datetime import datetime

def create_recovery_blueprint(mysql, mail, app):
    recovery_bp = Blueprint(
        "recovery",
        __name__,
        url_prefix="/recovery"
    )
    
    # Serializador para tokens seguros
    serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    
    # =================== VISTA: PÁGINA DE RECUPERACIÓN ===================
    @recovery_bp.route("/", methods=["GET"])
    def recovery_page():
        return render_template("recuperarContrasena.html")
    
    # =================== VISTA: PÁGINA DE RESET ===================
   # Función reset_page en recovery.py (alrededor de la línea 40)
    @recovery_bp.route("/reset/<token>", methods=["GET"])
    def reset_page(token):
        try:
            # Verificar que el token sea válido (sin decodificar aún)
            email = serializer.loads(token, salt='password-reset-salt', max_age=3600)
            return render_template("resetPassword.html", token=token)
        except SignatureExpired:
            # CORRECCIÓN AQUÍ: Mensaje específico por vencimiento
            return render_template("tokenExpired.html", 
                                 mensaje="El token ha vencido. Solicita uno nuevo.") 
        except BadSignature:
            return render_template("tokenExpired.html", 
                                 mensaje="Enlace inválido. Solicita uno nuevo.")
    
    # =================== API: SOLICITAR RECUPERACIÓN ===================
    @recovery_bp.route("/api/request", methods=["POST"])
    def request_recovery():
        try:
            data = request.get_json()
            email = data.get('email', '').strip().lower()
            
            if not email:
                return jsonify({"error": "El email es requerido"}), 400
            
            # Verificar que el email existe en la BD
            cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            cur.execute("SELECT id, nombre FROM usuarios WHERE correo = %s", (email,))
            usuario = cur.fetchone()
            
            if not usuario:
                # Modificación: Enviar un error 404 explícito
                return jsonify({"error": "El correo no está registrado"}), 404 
            
            # Generar token único
            token = serializer.dumps(email, salt='password-reset-salt')
            
            # Guardar token en la BD
            cur.execute("""
                INSERT INTO recuperacion_contrasena (usuario_id, token, fecha_creacion, utilizado)
                VALUES (%s, %s, NOW(), 0)
            """, (usuario['id'], token))
            mysql.connection.commit()
            cur.close()
            
            # Crear enlace de recuperación
            reset_link = url_for('recovery.reset_page', token=token, _external=True)
            
            # Enviar email
            send_recovery_email(mail, email, usuario['nombre'], reset_link)
            
            return jsonify({
                "success": True,
                "message": "Email de recuperación enviado exitosamente"
            }), 200
            
        except Exception as e:
            print(f"❌ Error en solicitud de recuperación: {e}")
            return jsonify({"error": "Error al procesar la solicitud"}), 500
    
    # =================== API: RESETEAR CONTRASEÑA ===================
    @recovery_bp.route("/api/reset", methods=["POST"])
    def reset_password():
        try:
            data = request.get_json()
            token = data.get('token')
            new_password = data.get('password')
            
            if not token or not new_password:
                return jsonify({"error": "Datos incompletos"}), 400
            
            if len(new_password) < 6:
                return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400
            
            # Decodificar token
            try:
                email = serializer.loads(token, salt='password-reset-salt', max_age=3600)
            except SignatureExpired:
                return jsonify({"error": "El enlace ha expirado"}), 400
            except BadSignature:
                return jsonify({"error": "Token inválido"}), 400
            
            cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            
            # Verificar que el token no haya sido usado
            cur.execute("""
                SELECT id, utilizado FROM recuperacion_contrasena 
                WHERE token = %s
                ORDER BY fecha_creacion DESC LIMIT 1
            """, (token,))
            token_record = cur.fetchone()
            
            if not token_record:
                cur.close()
                return jsonify({"error": "Token no encontrado"}), 400
            
            if token_record['utilizado'] == 1:
                cur.close()
                return jsonify({"error": "Este enlace ya fue utilizado"}), 400
            
            # Obtener usuario
            cur.execute("SELECT id FROM usuarios WHERE correo = %s", (email,))
            usuario = cur.fetchone()
            
            if not usuario:
                cur.close()
                return jsonify({"error": "Usuario no encontrado"}), 404
            
            # Actualizar contraseña
            hashed_password = generate_password_hash(new_password)
            cur.execute("""
                UPDATE usuarios 
                SET contrasena = %s, fecha_actualizacion = NOW()
                WHERE id = %s
            """, (hashed_password, usuario['id']))
            
            # Marcar token como utilizado
            cur.execute("""
                UPDATE recuperacion_contrasena 
                SET utilizado = 1 
                WHERE id = %s
            """, (token_record['id'],))
            
            mysql.connection.commit()
            cur.close()
            
            return jsonify({
                "success": True,
                "message": "Contraseña actualizada exitosamente"
            }), 200
            
        except Exception as e:
            print(f"❌ Error al resetear contraseña: {e}")
            return jsonify({"error": "Error al resetear la contraseña"}), 500
    
    return recovery_bp


# =================== FUNCIÓN PARA ENVIAR EMAIL ===================
def send_recovery_email(mail, recipient_email, recipient_name, reset_link):
    """Envía el email de recuperación de contraseña"""
    try:
        msg = Message(
            subject='Recuperación de Contraseña - tech-script',
            sender=('tech-script', 'noreply@techscript.com'),
            recipients=[recipient_email]
        )
        
        # Cuerpo del email en HTML
        msg.html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .content p {{
                    color: #333;
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }}
                .button-container {{
                    text-align: center;
                    margin: 30px 0;
                }}
                .reset-button {{
                    display: inline-block;
                    padding: 15px 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 16px;
                    transition: transform 0.2s;
                }}
                .reset-button:hover {{
                    transform: translateY(-2px);
                }}
                .warning {{
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .warning p {{
                    margin: 0;
                    color: #856404;
                    font-size: 14px;
                }}
                .footer {{
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                }}
                .footer a {{
                    color: #667eea;
                    text-decoration: none;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Recuperación de Contraseña</h1>
                </div>
                <div class="content">
                    <p>Hola <strong>{recipient_name}</strong>,</p>
                    
                    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>tech-script</strong>.</p>
                    
                    <p>Si realizaste esta solicitud, haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    
                    <div class="button-container">
                        <a href="{reset_link}" class="reset-button">Restablecer Contraseña</a>
                    </div>
                    
                    <p style="color: #6c757d; font-size: 14px;">
                        O copia y pega este enlace en tu navegador:<br>
                        <a href="{reset_link}" style="color: #667eea; word-break: break-all;">{reset_link}</a>
                    </p>
                    
                    <div class="warning">
                        <p><strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por razones de seguridad.</p>
                    </div>
                    
                    <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá siendo válida.</p>
                    
                    <p>Saludos,<br>
                    <strong>El equipo de tech-script</strong></p>
                </div>
                <div class="footer">
                    <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                    <p>© 2025 tech-script. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Cuerpo alternativo en texto plano
        msg.body = f"""
        Hola {recipient_name},
        
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en tech-script.
        
        Para crear una nueva contraseña, visita el siguiente enlace:
        {reset_link}
        
        Este enlace expirará en 1 hora por razones de seguridad.
        
        Si no solicitaste restablecer tu contraseña, ignora este correo.
        
        Saludos,
        El equipo de tech-script
        """
        
        mail.send(msg)
        print(f"✅ Email de recuperación enviado a {recipient_email}")
        
    except Exception as e:
        print(f"❌ Error al enviar email: {e}")
        raise