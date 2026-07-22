# app-api

API con FastAPI para el proyecto TFM.

## Requisitos
- Python 3.12+ (recomendado 3.12 o 3.13)
- PostgreSQL instalado y en ejecución

## Inicialización
```powershell
cd app-api
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Si quieres cambiar la configuración por entorno, copia `.env.example` a `.env` y ajusta los valores.

## PostgreSQL
1. Crea una base de datos llamada `app_api`.
2. Ajusta `DATABASE_URL` en `.env` si tu usuario o contraseña son distintos.
3. Cuando tengas modelos, genera migraciones con Alembic.

## Ejecutar en desarrollo
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Correo de bienvenida para pacientes

Al crear un paciente desde el portal web, la API genera una contraseña temporal y la envía por SMTP. Configura en `.env`:

- `SMTP_HOST` y `SMTP_PORT`
- `SMTP_USERNAME` y `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL` y `SMTP_FROM_NAME`
- `SMTP_USE_TLS=true` para STARTTLS, normalmente en el puerto 587
- `SMTP_USE_SSL=true` y `SMTP_USE_TLS=false` para SSL directo, normalmente en el puerto 465

Antes de reiniciar la API sobre una base de datos existente, aplica la migración:

```powershell
alembic upgrade head
```

Si el envío del correo falla, la creación del paciente se cancela para evitar una cuenta sin credenciales entregadas.

## Datos iniciales (seed)

El seed carga cinco pacientes ficticios con perfiles realistas, siete tratamientos,
sus horarios y 14 días de historial de adherencia. Es idempotente: puedes volver a
ejecutarlo sin duplicar sus registros.

Con PostgreSQL en ejecución y la configuración de `.env` preparada:

```powershell
cd app-api
.\.venv\Scripts\Activate.ps1
alembic upgrade head
python scripts/seed.py
```

Al terminar, el script imprime las credenciales de desarrollo. Las principales son:

- Profesional: `elena.ruiz@tfmapp.com` / `Profesional2026!`
- Paciente: `marta.soler@tfmapp.com` / `Paciente2026!`

Todos los pacientes comparten la contraseña de desarrollo `Paciente2026!`.

Después puedes iniciar la API con:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Asistente IA real
El endpoint `POST /api/v1/assistant/query` usa IA real si configuras API key.
Si no hay clave o falla el proveedor, hace fallback automatico a reglas.

Variables relevantes en `.env`:
- `ASSISTANT_AI_ENABLED=true`
- `ASSISTANT_AI_PROVIDER=openai`
- `ASSISTANT_AI_MODEL=llama3.1:8b`
- `ASSISTANT_AI_API_KEY=ollama`
- `ASSISTANT_AI_BASE_URL=http://localhost:11434/v1`

### Ollama local (gratis)
1. Instalar Ollama en Windows:

```powershell
winget install -e --id Ollama.Ollama --accept-package-agreements --accept-source-agreements
```

2. Descargar modelo:

```powershell
ollama pull llama3.1:8b
```

3. Reiniciar la API y probar `POST /api/v1/assistant/query`.

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

`/api/v1/health/ready` valida la conexión a PostgreSQL.
