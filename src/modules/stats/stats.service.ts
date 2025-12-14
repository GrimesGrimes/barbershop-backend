import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface StatsQuery {
    from: Date;
    to: Date;
}

export class StatsService {
    async getOwnerStats({ from, to }: StatsQuery) {
        // Asegurar rango completo de fechas
        const startOfDay = new Date(from);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Obtener todas las reservas del rango
        const bookings = await prisma.booking.findMany({
            where: {
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                service: true,
            },
        });

        // 2. Calcular Resumen General
        const summary = {
            totalBookings: bookings.length,
            completedBookings: bookings.filter((b) => b.status === BookingStatus.COMPLETED).length,
            pendingBookings: bookings.filter((b) => b.status === BookingStatus.PENDING).length,
            revenue: bookings
                .filter((b) => b.status === BookingStatus.COMPLETED)
                .reduce((sum, b) => sum + (b.service.price || 0), 0),
        };

        // 3. Calcular Stats de Hoy
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const todayBookings = await prisma.booking.findMany({
            where: {
                startTime: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
            include: {
                service: true,
                client: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        });

        const todayStats = {
            date: now.toISOString().split('T')[0],
            bookings: todayBookings.length,
            completed: todayBookings.filter((b) => b.status === BookingStatus.COMPLETED).length,
            revenue: todayBookings
                .filter((b) => b.status === BookingStatus.COMPLETED)
                .reduce((sum, b) => sum + (b.service.price || 0), 0),
            nextBookings: todayBookings
                .filter((b) => b.startTime >= now && b.status !== BookingStatus.CANCELLED)
                .slice(0, 5), // Próximas 5
        };

        // 4. Ingresos por día (Gráfico Línea)
        const revenueMap = new Map<string, number>();

        bookings
            .filter((b) => b.status === BookingStatus.COMPLETED)
            .forEach((b) => {
                const dateKey = b.startTime.toISOString().split('T')[0];
                const current = revenueMap.get(dateKey) || 0;
                revenueMap.set(dateKey, current + (b.service.price || 0));
            });

        const revenueByDay = Array.from(revenueMap.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 5. Servicios más pedidos (Gráfico Barras)
        const serviceMap = new Map<string, { count: number; revenue: number }>();

        bookings
            .filter((b) => b.status === BookingStatus.COMPLETED)
            .forEach((b) => {
                const name = b.service.name;
                const current = serviceMap.get(name) || { count: 0, revenue: 0 };
                serviceMap.set(name, {
                    count: current.count + 1,
                    revenue: current.revenue + (b.service.price || 0),
                });
            });

        const bookingsByService = Array.from(serviceMap.entries())
            .map(([serviceName, stats]) => ({
                serviceName,
                count: stats.count,
                revenue: stats.revenue,
            }))
            .sort((a, b) => b.count - a.count) // Ordenar por popularidad
            .slice(0, 5); // Top 5

        return {
            summary,
            today: todayStats,
            revenueByDay,
            bookingsByService,
        };
    }
}

export const statsService = new StatsService();
