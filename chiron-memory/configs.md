# config

Setup and configuration — env vars, flags, how to run the project.

## Cómo correr Kairos en desarrollo

- **What**: Server: `cd server && npm run dev` (Express en `http://localhost:3001`, health check en `/salud`, SQLite en `server/prisma/dev.db`, config en `server/.env`). App: `cd app && npm start` (Expo). La URL de la API para la app está en `app/app.json` → `expo.extra.apiUrl`, hoy fijada a `http://10.0.2.2:3001` (el loopback del emulador Android hacia el host).
- **Why**: Dos carpetas independientes sin monorepo tool (ver [[architectures]]). `10.0.2.2` solo funciona en el emulador Android — un dispositivo físico necesita la IP de LAN de la máquina de desarrollo.
- **Where**: raíz del repo.
- **Learned**: El Node instalado (v20.11.0) queda por debajo del mínimo que pide Expo 57 (`>=20.19.4`); Metro igual bundlea (con warning), pero conviene actualizar Node antes de un build con EAS o si aparecen errores raros de tooling.

