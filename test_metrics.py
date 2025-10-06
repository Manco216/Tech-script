"""
Script de prueba para verificar que las métricas funcionan correctamente
Ejecuta: python test_metrics.py
"""

import requests
import json

# Cambia esto si tu servidor corre en otro puerto
BASE_URL = "http://localhost:5000"

def test_metrics_endpoint():
    print("🧪 Probando endpoint de métricas...")
    
    try:
        # Nota: Este test asume que NO necesitas autenticación para el endpoint
        # Si tu app requiere login, necesitarás agregar cookies de sesión
        
        response = requests.get(f"{BASE_URL}/admin/metricas/data")
        
        if response.status_code == 200:
            print("✅ Endpoint responde correctamente")
            data = response.json()
            
            print("\n📊 DATOS RECIBIDOS:")
            print("=" * 50)
            print(json.dumps(data, indent=2, ensure_ascii=False))
            print("=" * 50)
            
            # Validar estructura
            required_keys = ['sistema', 'usuarios', 'engagement', 'conversiones', 'contenido', 'alertas']
            missing = [key for key in required_keys if key not in data]
            
            if missing:
                print(f"\n⚠️  Faltan claves: {missing}")
            else:
                print("\n✅ Estructura de datos correcta")
                
            # Validar valores
            if data['usuarios']['online'] > 0:
                print(f"✅ Usuarios online: {data['usuarios']['online']}")
            else:
                print("⚠️  No hay usuarios online (normal si no hay actividad reciente)")
                
        elif response.status_code == 401:
            print("⚠️  Endpoint requiere autenticación")
            print("   Tip: Inicia sesión en el navegador y copia las cookies")
            
        elif response.status_code == 404:
            print("❌ Endpoint no encontrado (404)")
            print("   Verifica que el blueprint esté registrado correctamente")
            
        else:
            print(f"❌ Error: Status code {response.status_code}")
            print(f"   Respuesta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al servidor")
        print("   ¿Está corriendo Flask? Ejecuta: python app.py")
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def test_database_data():
    print("\n\n🗄️  Verificando datos en la base de datos...")
    print("=" * 50)
    print("Ejecuta estas consultas en MySQL para verificar:")
    print()
    print("-- Verificar actividad reciente:")
    print("SELECT COUNT(*) as total FROM actividad_usuario;")
    print("SELECT COUNT(*) as ultimas_24h FROM actividad_usuario WHERE fecha_hora >= NOW() - INTERVAL 1 DAY;")
    print()
    print("-- Verificar progreso:")
    print("SELECT COUNT(*) as total FROM progreso_contenidos;")
    print()
    print("-- Verificar evaluaciones:")
    print("SELECT COUNT(*) as total FROM evaluaciones;")
    print("=" * 50)

if __name__ == "__main__":
    print("🚀 TEST DE MÉTRICAS - TechScript")
    print("=" * 50)
    test_metrics_endpoint()
    test_database_data()
    print("\n✨ Test completado\n")