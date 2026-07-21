# Deploy Fitmi

## Backend + base de datos en Railway

1. Crear un proyecto en Railway.
2. Agregar una base de datos PostgreSQL.
3. Agregar un servicio desde el repo de GitHub.
4. Configurar el servicio del backend:
   - Root Directory: `/Backend`
   - Build Command: `npm run build`
   - Start Command: lo toma de `Backend/railway.toml`
5. En Variables del backend cargar:

```env
DATABASE_URL=<url interna o publica de PostgreSQL en Railway>
JWT_SECRET=<un secreto largo>
FRONTEND_URL=https://tu-frontend.vercel.app
GOOGLE_CLIENT_ID=<tu client id de Google>
GEMINI_API_KEY=<opcional>
RESEND_API_KEY=<api key de Resend>
RESEND_FROM=Fitmi <onboarding@resend.dev>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<gmail emisor>
SMTP_PASS=<app password de gmail>
SMTP_FROM=Fitmi <gmail emisor>
ENABLE_ACTIVITY_REMINDERS=true
ACTIVITY_REMINDER_DAYS=1
ACTIVITY_REMINDER_INTERVAL_HOURS=24
ENABLE_PROGRESS_REPORTS=true
PROGRESS_REPORT_DAYS=1
PROGRESS_REPORT_INTERVAL_HOURS=24
```

6. Generar un dominio publico para el backend.

## Frontend en Vercel

1. Crear un proyecto en Vercel desde el mismo repo.
2. Configurar:
   - Root Directory: `Frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. En Environment Variables cargar:

```env
VITE_API_URL=https://tu-backend.up.railway.app/api
VITE_SOCKET_URL=https://tu-backend.up.railway.app
```

4. Cuando Vercel te de la URL final, copiarla en `FRONTEND_URL` del backend en Railway y redeployar backend.

## Importante

- No subir `Backend/.env` al repo.
- Para demo, usar Cloudinary si queres que las fotos persistan despues de cada redeploy. Si no, Railway puede perder archivos locales al redeployar.
- En Google OAuth, agregar la URL de Vercel como origen autorizado.
