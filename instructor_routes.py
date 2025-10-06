from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from extensions import mysql
import MySQLdb.cursors
from functools import wraps
from datetime import datetime, timedelta

instructor_bp = Blueprint(
    "instructor",
    __name__,
    url_prefix="/instructor"
)

# Decorador para verificar que el usuario es instructor
def instructor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "No autenticado"}), 401
        if current_user.fk_rol != 2:  # 2 = docente/instructor
            return jsonify({"error": "Acceso no autorizado"}), 403
        return f(*args, **kwargs)
    return decorated_function

# =================== VISTA: HOME INSTRUCTOR ===================
@instructor_bp.route("/home")
@login_required
@instructor_required
def home():
    """Página principal del instructor"""
    return render_template("instructor/home.html", user=current_user)

# =================== VISTA: SEGUIMIENTO ESTUDIANTES ===================
@instructor_bp.route("/seguimiento-estudiantes")
@login_required
@instructor_required
def seguimiento_estudiantes():
    """Página de seguimiento de estudiantes"""
    return render_template("instructor/seguimientoEstudiantes.html", user=current_user)

