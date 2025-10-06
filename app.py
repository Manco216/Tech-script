import os
from flask import Flask, redirect, url_for, session, flash, render_template, request
from flask_mysqldb import MySQL
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from authlib.integrations.flask_client import OAuth
from flask_session import Session
from extensions import mysql
from activity_logger import registrar_actividad
from flask import jsonify


import MySQLdb.cursors

# Importamos nuestros módulos
from models import Usuario
from gestionUsuarios import (
    obtener_usuario_por_id,
    obtener_usuario_por_correo,
    crear_usuario,
    contar_usuarios
)
from admin_routes import admin_bp  # blueprint de admin
from reportes_routes import reportes_bp  # blueprint de reportes
from metrics_routes import metrics_bp  # 👈 importa el nuevo blueprint

# ---------------- CONFIG ----------------
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "clave_super_secreta")

# Registrar blueprints
app.register_blueprint(admin_bp)
app.register_blueprint(reportes_bp)
app.register_blueprint(metrics_bp)


# Flask-Session
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
Session(app)

# MySQL
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'tech_script'
app.config['MYSQL_PORT'] = 3306
app.config["MYSQL_CURSORCLASS"] = "DictCursor"
mysql.init_app(app)

# Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# OAuth Google
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id='TU_CLIENT_ID',
    client_secret='TU_CLIENT_SECRET',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# ---------------- USUARIO LOGIN_MANAGER ----------------
@login_manager.user_loader
def load_user(user_id):
    return obtener_usuario_por_id(mysql, user_id)

# ---------------- RUTAS ----------------
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    return redirect(url_for('login'))

# -------- LOGIN NORMAL --------
@app.route('/login', methods=['GET', 'POST'])
def login():
    mensaje = None
    if request.method == 'POST':
        correo = request.form.get('txtCorreo')
        contrasena = request.form.get('txtContrasena')
        rol_seleccionado = request.form.get('tipo_usuario')

        if not correo or not contrasena or not rol_seleccionado:
            mensaje = "Completa todos los campos"
        else:
            usuario = obtener_usuario_por_correo(mysql, correo)
            rol_map = {'estudiante': 1, 'docente': 2, 'admin': 3}
            rol_num = rol_map.get(rol_seleccionado.lower())

            if usuario and check_password_hash(usuario.contrasena, contrasena) and usuario.fk_rol == rol_num:
                login_user(usuario)
                flash(f"Bienvenido {usuario.nombre}", "success")
                return redirect(url_for('home'))
            else:
                mensaje = "Usuario o contraseña incorrectos, o rol incorrecto"

    return render_template("login.html", mensaje=mensaje)

# -------- REGISTRO --------
@app.route('/crear-usuario', methods=['POST'])
def registrar_usuario():
    nombre = request.form.get('txtNombre')
    correo = request.form.get('txtCorreo')
    contrasena = request.form.get('txtContrasena')
    documento = request.form.get('txtDocumento')
    direccion = request.form.get('txtDireccion')
    telefono = request.form.get('txtTelefono')

    if not all([nombre, correo, contrasena, documento, direccion, telefono]):
        flash("Completa todos los campos para registrarte", "error")
        return redirect(url_for('login'))

    if obtener_usuario_por_correo(mysql, correo):
        flash("El correo ya está registrado", "error")
        return redirect(url_for('login'))

    hashed_password = generate_password_hash(contrasena)
    crear_usuario(mysql, nombre, documento, correo, hashed_password, direccion, telefono, fk_rol=1)

    flash("Usuario registrado correctamente. Ahora inicia sesión.", "success")
    return redirect(url_for('login'))

# -------- LOGIN CON GOOGLE --------
@app.route('/login/google')
def login_google():
    redirect_uri = url_for('auth_callback', _external=True)
    return google.authorize_redirect(redirect_uri, prompt='select_account')

@app.route('/auth/callback')
def auth_callback():
    token = google.authorize_access_token()
    user_info = token.get('userinfo') or token.get('id_token')
    correo = user_info.get('email')
    nombre = user_info.get('name', 'Usuario')

    usuario = obtener_usuario_por_correo(mysql, correo)
    if not usuario:
        hashed_pass = generate_password_hash(os.urandom(16).hex())
        crear_usuario(mysql, nombre, None, correo, hashed_pass, None, None, fk_rol=1)
        usuario = obtener_usuario_por_correo(mysql, correo)

    login_user(usuario)
    flash(f"Bienvenido {usuario.nombre}", "success")
    return redirect(url_for('home'))

# -------- HOME SEGÚN ROL --------
@app.route('/home')
@login_required
def home():
    rol = current_user.fk_rol
    if rol == 1:
        return render_template("estudiante/home.html", user=current_user)
    elif rol == 2:
        return render_template("instructor/home.html", user=current_user)
    elif rol == 3:
        total_usuarios = contar_usuarios(mysql)
        return render_template("admin/home.html", user=current_user, total_usuarios=total_usuarios)
    else:
        return "Rol no definido"

# -------- PÁGINAS EXTRAS --------
@app.route('/diplomados')
@login_required
def diplomados():
    return render_template("diplomados.html", user=current_user)

@app.route('/progreso_semanal')
@login_required
def progreso_semanal():
    return render_template("progreso_semanal.html", user=current_user)

@app.route('/pagos')
@login_required
def pagos():
    return render_template("pagos.html", user=current_user)

@app.route('/certificados')
@login_required
def certificados():
    return render_template("certificados.html", user=current_user)

# -------- LOGOUT --------
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash("Has cerrado sesión", "success")
    return redirect(url_for('login'))

@app.route('/quiz/<int:id>/completar', methods=['POST'])
@login_required
def completar_quiz(id):
    data = request.get_json()
    puntaje = data.get('puntaje', 0)
    
    cur = mysql.connection.cursor()
    cur.execute("SELECT diplomado_id FROM contenidos WHERE id = %s", (id,))
    result = cur.fetchone()
    
    if result:
        diplomado_id = result[0]
        
        # Actualizar evaluación
        cur.execute("""
            UPDATE evaluaciones 
            SET fecha_fin = NOW(), 
                puntaje_obtenido = %s,
                porcentaje = %s,
                aprobado = %s
            WHERE usuario_id = %s 
            AND contenido_id = %s 
            AND fecha_fin IS NULL
            ORDER BY fecha_inicio DESC 
            LIMIT 1
        """, (puntaje, puntaje, 1 if puntaje >= 70 else 0, current_user.id, id))
        
        mysql.connection.commit()
        
        # Registrar actividad
        registrar_actividad(
            'quiz_completado',
            diplomado_id=diplomado_id,
            contenido_id=id,
            detalles={'puntaje': puntaje, 'aprobado': puntaje >= 70}
        )  # ← AGREGAR ESTO
        
        cur.close()
        return jsonify({'success': True, 'puntaje': puntaje})
    
    cur.close()
    return jsonify({'success': False}), 400

# ---------------- MAIN ----------------
if __name__ == '__main__':
    app.run(debug=True)