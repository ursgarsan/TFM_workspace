# app-api

API con FastAPI para el proyecto TFM.

## Requisitos
- Python 3.12+ (recomendado 3.12 o 3.13)
- PostgreSQL instalado y en ejecución

## Inicializacion
```powershell
cd app-api
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Si quieres cambiar configuracion por entorno, copia `.env.example` a `.env` y ajusta valores.

## PostgreSQL
1. Crea una base de datos llamada `app_api`.
2. Ajusta `DATABASE_URL` en `.env` si tu usuario o contraseña son distintos.
3. Cuando tengas modelos, genera migraciones con Alembic.

## Ejecutar en desarrollo
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Estructura
```text
app/
	api/
		v1/
			endpoints/
				health.py
			router.py
	core/
		config.py
	main.py
```

## Endpoints
- `GET /health` (compatibilidad)
- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

`/api/v1/health/ready` valida la conexion a PostgreSQL.
