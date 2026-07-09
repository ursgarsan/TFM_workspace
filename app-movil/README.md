# app-movil

App movil con Expo + React Native para pacientes.

## Objetivo

- Login de paciente
- Consulta de recordatorios (`/api/v1/treatments/my/reminders`)
- Registro de token de dispositivo en backend (`/api/v1/notifications/devices/register`)
- Recepcion de notificaciones push remotas desde servidor

## Requisitos

- Node.js 20+ o 22 LTS
- Android Studio con SDK y AVD configurados
- app-api ejecutandose en `http://10.0.2.2:8000` (si usas emulador Android)

## Variables de entorno

En `.env.local`:

- `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000`
- `EXPO_PUBLIC_PROJECT_ID=<tu-expo-project-id>`
- `EXPO_PUBLIC_ALLOW_EMULATOR_PUSH=true` (solo para pruebas en emulador)

## Credenciales Firebase

- `google-services.json` se usa en cliente Android y no debe subirse a Git.
- La clave JSON de `Service accounts` (FCM V1) tampoco debe subirse a Git.
- Para FCM V1 usa `npx eas credentials` y sube la clave de `Service accounts` en Expo.

## Desarrollo

1. `npm install`
2. `npm run android`

`npm run android` usa `expo run:android`, que compila y ejecuta sobre el emulador/dispositivo.

## Android Studio (build manual)

1. Ejecuta antes: `npx expo prebuild --platform android`
2. Abre la carpeta `android/` en Android Studio
3. Espera a Gradle Sync
4. Selecciona un emulador/dispositivo
5. Pulsa Run

## Notas importantes sobre push

- Para push remoto, el paciente debe abrir la app al menos una vez para iniciar sesion y aceptar permisos de notificacion.
- Despues de ese registro inicial, los cambios de tratamientos se leen desde backend y no hace falta volver a abrir la app para reprogramar recordatorios.
- En emulador Android, el push remoto puede ser inestable. Usa una imagen AVD con Google Play y deja `EXPO_PUBLIC_ALLOW_EMULATOR_PUSH=true` para permitir registro de token en pruebas.
