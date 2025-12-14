import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Rutas
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import scheduleRoutes from './modules/schedule/schedule.routes';
import servicesRoutes from './modules/services/services.routes';
import disabledSlotsRoutes from './modules/disabled-slots/disabled-slots.routes';
import statsRoutes from './modules/stats/stats.routes';

// Middleware de errores
import { errorMiddleware } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 3000;


// Middleware - CORS configuration
// FIX: Permite múltiples orígenes para desarrollo (Vite puede usar diferentes puertos)
const allowlist = [
    process.env.FRONTEND_URL,              // e.g. https://frontend-barberia-production.up.railway.app
    process.env.CORS_ORIGIN,               // Soporte legacy
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
].flatMap(u => u ? u.split(',') : []).map(u => u.trim());

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Permitir requests sin origin (como Postman o curl)
        if (!origin) return callback(null, true);

        // En desarrollo, permitir cualquier localhost
        if (origin.startsWith('http://localhost:')) {
            return callback(null, true);
        }

        if (allowlist.includes(origin) || allowlist.includes('*')) {
            return callback(null, true);
        }

        // Bloquear explícitamente si no está en lista
        console.warn(`[CORS] Origin not allowed: ${origin}`);
        return callback(new Error(`CORS bloqueado para origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // JWT en headers, no cookies
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Habilitar preflight para todas las rutas

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/disabled-slots', disabledSlotsRoutes);
app.use('/api/stats', statsRoutes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
