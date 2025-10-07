import os
from flask import Flask, redirect, url_for, session, flash, render_template, request
from flask_mysqldb import MySQL
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from authlib.integrations.flask_client import OAuth, OAuthError
from flask_session import Session
from extensions import mysql
from activity_logger import registrar_actividad
from flask import jsonify
from flask_mail import Mail



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
from estudiante_routes import estudiante_bp
from pagos_routes import pagos_bp
from routes.contenidos_routes import contenidos_bp
from routes.pagos_routes import pagosH_bp
from instructor_routes import instructor_bp
from reportes_instructor_routes import reportes_instructor_bp
from perfiles_routes import perfiles_bp





# ---------------- CONFIG ----------------
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "clave_super_secreta")

# Registrar blueprints
app.register_blueprint(admin_bp)
app.register_blueprint(reportes_bp)
app.register_blueprint(metrics_bp)
app.register_blueprint(estudiante_bp)
app.register_blueprint(pagos_bp)  
app.register_blueprint(contenidos_bp)
app.register_blueprint(pagosH_bp)
app.register_blueprint(instructor_bp)
app.register_blueprint(reportes_instructor_bp)
app.register_blueprint(perfiles_bp)


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


app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'vaison37877@gmail.com'  # tu correo real
app.config['MAIL_PASSWORD'] = 'lxkk iwfi dmsj piop'   # contraseña de aplicación
app.config['MAIL_DEFAULT_SENDER'] = 'vaison37877@gmail.com'

mail = Mail(app)



# Configuración para manejo de archivos
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB máximo

# Crear carpetas de uploads si no existen
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'videos'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'documents'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'images'), exist_ok=True)
# Flask-Login

# Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# OAuth Google
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id='680454376937-rl88neotnl9fj5f8rob9rlss0bt4uot1.apps.googleusercontent.com',
    client_secret='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',
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
    # Si no está autenticado, renderiza index.html (landing page pública)
    return render_template("index.html")



@app.route('/diplomados')
@login_required
def diplomados():
    """Redirige a la nueva ruta de diplomados"""
    return redirect(url_for('estudiante.diplomados'))

@app.route('/progreso_semanal')
@login_required
def progreso_semanal():
    return render_template("estudiante/progressemanal.html", user=current_user)

@app.route('/pagos')
@login_required
def pagos():
    return render_template("estudiante/pagosH.html", user=current_user)

@app.route('/reportesIns')
@login_required
def reportesIns():
    return render_template("instructor/reportesIns.html", user=current_user)

@app.route('/certificados')
@login_required
def certificados():
    return render_template("estudiante/certificados.html", user=current_user)

@app.route('/subir-contenido', methods=['GET', 'POST'])
@login_required
def subirContenido():
    return render_template("instructor/subirContenido.html")


@app.route('/recuperarContrasena', methods=['GET', 'POST'])
def recuperarContrasena():
    return render_template("recuperarContrasena.html")

@app.route('/diplomadosIns', methods=['GET', 'POST'])
@login_required
def diplomadosIns():
    return render_template("instructor/diplomadosIns.html")

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
            cur = mysql.connection.cursor()
            cur.execute("SELECT * FROM usuarios WHERE correo=%s", (correo,))
            usuario = cur.fetchone()
            cur.close()
            rol_map = {'estudiante': 1, 'docente': 2, 'admin': 3}
            rol_num = rol_map.get(rol_seleccionado.lower())
            if usuario and check_password_hash(usuario['contrasena'], contrasena) and usuario['fk_rol'] == rol_num:
                user = Usuario(usuario['id'], usuario['nombre'], usuario['correo'], usuario['fk_rol'])
                login_user(user)
                flash(f"Bienvenido {usuario['nombre']}", "success")
                return redirect(url_for('home'))
            else:
                mensaje = "Usuario o contraseña incorrectos, o rol incorrecto"
    return render_template("login.html", mensaje=mensaje)

@app.route('/crear-usuario', methods=['POST'])
def registro_manual():
    nombre = request.form.get('txtNombre')
    correo = request.form.get('txtCorreo')
    contrasena = request.form.get('txtContrasena')
    documento = request.form.get('txtDocumento')
    direccion = request.form.get('txtDireccion')
    telefono = request.form.get('txtTelefono')

    if not all([nombre, correo, contrasena, documento, direccion, telefono]):
        flash("Completa todos los campos para registrarte", "error")
        return redirect(url_for('login'))

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM usuarios WHERE correo=%s", (correo,))
    existe = cur.fetchone()
    if existe:
        flash("El correo ya está registrado", "error")
        cur.close()
        return redirect(url_for('login'))

    hashed_password = generate_password_hash(contrasena)
    fk_rol = 1  # estudiante por defecto

    cur.execute("""
        INSERT INTO usuarios(nombre, documento, correo, contrasena, direccion, telefono, fk_rol)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (nombre, documento, correo, hashed_password, direccion, telefono, fk_rol))
    mysql.connection.commit()
    cur.close()

    flash("Usuario registrado correctamente. Ahora inicia sesión.", "success")
    return redirect(url_for('login'))

@app.route('/login/google')
def login_google():
    redirect_uri = url_for('auth_callback', _external=True)
    return google.authorize_redirect(redirect_uri, prompt='select_account')

@app.route('/auth/callback')
def auth_callback():
    if 'error' in request.args:
        flash("Inicio de sesión con Google cancelado o denegado.", "info")
        return redirect(url_for('login'))

    try:
        # Si no hay error en la URL, intenta obtener el token.
        token = google.authorize_access_token()
    except OAuthError as e:
        # Maneja cualquier otro error inesperado que pueda ocurrir durante el intercambio del token.
        print(f"Error durante el intercambio de token OAuth: {e}")
        flash("Error de autenticación con Google. Inténtalo de nuevo.", "danger")
        return redirect(url_for('login'))
        
    # El resto de la lógica de autenticación y registro de usuario sigue aquí
    user_info = token.get('userinfo') or token.get('id_token')
    correo = user_info.get('email')
    nombre = user_info.get('name', 'Usuario')

    usuario = obtener_usuario_por_correo(mysql, correo)

    if not usuario:
        hashed_pass = generate_password_hash(os.urandom(16).hex())
        crear_usuario(mysql, nombre, None, correo, hashed_pass, None, None, 1)
        usuario = obtener_usuario_por_correo(mysql, correo)
        
    login_user(usuario)
    flash(f"Bienvenido {usuario.nombre}", "success")
    
    # ⭐ SOLUCIÓN AL TYPERROR: Se elimina 'usuario_id=usuario.id' de la llamada. ⭐
    registrar_actividad('login_google') 
    
    return redirect(url_for('home'))
        
    # El resto de la lógica de autenticación y registro de usuario solo se ejecuta si el token es exitoso
    user_info = token.get('userinfo') or token.get('id_token')
    correo = user_info.get('email')
    nombre = user_info.get('name', 'Usuario')

    usuario = obtener_usuario_por_correo(mysql, correo)

    if not usuario:
        hashed_pass = generate_password_hash(os.urandom(16).hex())
        crear_usuario(mysql, nombre, None, correo, hashed_pass, None, None, 1)
        usuario = obtener_usuario_por_correo(mysql, correo)
        
    login_user(usuario)
    flash(f"Bienvenido {usuario.nombre}", "success")
    registrar_actividad('login_google', usuario_id=usuario.id)
    return redirect(url_for('home'))

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


# -------- LOGOUT --------
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash("Has cerrado sesión", "success")
    return redirect(url_for('login'))


from routes.diplomados import create_diplomados_blueprint
from routes.contenido import create_contenido_blueprint


from routes.recovery import create_recovery_blueprint

recovery_bp = create_recovery_blueprint(mysql, mail, app)
app.register_blueprint(recovery_bp)

diplomados_bp = create_diplomados_blueprint(mysql)
contenido_bp = create_contenido_blueprint(mysql)

app.register_blueprint(diplomados_bp)
app.register_blueprint(contenido_bp)

# ---------------- MAIN ----------------
if __name__ == '__main__':
    app.run(debug=True)