"""
Script de prueba para verificar las rutas de estudiante
Ejecutar: python test_estudiante.py
"""

import sys
import os

# Agregar el directorio del proyecto al path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("🧪 TEST DE RUTAS DE ESTUDIANTE")
print("=" * 60)

# 1. Verificar imports
print("\n1️⃣ Verificando imports...")
try:
    from estudiante_routes import estudiante_bp
    print("✅ estudiante_routes importado correctamente")
except Exception as e:
    print(f"❌ Error al importar estudiante_routes: {e}")
    sys.exit(1)

try:
    from extensions import mysql
    print("✅ extensions importado correctamente")
except Exception as e:
    print(f"❌ Error al importar extensions: {e}")
    sys.exit(1)

# 2. Verificar blueprint
print("\n2️⃣ Verificando blueprint...")
print(f"   - Nombre: {estudiante_bp.name}")
print(f"   - URL Prefix: {estudiante_bp.url_prefix}")
print(f"   - Rutas registradas: {len(estudiante_bp.deferred_functions)} funciones")

# 3. Ver todas las rutas registradas
print("\n3️⃣ Rutas del blueprint:")
for rule in estudiante_bp.deferred_functions:
    print(f"   - {rule}")

# 4. Verificar estructura de la BD
print("\n4️⃣ Verificando tablas de BD...")
try:
    import pymysql
    
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='tech_script',
        port=3308,
        cursorclass=pymysql.cursors.DictCursor
    )
    
    cursor = conn.cursor()
    
    # Contar diplomados
    cursor.execute("SELECT COUNT(*) as total FROM diplomados WHERE estado='active'")
    result = cursor.fetchone()
    print(f"   ✅ Diplomados activos: {result['total']}")
    
    # Contar contenidos
    cursor.execute("SELECT COUNT(*) as total FROM contenidos WHERE estado='published'")
    result = cursor.fetchone()
    print(f"   ✅ Contenidos publicados: {result['total']}")
    
    # Contar matrículas
    cursor.execute("SELECT COUNT(*) as total FROM matriculas")
    result = cursor.fetchone()
    print(f"   ✅ Matrículas registradas: {result['total']}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"   ⚠️  No se pudo conectar a la BD: {e}")

# 5. Verificar app.py
print("\n5️⃣ Verificando app.py...")
try:
    with open('app.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'from estudiante_routes import estudiante_bp' in content:
        print("   ✅ Import de estudiante_bp encontrado")
    else:
        print("   ❌ Falta import: from estudiante_routes import estudiante_bp")
    
    if 'app.register_blueprint(estudiante_bp)' in content:
        print("   ✅ Blueprint registrado en app")
    else:
        print("   ❌ Falta: app.register_blueprint(estudiante_bp)")
        
except Exception as e:
    print(f"   ⚠️  No se pudo leer app.py: {e}")

print("\n" + "=" * 60)
print("✨ Test completado")
print("=" * 60)

print("\n📝 Próximos pasos:")
print("1. Ejecuta: python app.py")
print("2. Abre el navegador en: http://localhost:5000")
print("3. Inicia sesión como estudiante")
print("4. Ve a 'Diplomados'")
print("5. Abre la consola del navegador (F12) para ver los logs")