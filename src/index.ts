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


// Normalize URLs by removing trailing slashes
const normalizeOrigin = (u: string) => u.trim().replace(/\/+$/, "");

// Configure allowed origins
const allowlist = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
]
  .flatMap((u) => (u ? u.split(",") : []))
  .map(normalizeOrigin)
  .filter(Boolean);

// CORS configuration with origin normalization
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const o = normalizeOrigin(origin);

    // Always allow localhost for development
    if (o.startsWith("http://localhost:")) return callback(null, true);

    if (allowlist.includes(o)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Origin not allowed: ${o}`);
    return callback(null, false);
  },
  // JWT is used in headers, not cookies
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
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
