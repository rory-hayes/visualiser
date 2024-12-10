import { PrismaClient } from '.prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create a test user
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test User',
            password: await hash('password123', 12),
        },
    });

    // Create user settings
    await prisma.userSettings.upsert({
        where: { userEmail: 'test@example.com' },
        update: {},
        create: {
            userEmail: 'test@example.com',
            showLabels: true,
            animateTransitions: true,
            defaultLayout: 'force',
            theme: 'system',
            emailNotifications: true,
            syncNotifications: true,
            weeklyDigest: false,
        },
    });

    // Create workspace
    await prisma.workspace.upsert({
        where: { userEmail: 'test@example.com' },
        update: {},
        create: {
            userEmail: 'test@example.com',
            lastSynced: new Date(),
            data: {},
        },
    });

    console.log('Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 