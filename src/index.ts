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

// Middleware - CORS configuration (robusto)
const normalizeOrigin = (u: string) => u.trim().replace(/\/$/, '');

const parseOrigins = (val?: string) =>
  (val ? val.split(',') : [])
    .map(s => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

const allowlist = new Set<string>([
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ORIGIN),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
].map(normalizeOrigin));

// Si NO configuraste allowlist en prod, no rompas la app
const allowAll = allowlist.size === 0 || allowlist.has('*');

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const o = normalizeOrigin(origin);

    if (allowAll) return callback(null, true);

    // En desarrollo permitir localhost
    if (process.env.NODE_ENV !== 'production' && o.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    if (allowlist.has(o)) return callback(null, true);

    console.warn(`[CORS] Origin not allowed: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // JWT en headers (tu caso)
};

// Enable CORS with the configured options
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable preflight for all routes

// Parse JSON bodies
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
// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful Shutdown (evita errores npm SIGTERM en logs)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Closing server...');
  server.close(() => {
    console.log('✅ Server closed. Process terminated.');
    process.exit(0);
  });
});

export default app;
