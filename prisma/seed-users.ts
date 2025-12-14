
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting user seeding...');

    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('AdminPassword123!', saltRounds);
    const clientPassword = await bcrypt.hash('ClientPassword123!', saltRounds);

    // Create or Update Admin (Owner)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@barberia.com' },
        update: {
            role: UserRole.OWNER,
            emailVerified: true,
            phoneVerified: true,
            passwordHash: adminPassword,
        },
        create: {
            fullName: 'Admin Barber',
            username: 'admin',
            email: 'admin@barberia.com',
            passwordHash: adminPassword,
            role: UserRole.OWNER,
            emailVerified: true,
            phoneVerified: true,
            phone: '999888777', // Dummy phone
        },
    });

    console.log(`✅ Admin user created/updated:`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: AdminPassword123!`);
    console.log(`   Role: ${admin.role}`);

    // Create or Update Client
    const client = await prisma.user.upsert({
        where: { email: 'cliente@barberia.com' },
        update: {
            role: UserRole.CLIENT,
            emailVerified: true,
            phoneVerified: true,
            passwordHash: clientPassword,
        },
        create: {
            fullName: 'Cliente Ejemplo',
            username: 'cliente',
            email: 'cliente@barberia.com',
            passwordHash: clientPassword,
            role: UserRole.CLIENT,
            emailVerified: true,
            phoneVerified: true,
            phone: '999111222', // Dummy phone
        },
    });

    console.log(`✅ Client user created/updated:`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Username: ${client.username}`);
    console.log(`   Password: ClientPassword123!`);
    console.log(`   Role: ${client.role}`);

    // Optional: Create a default Barbershop for the admin if it doesn't exist
    if (admin.role === UserRole.OWNER) {
        const barbershop = await prisma.barbershop.findUnique({
            where: { ownerId: admin.id }
        });

        if (!barbershop) {
            await prisma.barbershop.create({
                data: {
                    ownerId: admin.id,
                    name: "Barbería Principal",
                    address: "Av. Siempre Viva 123",
                    city: "Lima",
                    phone: "999888777",
                    currency: "PEN",
                    timeZone: "America/Lima"
                }
            });
            console.log(`💈 Created default Barbershop for Admin.`);
        } else {
            console.log(`💈 Admin already has a Barbershop.`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
