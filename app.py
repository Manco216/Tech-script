import os
from flask import Flask, render_template, request, redirect, url_for, make_response
from flask_mysqldb import MySQL
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token, get_jwt_identity, set_access_cookies
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime

# ---------------------- CONFIGURACIÓN ----------------------
app = Flask(__name__, template_folder='templates')
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "clave_super_secreta")

# Configuración de MySQL
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'tech'
app.config['MYSQL_PORT'] = 3306
app.config['MYSQL_CURSORCLASS'] = 'DictCursor' 

mysql = MySQL(app)

# Configuración de JWT en cookies
app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY", "clave_muy_segura_y_larga")
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = False
app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token_cookie'
app.config['JWT_COOKIE_CSRF_PROTECT'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

jwt = JWTManager(app)

# ---------------------- RUTAS ----------------------

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login', methods=["GET", "POST"])
def login():
    # Cargar datos adicionales para el formulario
    try:
        with mysql.connection.cursor() as cur:
            cur.execute("SELECT id_idoc, nom_tipo FROM tbl_idoc")
            tipos_doc = cur.fetchall()
            cur.execute("SELECT id_ciudad, nom_ciudad FROM tbl_ciudad")
            ciudades = cur.fetchall()
            cur.execute("SELECT id_rol_us, nom_tipous FROM tbl_rol_us")
            roles = cur.fetchall()
    except Exception as e:
        print(f"Error al cargar datos de tablas de apoyo: {e}")
        tipos_doc = ciudades = roles = []

    mensaje_registro = request.args.get('mensaje_registro')


    if request.method == 'POST':
        correo = request.form.get('txtCorreo')
        contrasena = request.form.get('txtContrasena')
        # IMPORTANTE: Capturar el rol seleccionado para usarlo como filtro de acceso (Contexto)
        fk_id_rol_us_selected = request.form.get('txtRol') 

        if not correo or not contrasena or not fk_id_rol_us_selected:
            return render_template(
                'login.html',
                mensaje_error="Por favor, completa todos los campos (incluyendo el rol) para iniciar sesión.",
                tipos_doc=tipos_doc,
                ciudades=ciudades,
                roles=roles
            )

        with mysql.connection.cursor() as cur:
            # La consulta ahora filtra por correo Y por el ID de rol seleccionado
            cur.execute("""
                SELECT u.*, r.nom_tipous
                FROM tbl_us u
                JOIN tbl_rol_us r ON u.fk_id_rol_us = r.id_rol_us
                WHERE u.correo = %s AND u.fk_id_rol_us = %s
            """, (correo, fk_id_rol_us_selected))
            account = cur.fetchone()

        if account and check_password_hash(account['contrasena'], contrasena):
            # Limpiamos el rol obtenido para garantizar una comparación correcta
            rol = account['nom_tipous'].lower().strip()
            access_token = create_access_token(identity=str(account['id_us']))

            # Redirigir según el rol seleccionado y validado
            if rol == "estudiante":
                resp = make_response(redirect(url_for('student')))
            elif rol == "docente":
                resp = make_response(redirect(url_for('teacher')))
            else:
                # Si el rol es desconocido o inválido para una vista
                return render_template(
                    'login.html',
                    mensaje_error=f"El rol seleccionado ('{account['nom_tipous']}') no tiene una vista de inicio asignada.",
                    tipos_doc=tipos_doc,
                    ciudades=ciudades,
                    roles=roles
                )

            set_access_cookies(resp, access_token)
            return resp
        else:
            # Fallo de credenciales o rol/correo no coinciden
            return render_template(
                'login.html',
                mensaje_error="Usuario, contraseña o rol incorrectos.",
                tipos_doc=tipos_doc,
                ciudades=ciudades,
                roles=roles
            )
    
    return render_template('login.html', 
                           tipos_doc=tipos_doc, 
                           ciudades=ciudades, 
                           roles=roles,
                           mensaje_registro=mensaje_registro)


@app.route('/student')
@jwt_required()
def student():
    current_user_id = get_jwt_identity()
    with mysql.connection.cursor() as cur:
        cur.execute("""
            SELECT u.nombre, u.correo, r.nom_tipous
            FROM tbl_us u
            INNER JOIN tbl_rol_us r ON u.fk_id_rol_us = r.id_rol_us
            WHERE u.id_us = %s
        """, (current_user_id,))
        user = cur.fetchone()

    # Limpiar el rol para la verificación de acceso
    user_role = user['nom_tipous'].lower().strip() if user and 'nom_tipous' in user else ''

    if user_role != "estudiante":
        return "No tienes permisos para acceder a esta vista (Estudiante)", 403

    return render_template("estudiante/student.html", user=user)


@app.route('/teacher')
@jwt_required()
def teacher():
    current_user_id = get_jwt_identity()
    with mysql.connection.cursor() as cur:
        cur.execute("""
            SELECT u.nombre, u.correo, r.nom_tipous
            FROM tbl_us u
            INNER JOIN tbl_rol_us r ON u.fk_id_rol_us = r.id_rol_us
            WHERE u.id_us = %s
        """, (current_user_id,))
        user = cur.fetchone()

    # Limpiar el rol para la verificación de acceso
    user_role = user['nom_tipous'].lower().strip() if user and 'nom_tipous' in user else ''

    if user_role != "docente":
        return "No tienes permisos para acceder a esta vista (Docente)", 403

    return render_template("instructor/instructor.html", user=user)

@app.route('/recuperar-contrasena')
def recuperar_contrasena():
    return render_template("recuperarContrasena.html")

@app.route('/diplomados')
@jwt_required()
def diplomados():
    return render_template("estudiante/diplomados.html")

@app.route('/progreso-semanal')
@jwt_required()
def progreso_semanal():
    return render_template("estudiante/progressemanal.html")

@app.route('/pagos')
@jwt_required()
def pagos():
    return render_template("estudiante/pagos.html")

@app.route('/mensajes')
@jwt_required()
def mensajes():
    return render_template("estudiante/mensajes.html")

@app.route('/certificados')
@jwt_required()
def certificados():
    return render_template("estudiante/certificados.html")

# ---------------------- CREAR USUARIO ----------------------
@app.route('/crear-usuario', methods=["POST"])
def crear_usuario():
    nombre = request.form.get('txtNombre')
    correo = request.form.get('txtCorreo')
    contrasena = request.form.get('txtContrasena')
    direccion = request.form.get('txtDireccion')
    telefono = request.form.get('txtTelefono')
    documento = request.form.get('txtDocumento')
    # Capturar como strings antes de intentar la conversión
    fk_id_idoc_str = request.form.get('txtTipoDoc')
    fk_id_ciudad_str = request.form.get('txtCiudad')
    fk_id_rol_us_str = request.form.get('txtRol')

    if all([nombre, correo, contrasena, direccion, telefono, documento, fk_id_idoc_str, fk_id_ciudad_str, fk_id_rol_us_str]):
        try:
            # Intentar convertir los IDs a entero. Si fallan, irán al ValueError.
            fk_id_idoc = int(fk_id_idoc_str)
            fk_id_ciudad = int(fk_id_ciudad_str)
            fk_id_rol_us = int(fk_id_rol_us_str)

            with mysql.connection.cursor() as cur:
                cur.execute('SELECT * FROM tbl_us WHERE correo = %s', (correo,))
                existente = cur.fetchone()

                if existente:
                    return redirect(url_for('login', mensaje_registro="El correo ya está registrado."))

                hashed_password = generate_password_hash(contrasena)

                cur.execute('''
                    INSERT INTO tbl_us
                    (nombre, correo, contrasena, direccion, telefono, documento, estado, token, fk_id_idoc, fk_id_ciudad, fk_id_rol_us, fecha_creacion)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    nombre, correo, hashed_password, direccion, telefono,
                    documento, 'activo', "", fk_id_idoc, fk_id_ciudad, fk_id_rol_us, datetime.now()
                ))
                mysql.connection.commit()

            return redirect(url_for('login', mensaje_registro="Usuario registrado con éxito. Inicia sesión."))

        except ValueError:
            # Este error ocurre si se seleccionó la opción por defecto con valor vacío ('')
            return redirect(url_for('login', mensaje_registro="Error: Por favor, selecciona un valor válido para Rol, Ciudad y Tipo de Documento."))
        
        except Exception as e:
            # Imprimir el error de la base de datos en la consola para depuración
            print(f"Error al crear usuario en BD: {e}")
            return redirect(url_for('login', mensaje_registro="Error al registrar el usuario en la base de datos. (Ver consola)"))

    return redirect(url_for('login', mensaje_registro="Completa todos los campos requeridos."))


# ---------------------- MAIN ----------------------

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)