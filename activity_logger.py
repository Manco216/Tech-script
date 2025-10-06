from extensions import mysql
from flask_login import current_user
from datetime import datetime
import json

def registrar_actividad(tipo_actividad, diplomado_id=None, contenido_id=None, detalles=None):
    """
    Registra actividad del usuario en la base de datos
    
    Tipos válidos:
    - login, logout
    - inicio_contenido, completado_contenido
    - quiz_iniciado, quiz_completado
    - diplomado_iniciado, diplomado_completado
    """
    if not current_user.is_authenticated:
        return
    
    try:
        cur = mysql.connection.cursor()
        
        detalles_json = json.dumps(detalles) if detalles else None
        
        cur.execute("""
            INSERT INTO actividad_usuario 
            (usuario_id, tipo_actividad, diplomado_id, contenido_id, detalles_json)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            current_user.id,
            tipo_actividad,
            diplomado_id,
            contenido_id,
            detalles_json
        ))
        
        mysql.connection.commit()
        cur.close()
    except Exception as e:
        print(f"Error registrando actividad: {e}")

# Ejemplo de uso en tus routes:
# 
# from activity_logger import registrar_actividad
#
# @app.route('/login', methods=['POST'])
# def login():
#     # ... tu código de login
#     registrar_actividad('login')
#     return redirect(url_for('home'))
#
# @app.route('/diplomado/<int:id>')
# def ver_diplomado(id):
#     registrar_actividad('diplomado_iniciado', diplomado_id=id)
#     return render_template('diplomado.html')
#
# @app.route('/contenido/<int:id>')
# def ver_contenido(id):
#     # Obtener diplomado_id del contenido
#     registrar_actividad('inicio_contenido', contenido_id=id, diplomado_id=diplomado_id)
#     return render_template('contenido.html')