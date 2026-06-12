# app-web

Frontend web en React (JavaScript) con Vite.

## Requisitos
- Node.js 20+ (recomendado 22 LTS)
- npm

## Configuracion
La URL del backend se define con `VITE_API_BASE_URL`.

Ejemplo local en `.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Desarrollo
```powershell
npm install
npm run dev
```

App disponible en `http://localhost:5173`.

## Build
```powershell
npm run build
```

## Comprobacion de API
La pantalla principal hace una llamada a `GET /api/v1/health` y muestra si el backend esta conectado.
