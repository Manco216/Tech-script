from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
import json
import MySQLdb.cursors

def create_diplomados_blueprint(mysql):
    diplomados_bp = Blueprint(
        "diplomados",
        __name__,
        url_prefix="/diplomados"
    )

    @diplomados_bp.route("/api/listar", methods=["GET"])
    @login_required
    def api_listar_diplomados():
        try:
            print(f"🔍 Usuario ID: {current_user.id}")
            
            cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
            cur.execute("""
                SELECT id, titulo, categoria, descripcion, nivel, duracion_horas, lecciones_estimadas,
                       objetivos, precio, estado, 
                       DATE_FORMAT(fecha_creacion, '%%Y-%%m-%%d') as fecha_creacion
                FROM diplomados
                WHERE usuario_id = %s
                ORDER BY fecha_creacion DESC
            """, (current_user.id,))
            rows = cur.fetchall()
            cur.close()
            
            print(f"📊 Filas encontradas: {len(rows)}")

            diplomados = []
            for row in rows:
                try:
                    objetivos_data = row.get("objetivos", "[]")
                    if isinstance(objetivos_data, bytes):
                        objetivos_data = objetivos_data.decode('utf-8')
                    
                    objetivos = json.loads(objetivos_data) if objetivos_data else []
                except:
                    objetivos = []

                diplomados.append({
                    "id": row["id"],
                    "titulo": row["titulo"],
                    "categoria": row["categoria"],
                    "descripcion": row["descripcion"],
                    "nivel": row["nivel"],
                    "duracion_horas": row["duracion_horas"],
                    "lecciones_estimadas": row["lecciones_estimadas"],
                    "objetivos": objetivos,
                    "precio": float(row["precio"]) if row["precio"] else 0,
                    "estado": row["estado"],
                    "fecha_creacion": row["fecha_creacion"],
                })

            print(f"✅ Diplomados procesados: {len(diplomados)}")
            return jsonify(diplomados)
            
        except Exception as e:
            print(f"❌ ERROR COMPLETO: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    @diplomados_bp.route("/api/crear", methods=["POST"])
    @login_required
    def api_crear_diplomado():
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No se recibieron datos"}), 400

            titulo = data.get("titulo")
            categoria = data.get("categoria")
            descripcion = data.get("descripcion")
            nivel = data.get("nivel", "Principiante")
            duracion_horas = int(data.get("duracion_horas") or 0)
            lecciones_estimadas = int(data.get("lecciones_estimadas") or 0)
            objetivos = json.dumps(data.get("objetivos", []))
            precio = float(data.get("precio") or 0)
            estado = data.get("estado", "draft")

            if not titulo or not categoria or not descripcion:
                return jsonify({"error": "Faltan campos obligatorios"}), 400

            cur = mysql.connection.cursor()
            cur.execute("""
                INSERT INTO diplomados (titulo, categoria, descripcion, nivel,
                                        duracion_horas, lecciones_estimadas, objetivos,
                                        precio, estado, usuario_id, fecha_creacion)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            """, (titulo, categoria, descripcion, nivel,
                  duracion_horas, lecciones_estimadas, objetivos,
                  precio, estado, current_user.id))
            mysql.connection.commit()
            nuevo_id = cur.lastrowid
            cur.close()

            return jsonify({"message": "Diplomado creado exitosamente", "id": nuevo_id}), 201

        except Exception as e:
            print(f"❌ Error al crear diplomado: {e}")
            return jsonify({"error": str(e)}), 500

    @diplomados_bp.route("/api/editar/<int:diplomado_id>", methods=["PUT"])
    @login_required
    def api_editar_diplomado(diplomado_id):
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No se recibieron datos"}), 400

            titulo = data.get("titulo")
            categoria = data.get("categoria")
            descripcion = data.get("descripcion")
            nivel = data.get("nivel", "Principiante")
            duracion_horas = int(data.get("duracion_horas") or 0)
            lecciones_estimadas = int(data.get("lecciones_estimadas") or 0)
            objetivos = json.dumps(data.get("objetivos", []))
            precio = float(data.get("precio") or 0)
            estado = data.get("estado", "draft")

            if not titulo or not categoria or not descripcion:
                return jsonify({"error": "Faltan campos obligatorios"}), 400

            cur = mysql.connection.cursor()
            cur.execute("""
                UPDATE diplomados
                SET titulo=%s, categoria=%s, descripcion=%s, nivel=%s,
                    duracion_horas=%s, lecciones_estimadas=%s, objetivos=%s,
                    precio=%s, estado=%s
                WHERE id=%s AND usuario_id=%s
            """, (titulo, categoria, descripcion, nivel,
                  duracion_horas, lecciones_estimadas, objetivos,
                  precio, estado, diplomado_id, current_user.id))
            mysql.connection.commit()
            
            if cur.rowcount == 0:
                cur.close()
                return jsonify({"error": "Diplomado no encontrado o no autorizado"}), 404
            
            cur.close()

            return jsonify({"message": "Diplomado actualizado exitosamente"}), 200

        except Exception as e:
            print(f"❌ Error al editar diplomado: {e}")
            return jsonify({"error": str(e)}), 500

    @diplomados_bp.route("/api/eliminar/<int:diplomado_id>", methods=["DELETE"])
    @login_required
    def api_eliminar_diplomado(diplomado_id):
        try:
            cur = mysql.connection.cursor()
            cur.execute("""
                DELETE FROM diplomados
                WHERE id=%s AND usuario_id=%s
            """, (diplomado_id, current_user.id))
            mysql.connection.commit()
            
            if cur.rowcount == 0:
                cur.close()
                return jsonify({"error": "Diplomado no encontrado o no autorizado"}), 404
            
            cur.close()
            return jsonify({"message": "Diplomado eliminado exitosamente"}), 200

        except Exception as e:
            print(f"❌ Error al eliminar diplomado: {e}")
            return jsonify({"error": str(e)}), 500

    return diplomados_bp