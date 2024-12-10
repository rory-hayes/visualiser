import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';

test.describe('Workspace', () => {
    test.beforeEach(async ({ page }) => {
        // Create test user and workspace
        const user = await prisma.user.create({
            data: {
                email: 'test@example.com',
                name: 'Test User',
                settings: {
                    create: {
                        showLabels: true,
                        theme: 'system',
                    },
                },
            },
        });

        await prisma.workspace.create({
            data: {
                userEmail: user.email,
                lastSynced: new Date(),
                pages: {
                    create: [
                        {
                            pageId: 'test-page-1',
                            title: 'Test Page 1',
                            type: 'page',
                        },
                        {
                            pageId: 'test-page-2',
                            title: 'Test Page 2',
                            type: 'page',
                            parentId: 'test-page-1',
                        },
                    ],
                },
                databases: {
                    create: [
                        {
                            databaseId: 'test-db-1',
                            title: 'Test Database',
                            parentId: 'test-page-1',
                        },
                    ],
                },
            },
        });

        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.click('button[type="submit"]');
    });

    test.afterEach(async () => {
        await prisma.workspace.deleteMany();
        await prisma.user.deleteMany();
    });

    test('should display workspace overview', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Check stats
        await expect(page.getByText('Total Pages')).toBeVisible();
        await expect(page.getByText('2')).toBeVisible(); // Total pages
        await expect(page.getByText('Total Databases')).toBeVisible();
        await expect(page.getByText('1')).toBeVisible(); // Total databases

        // Check graph
        await expect(page.getByText('Workspace Graph')).toBeVisible();
        await expect(page.getByText('Test Page 1')).toBeVisible();
        await expect(page.getByText('Test Page 2')).toBeVisible();
        await expect(page.getByText('Test Database')).toBeVisible();
    });

    test('should sync workspace', async ({ page }) => {
        await page.goto('/dashboard');
        
        const syncButton = page.getByText('Sync Now');
        await expect(syncButton).toBeVisible();
        
        await syncButton.click();
        
        // Check for sync success message
        await expect(page.getByText('Workspace synced successfully')).toBeVisible();
    });

    test('should filter and sort pages', async ({ page }) => {
        await page.goto('/dashboard/pages');
        
        // Test search
        await page.fill('input[type="search"]', 'Test Page 1');
        await expect(page.getByText('Test Page 1')).toBeVisible();
        await expect(page.getByText('Test Page 2')).not.toBeVisible();

        // Test sorting
        await page.selectOption('select[aria-label="Sort by"]', 'title-asc');
        const titles = await page.$$eval('.page-title', els => els.map(el => el.textContent));
        expect(titles).toEqual(['Test Page 1', 'Test Page 2']);
    });
}); 