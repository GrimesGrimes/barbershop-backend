import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create owner account
    const ownerPassword = await bcrypt.hash('owner123', 10);
    const owner = await prisma.user.upsert({
        where: { phone: '+573001234567' },
        update: {},
        create: {
            fullName: 'Juan Pérez',
            email: 'juan@barberia.com',
            phone: '+573001234567',
            username: 'barbero_juan',
            passwordHash: ownerPassword,
            role: UserRole.OWNER,
            phoneVerified: true
        }
    });
    console.log('✅ Owner created:', owner.username);

    // Create barbershop for owner
    const barbershop = await prisma.barbershop.upsert({
        where: { ownerId: owner.id },
        update: {},
        create: {
            ownerId: owner.id,
            name: 'Barbería El Clásico',
            phone: '+573001234567',
            address: 'Calle 45 #23-10',
            city: 'Lima',
            currency: 'PEN',
            bookingPolicy: 'Las reservas pueden cancelarse hasta 2 horas antes sin cargo.',
            timeZone: 'America/Lima'
        }
    });
    console.log('✅ Barbershop created:', barbershop.name);

    // Create sample client
    const clientPassword = await bcrypt.hash('client123', 10);
    const client = await prisma.user.upsert({
        where: { phone: '+573009876543' },
        update: {},
        create: {
            fullName: 'Carlos Ramírez',
            email: 'carlos@example.com',
            phone: '+573009876543',
            username: 'carlos_r',
            passwordHash: clientPassword,
            role: UserRole.CLIENT,
            phoneVerified: true,
            emailVerified: true
        }
    });
    console.log('✅ Client created:', client.username);

    // Create services - using findFirst + create instead of upsert
    // Create services - using findFirst + create instead of upsert
    const services = [
        {
            name: 'Corte clásico',
            description: 'Corte tradicional con tijera y máquina',
            durationMin: 35,
            price: 10
        },
        {
            name: 'Moderno degradado',
            description: 'Fade o degradado con navaja y detalles',
            durationMin: 35,
            price: 15
        }
    ];

    for (const service of services) {
        const existing = await prisma.service.findFirst({
            where: { name: service.name }
        });

        if (!existing) {
            await prisma.service.create({
                data: service
            });
        }
    }
    console.log('✅ Services created');

    // Create owner schedule (Monday to Saturday)
    const schedules = [
        { weekday: 1, startTime: '09:00', endTime: '18:00' }, // Monday
        { weekday: 2, startTime: '09:00', endTime: '18:00' }, // Tuesday
        { weekday: 3, startTime: '09:00', endTime: '18:00' }, // Wednesday
        { weekday: 4, startTime: '09:00', endTime: '18:00' }, // Thursday
        { weekday: 5, startTime: '09:00', endTime: '18:00' }, // Friday
        { weekday: 6, startTime: '09:00', endTime: '14:00' }  // Saturday (half day)
    ];

    for (const schedule of schedules) {
        await prisma.ownerSchedule.upsert({
            where: { weekday: schedule.weekday },
            update: {},
            create: {
                ...schedule,
                active: true
            }
        });
    }
    console.log('✅ Owner schedules created');

    console.log('🎉 Seeding completed!');
    console.log('\n📝 Test credentials:');
    console.log('Owner - Phone: +573001234567, Password: owner123');
    console.log('Client - Phone: +573009876543, Password: client123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
