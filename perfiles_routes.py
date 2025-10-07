from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from extensions import mysql
from MySQLdb.cursors import DictCursor

# Definición del Blueprint
perfiles_bp = Blueprint("perfiles", __name__, url_prefix="/perfil")

# --------------------------------------------------------
# VISTA PERFIL ESTUDIANTE
# --------------------------------------------------------
@perfiles_bp.route("/estudiante")
@login_required
def perfil_estudiante():
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("SELECT * FROM usuarios WHERE id = %s", (current_user.id,))
    usuario = cur.fetchone()
    cur.close()

    # 🔹 Pasamos la variable usuario al template
    return render_template("estudiante/perfilEstudiante.html", usuario=usuario)

# --------------------------------------------------------
# VISTA PERFIL INSTRUCTOR
# --------------------------------------------------------
@perfiles_bp.route("/instructor")
@login_required
def perfil_instructor():
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("SELECT * FROM usuarios WHERE id = %s", (current_user.id,))
    usuario = cur.fetchone()
    cur.close()

    if not usuario:
        return "Usuario no encontrado", 404

    return render_template("instructor/perfilInstructor.html", usuario=usuario)

# --------------------------------------------------------
# API para actualizar perfil
# --------------------------------------------------------
@perfiles_bp.route("/actualizar", methods=["POST"])
@login_required
def actualizar_perfil():
    data = request.json
    nombre = data.get("nombre")
    correo = data.get("correo")
    telefono = data.get("telefono")
    documento = data.get("documento")

    cur = mysql.connection.cursor()
    cur.execute("""
        UPDATE usuarios
        SET nombre = %s, correo = %s, telefono = %s, documento = %s
        WHERE id = %s
    """, (nombre, correo, telefono, documento, current_user.id))
    mysql.connection.commit()
    cur.close()

    return jsonify({"mensaje": "Perfil actualizado correctamente"})
