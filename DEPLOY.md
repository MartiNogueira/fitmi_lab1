# Deploy Fitmi

## Backend + base de datos en Render

1. Crear una base PostgreSQL en Render.
2. Crear un Web Service desde el repo de GitHub.
3. Configurar el backend:
   - Root Directory: `Backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
4. En Environment Variables del backend cargar:

```env
DATABASE_URL=<internal database url de Render>
JWT_SECRET=<un secreto largo>
FRONTEND_URL=https://tu-frontend.onrender.com
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

## Frontend en Render

1. Crear un Static Site desde el mismo repo.
2. Configurar:
   - Root Directory: `Frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
3. En Environment Variables del frontend cargar:

```env
VITE_API_URL=https://tu-backend.onrender.com/api
VITE_SOCKET_URL=https://tu-backend.onrender.com
```

4. Cuando tengas la URL final del frontend, copiarla en `FRONTEND_URL` del backend y redeployar backend.

## Importante

- No subir `Backend/.env` al repo.
- Para Gmail en deploy necesitás una App Password, no la contraseña normal de Gmail.
- Para demo, usar Cloudinary si queres que las fotos persistan despues de cada redeploy. Si no, Render puede perder archivos locales al redeployar.
- En Google OAuth, agregar la URL de Render como origen autorizado.
