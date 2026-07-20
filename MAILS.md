# Sistema de mails de Fitmi

Este documento explica como funciona el envio de mails en Fitmi: configuracion SMTP, tipos de mails, destinatarios, frecuencia, proteccion contra repetidos y formas de prueba.

## Archivos principales

- `Backend/src/services/mail.service.js`: servicio base de envio con Nodemailer.
- `Backend/src/services/progress-mail.service.js`: logica de reportes de progreso y recordatorios automaticos.
- `Backend/src/controllers/progreso.controller.js`: endpoints manuales relacionados con mails.
- `Backend/src/routes/progreso.routes.js`: rutas HTTP de progreso/mail.
- `Backend/prisma/schema.prisma`: modelo `EmailLog`, usado para registrar envios y evitar duplicados diarios.
- `Backend/.env`: variables de configuracion SMTP y jobs automaticos.

## Configuracion SMTP

El servicio usa Nodemailer. Para enviar mails reales, estas variables deben existir en `Backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<cuenta-gmail>
SMTP_PASS=<app-password-de-gmail>
SMTP_FROM=Fitmi <no-reply@fitmi.local>
```

Si `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` o `SMTP_PASS` faltan, el sistema no envia mails reales. En ese caso `sendMail()` entra en modo desarrollo, imprime el mail en consola con `[mail:dev]` y devuelve `dev: true`.

Con la configuracion actual probada, Gmail acepto envios reales. Una respuesta exitosa de Gmail se ve asi:

```text
250 2.0.0 OK ... - gsmtp
```

## Servicio base: `sendMail`

La funcion `sendMail({ to, subject, text, html })` esta en `Backend/src/services/mail.service.js`.

Comportamiento:

- Arma el remitente desde `SMTP_FROM`, o usa `SMTP_USER` si `SMTP_FROM` no existe.
- Si SMTP esta configurado, envia usando Gmail SMTP.
- Si SMTP no esta configurado, no envia realmente y usa modo desarrollo.
- Devuelve informacion del proveedor, por ejemplo `accepted`, `rejected`, `response` y `messageId`.

## Tipos de mails

### 1. Reporte manual de avance

Endpoint:

```http
POST /api/progreso/enviar-avance-email
```

Funcion principal:

```js
sendProgressReportToProfessionals(usuarioId, dias)
```

Quien lo dispara:

- Un cliente desde la pantalla de progreso, con el boton de enviar avance por email.

Quien recibe:

- Los profesionales vinculados activamente al cliente.
- Si el vinculo es con un entrenador, recibe la parte de entrenamiento.
- Si el vinculo es con un nutricionista, recibe la parte de alimentacion.

Condiciones:

- El usuario debe tener vinculos activos.
- El profesional debe tener email cargado.
- Si no hay profesionales activos, responde error: `No tenés profesionales asignados para enviar el avance`.

Registro:

- Crea registros `EmailLog` con tipo `reporte_avance`.

### 2. Reporte automatico de progreso

Job:

```js
startProgressReportJob()
```

Funcion principal:

```js
sendAutomaticProgressReports(days)
```

Se activa con:

```env
ENABLE_PROGRESS_REPORTS=true
PROGRESS_REPORT_DAYS=1
PROGRESS_REPORT_INTERVAL_HOURS=0.012
```

Con esos valores:

- El backend espera 20 segundos al iniciar.
- Luego ejecuta el job automatico.
- Despues repite cada `PROGRESS_REPORT_INTERVAL_HOURS`.
- `0.012` horas equivale aproximadamente a 43 segundos.
- El reporte incluye actividad de los ultimos `PROGRESS_REPORT_DAYS` dias.

Quien recibe:

- Profesionales vinculados activamente a clientes.
- No se manda a todos los usuarios registrados.
- Se manda al profesional, no al cliente.

Ejemplo:

```text
Cliente Juan -> vinculo activo con Entrenador Pedro
```

El reporte de Juan se envia al mail de Pedro.

Condiciones:

- El cliente debe tener rol `cliente`.
- El cliente debe estar `aprobado`.
- El cliente debe tener al menos un `Vinculo` con `estado = activo`.
- El profesional vinculado debe tener email cargado.

Proteccion contra repetidos:

- Antes de enviar, busca en `EmailLog` si ya existe un registro de tipo `reporte_avance_auto` para ese usuario desde el inicio del dia.
- Si ya existe, no vuelve a enviar ese dia.
- Esto evita que, aunque el intervalo sea de segundos, el mismo usuario genere reportes automaticos repetidos durante el mismo dia.

Registro:

- Por cada envio real de avance se crean logs tipo `reporte_avance`.
- El job automatico tambien crea un log resumen tipo `reporte_avance_auto`.

### 3. Recordatorio automatico de inactividad

Job:

```js
startActivityReminderJob()
```

Funcion principal:

```js
sendInactivityReminders(days)
```

Se activa con:

```env
ENABLE_ACTIVITY_REMINDERS=true
ACTIVITY_REMINDER_DAYS=4
ACTIVITY_REMINDER_INTERVAL_HOURS=24
```

Con esos valores:

- El backend espera 10 segundos al iniciar.
- Luego ejecuta el job automatico.
- Despues repite cada 24 horas.
- Considera inactivo a un cliente si pasaron 4 dias o mas desde su ultima actividad.

Quien recibe:

- Clientes inactivos.
- No se manda a profesionales.
- No se manda a todos los usuarios registrados.

Condiciones:

- El usuario debe tener rol `cliente`.
- El usuario debe estar `aprobado`.
- El usuario debe tener email cargado.
- La ultima actividad registrada debe ser anterior al limite configurado.
- Si el usuario nunca registro actividad, se usa `created_at` como fecha base.

Que cuenta como actividad:

- Ejercicios completados (`EjercicioCompletado`).
- Comidas completadas (`ComidaCompletada`).

Proteccion contra repetidos:

- Antes de enviar, busca en `EmailLog` si ya existe un registro de tipo `recordatorio_inactividad` para ese usuario desde el inicio del dia.
- Si ya existe, no vuelve a enviar ese dia.

Registro:

- Crea registros `EmailLog` con tipo `recordatorio_inactividad`.

### 4. Recordatorio manual de progreso

Endpoint:

```http
POST /api/progreso/recordatorio-progreso
```

Quien lo dispara:

- Un profesional (`entrenador` o `nutricionista`) desde la interfaz.

Quien recibe:

- El cliente vinculado al profesional.

Condiciones:

- El usuario autenticado debe ser `entrenador` o `nutricionista`.
- Debe existir un vinculo activo entre profesional y cliente.
- El cliente debe tener email cargado.

Registro:

- Crea registros `EmailLog` con tipo `recordatorio_progreso`.

## Arranque de jobs automaticos

Los jobs se inicializan en `Backend/src/app.js` dentro de `app.listen()`:

```js
startActivityReminderJob()
startProgressReportJob()
```

Esto significa que los automaticos solo corren si:

- El backend esta levantado.
- Las variables `ENABLE_ACTIVITY_REMINDERS` y/o `ENABLE_PROGRESS_REPORTS` estan en `true`.
- El backend fue reiniciado despues de cambiar el `.env`.

Si se cambia el `.env` mientras el backend ya esta corriendo, hay que reiniciar el backend para que tome los nuevos valores.

## Variables de frecuencia

### Recordatorios de inactividad

```env
ACTIVITY_REMINDER_DAYS=4
ACTIVITY_REMINDER_INTERVAL_HOURS=24
```

- `ACTIVITY_REMINDER_DAYS`: cantidad de dias sin actividad para considerar inactivo a un cliente.
- `ACTIVITY_REMINDER_INTERVAL_HOURS`: cada cuantas horas se revisa si hay clientes inactivos.

### Reportes automaticos de progreso

```env
PROGRESS_REPORT_DAYS=1
PROGRESS_REPORT_INTERVAL_HOURS=0.012
```

- `PROGRESS_REPORT_DAYS`: cantidad de dias de actividad que incluye el reporte.
- `PROGRESS_REPORT_INTERVAL_HOURS`: cada cuantas horas se ejecuta la revision.

Nota: aunque el intervalo sea corto, `EmailLog` evita repetir reportes automaticos del mismo usuario mas de una vez por dia.

## `EmailLog`

El modelo `EmailLog` guarda informacion minima de los envios:

```prisma
model EmailLog {
  id           Int      @id @default(autoincrement())
  tipo         String
  usuario_id   Int?
  destinatario String
  asunto       String
  created_at   DateTime @default(now())
}
```

Usos principales:

- Auditoria basica de mails enviados.
- Evitar duplicados diarios en jobs automaticos.

Tipos usados:

- `reporte_avance`
- `reporte_avance_auto`
- `recordatorio_inactividad`
- `recordatorio_progreso`

## Como probar SMTP real

Desde `Backend`, se puede enviar un mail simple usando el servicio real:

```bash
node --input-type=module -e 'import "dotenv/config"; import { sendMail } from "./src/services/mail.service.js"; const result = await sendMail({ to: process.env.SMTP_USER, subject: "Prueba Fitmi SMTP", text: "Mail de prueba desde Fitmi.", html: "<p>Mail de prueba desde Fitmi.</p>" }); console.log(result);'
```

Resultado esperado si Gmail acepta el mail:

```text
accepted: [ "<destinatario>" ]
rejected: []
response: "250 2.0.0 OK ..."
```

Si aparece `dev: true`, significa que no se envio por SMTP real y falta configurar variables SMTP.

## Como probar sin disparar a todos

Antes de activar jobs automaticos globales, conviene hacer una prueba controlada:

- Elegir un destinatario real conocido.
- Enviar un mail manual con `sendMail()`.
- Confirmar que llega a la casilla.
- Revisar que Gmail responde `250 2.0.0 OK`.

Esto evita mandar mails a usuarios de prueba o direcciones invalidas guardadas en la base.

## Riesgos y recomendaciones

- Revisar la base antes de activar automaticos, porque pueden existir emails de prueba como `test@fitmi.com`, `tr@tr` o `nt@nt`.
- No dejar intervalos muy bajos en produccion. Para reportes automaticos, `0.012` horas sirve para probar, pero en produccion conviene usar un valor mayor, por ejemplo `24`.
- No commitear secretos reales en `.env`.
- Usar una App Password de Gmail, no la contrasena normal de la cuenta.
- Reiniciar el backend despues de cambiar cualquier variable de mail.
- Revisar `EmailLog` si un mail no se vuelve a mandar: puede estar bloqueado porque ya se envio ese tipo de mail durante el dia.

## Resumen rapido

- Los mails reales salen por Gmail SMTP si SMTP esta configurado.
- Los recordatorios de inactividad se mandan a clientes inactivos.
- Los reportes de progreso se mandan a profesionales vinculados, no al cliente.
- Los jobs automaticos solo corren con el backend levantado y variables `ENABLE_*` en `true`.
- `EmailLog` evita repetir automaticos para el mismo usuario mas de una vez por dia.
