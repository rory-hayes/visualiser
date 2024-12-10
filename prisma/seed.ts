import { PrismaClient } from '.prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create test user
    await prisma.user.upsert({
        where: { email: 'roryh1@gmail.com' },
        update: {},
        create: {
            email: 'roryh1@gmail.com',
            name: 'Rory',
            password: await hash('Password1', 12),
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