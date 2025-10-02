# gestionUsuarios.py
from models import Usuario

def obtener_usuario_por_id(mysql, user_id):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM usuarios WHERE id=%s", (user_id,))
    u = cur.fetchone()
    cur.close()
    return Usuario.from_dict(u) if u else None

def obtener_usuario_por_correo(mysql, correo):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM usuarios WHERE correo=%s", (correo,))
    u = cur.fetchone()
    cur.close()
    return Usuario.from_dict(u) if u else None

def contar_usuarios(mysql):
    cur = mysql.connection.cursor()
    cur.execute("SELECT COUNT(*) AS total FROM usuarios")
    total = cur.fetchone()['total']
    cur.close()
    return total

def contar_por_rol(mysql, rol_id):
    cur = mysql.connection.cursor()
    cur.execute("SELECT COUNT(*) AS total FROM usuarios WHERE fk_rol = %s", (rol_id,))
    total = cur.fetchone()['total']
    cur.close()
    return total


def crear_usuario(mysql, nombre, documento, correo, contrasena, direccion, telefono, fk_rol=1):
    cur = mysql.connection.cursor()
    cur.execute("""
        INSERT INTO usuarios (nombre, documento, correo, contrasena, direccion, telefono, fk_rol)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (nombre, documento, correo, contrasena, direccion, telefono, fk_rol))
    mysql.connection.commit()
    cur.close()
    
    return True
