/**
 * Time constants for the barbershop booking system
 * 
 * Business rule:
 * - Each service takes 35 minutes of effective work time
 * - Plus 5 minutes of rest/cleanup between services
 * - Total slot duration: 40 minutes
 */

export const SERVICE_DURATION_MIN = 35;   // Effective service time (client in chair)
export const REST_PERIOD_MIN = 5;         // Rest/cleanup time between services
export const SLOT_TOTAL_MIN = 40;         // Total slot duration (35 + 5)

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
}

/**
 * Get current time in Lima timezone (America/Lima, UTC-5)
 * Note: For production, consider using a library like 'luxon' or 'dayjs' with timezone support
 */
export function getNowLima(): Date {
    // For now, using system time
    // TODO: Implement proper timezone handling with luxon/dayjs when deploying
    return new Date();
}

/**
 * Format time to HH:mm string
 */
export function formatTime(date: Date): string {
    return date.toTimeString().substring(0, 5);
}

/**
 * Parse time string "HH:mm" and create a Date object for a specific date
 */
export function parseTimeOnDate(dateStr: string, timeStr: string): Date {
    // dateStr comes as "YYYY-MM-DD" (e.g., "2025-12-05")
    // timeStr comes as "HH:mm"

    if (!dateStr) {
        throw new Error('parseTimeOnDate: dateStr is required');
    }
    if (!timeStr) {
        throw new Error('parseTimeOnDate: timeStr is required');
    }

    const [year, month, day] = dateStr.split('-').map(Number);

    const timeParts = timeStr.split(':').map((p) => parseInt(p, 10));
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;

    // IMPORTANT: use Date(...) with year/month/day/hour/min in **local time**,
    // NOT new Date("YYYY-MM-DDTHH:mm") nor Date.UTC, to avoid timezone shifts
    // Note: month is 0-indexed in Date constructor
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
}
