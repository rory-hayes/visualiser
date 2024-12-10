import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create test user
    const hashedPassword = await hash('password123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test User',
            password: hashedPassword,
            settings: {
                create: {
                    showLabels: true,
                    animateTransitions: true,
                    defaultLayout: 'force',
                    theme: 'system',
                    emailNotifications: true,
                    syncNotifications: true,
                    weeklyDigest: false,
                },
            },
        },
    });

    // Create test workspace
    const workspace = await prisma.workspace.upsert({
        where: { userEmail: user.email },
        update: {},
        create: {
            userEmail: user.email,
            lastSynced: new Date(),
            data: {},
            pages: {
                create: [
                    {
                        pageId: 'page1',
                        title: 'Getting Started',
                        type: 'page',
                        parentId: null,
                    },
                    {
                        pageId: 'page2',
                        title: 'Project Overview',
                        type: 'page',
                        parentId: 'page1',
                    },
                ],
            },
            databases: {
                create: [
                    {
                        databaseId: 'db1',
                        title: 'Tasks',
                        parentId: 'page1',
                    },
                    {
                        databaseId: 'db2',
                        title: 'Projects',
                        parentId: null,
                    },
                ],
            },
        },
    });

    console.log({ user, workspace });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 