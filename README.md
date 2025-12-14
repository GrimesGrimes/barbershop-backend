# Barbershop Booking Backend

Backend API para sistema de reservas de barbería con un solo barbero/dueño.

## Stack Tecnológico

- **Node.js 20+**
- **TypeScript**
- **Express** - Framework HTTP
- **Prisma** - ORM
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **Zod** - Validación de esquemas

## Características Principales

### Sistema de Autenticación
- Registro de clientes con validación de correo electrónico
- Login con `phone` o `username`
- Verificación por email con códigos de 6 dígitos
- Recuperación de contraseña por email
- Tokens JWT con expiración configurable

### Sistema de Reservas
- Slots de **40 minutos** (35 min atención + 5 min descanso)
- Cálculo automático de horarios disponibles
- Validación de conflictos y horarios pasados
- Filtrado por horario del barbero
- Soporte para múltiples servicios

### Gestión del Barbero (Owner)
- Horario semanal configurable por día
- Bloqueo de horarios específicos (DisabledSlots)
- Vista de reservas por fecha
- Control total sobre disponibilidad

## Instalación

### Prerrequisitos
- Node.js 20+
- PostgreSQL 14+
- npm o pnpm

### Pasos

1. **Clonar e instalar dependencias**
\`\`\`bash
cd "nuevo proyecto 2"
npm install
\`\`\`

2. **Configurar base de datos**

Crear base de datos PostgreSQL:
\`\`\`sql
CREATE DATABASE barbershop_db;
\`\`\`

3. **Configurar variables de entorno**

Copiar `.env.example` y editar los valores:
\`\`\`bash
cp .env.example .env
\`\`\`

Editar `.env` con tus credenciales de PostgreSQL y configuración de email:
\`\`\`env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/barbershop_db?schema=public"
JWT_SECRET=tu-secreto-muy-largo-y-aleatorio

# Configuración de Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicación
EMAIL_FROM=tu-email@gmail.com
\`\`\`

**Nota sobre Gmail:**
- Si usas Gmail, debes generar una "Contraseña de Aplicación" en tu cuenta de Google
- Ve a: Cuenta de Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones
- No uses tu contraseña normal de Gmail

4. **Ejecutar migraciones de Prisma**
\`\`\`bash
npx prisma generate
npx prisma migrate dev --name init
\`\`\`

5. **Poblar base de datos (seed)**
\`\`\`bash
npm run prisma:seed
\`\`\`

Esto creará:
- Cuenta de barbero: `+573001234567` / `owner123`
- Cuenta de cliente: `+573009876543` / `client123`
- 3 servicios de ejemplo
- Horario semanal (Lun-Vie 9-18, Sáb 9-14)

6. **Iniciar servidor**
\`\`\`bash
npm run dev
\`\`\`

El servidor estará disponible en `http://localhost:3000`

## Endpoints API

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar nuevo cliente |
| POST | `/auth/login` | Login (phone o username) |
| POST | `/auth/verify-phone/request` | Solicitar código de verificación |
| POST | `/auth/verify-phone/confirm` | Confirmar código de verificación |
| POST | `/auth/password-reset/request` | Solicitar reset de contraseña |
| POST | `/auth/password-reset/confirm` | Confirmar reset con código |

### Usuarios (`/api/users`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/users/me` | ✅ | Obtener perfil |
| PATCH | `/users/me` | ✅ | Actualizar perfil |

### Reservas (`/api/bookings`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/bookings/available-slots?date=YYYY-MM-DD` | ❌ | Slots disponibles |
| POST | `/bookings` | ✅ | Crear reserva |
| GET | `/bookings/me` | ✅ | Mis reservas |

### Horarios Owner (`/api/schedule`)

| Método | Endpoint | Auth | Role | Descripción |
|--------|----------|------|------|-------------|
| GET | `/schedule/bookings?date=YYYY-MM-DD` | ✅ | OWNER | Reservas del día |
| POST | `/schedule/disabled-slots` | ✅ | OWNER | Bloquear horario |
| GET | `/schedule/disabled-slots` | ✅ | OWNER | Ver bloqueos |
| DELETE | `/schedule/disabled-slots/:id` | ✅ | OWNER | Eliminar bloqueo |
| PUT | `/schedule/owner-schedule` | ✅ | OWNER | Actualizar horario semanal |
| GET | `/schedule/owner-schedule` | ✅ | OWNER | Ver horario semanal |

## Ejemplos de Uso

### Registro de Cliente
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "fullName": "María García",
    "phone": "+573001112222",
    "username": "maria_g",
    "password": "password123"
  }'
\`\`\`

### Login
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "credential": "+573001112222",
    "password": "password123"
  }'
\`\`\`

### Ver Slots Disponibles
\`\`\`bash
curl http://localhost:3000/api/bookings/available-slots?date=2025-12-05
\`\`\`

### Crear Reserva
\`\`\`bash
curl -X POST http://localhost:3000/api/bookings \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer TU_TOKEN" \\
  -d '{
    "serviceId": "SERVICE_ID",
    "startTime": "2025-12-05T10:00:00.000Z",
    "notes": "Corte de cabello corto"
  }'
\`\`\`

## Estructura del Proyecto

\`\`\`
src/
├── index.ts                 # Servidor Express principal
├── libs/
│   └── mailer.ts           # Configuración de nodemailer
├── middleware/
│   ├── auth.middleware.ts   # JWT y roles
│   ├── error.middleware.ts  # Manejo global de errores
│   └── validation.middleware.ts
├── utils/
│   ├── errors.ts           # Clases de error custom
│   └── response.ts         # Helpers de respuesta
└── modules/
    ├── auth/               # Autenticación
    │   ├── auth.schemas.ts
    │   ├── auth.repository.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   └── auth.routes.ts
    ├── notifications/      # Servicios de notificación
    │   └── email.service.ts
    ├── users/              # Usuarios
    ├── bookings/           # Reservas
    └── schedule/           # Horarios del owner
\`\`\`

## Scripts Disponibles

\`\`\`bash
npm run dev           # Servidor desarrollo (hot reload)
npm run build         # Compilar TypeScript
npm start             # Servidor producción
npm run prisma:generate    # Generar Prisma Client
npm run prisma:migrate     # Ejecutar migraciones
npm run prisma:studio      # Abrir Prisma Studio
npm run prisma:seed        # Poblar base de datos
\`\`\`

## Modelo de Datos

### User
- `id`, `fullName`, `phone`, `username`, `passwordHash`
- `role`: CLIENT | OWNER
- `phoneVerified`: boolean

### Booking
- `id`, `clientId`, `serviceId`
- `startTime`, `endTime`
- `status`: PENDING | CONFIRMED | CANCELLED | COMPLETED

### OwnerSchedule
- `weekday` (0-6): Día de la semana
- `startTime`, `endTime`: Formato "HH:mm"
- `active`: boolean

### DisabledSlot
- `startTime`, `endTime`: Fechas completas
- `reason`: Opcional

### Service
- `name`, `description`, `durationMin`, `price`

## Lógica de Slots Disponibles

El cálculo de slots disponibles considera:

1. **Horario base**: `OwnerSchedule` por día de la semana
2. **Duración**: 35 min servicio + 5 min descanso = 40 min total
3. **Filtros aplicados**:
   - ❌ Slots en el pasado
   - ❌ Slots ya reservados
   - ❌ Slots bloqueados (DisabledSlot)
   - ❌ Fuera del horario del barbero

## Desarrollo

### Verificación por Email (Development)
En desarrollo, asegúrate de configurar correctamente las variables de entorno de email.
Los códigos también se imprimen en la consola para debugging:
\`\`\`
[MAILER] Email enviado: <message-id>
\`\`\`

### Producción
Para producción, asegúrate de:
- Usar un servicio SMTP confiable (SendGrid, Mailgun, AWS SES, etc.)
- Configurar correctamente el dominio de envío
- Implementar rate limiting para evitar spam

## Licencia

ISC
#   b a r b e r s h o p - b a c k e n d  
 