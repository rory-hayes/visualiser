import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

test.describe('Workspace Sync', () => {
    test.beforeEach(async ({ page }) => {
        // Create test user with Notion connection
        const hashedPassword = await hash('password123', 12);
        const user = await prisma.user.create({
            data: {
                email: 'test@example.com',
                name: 'Test User',
                password: hashedPassword,
                accounts: {
                    create: {
                        type: 'oauth',
                        provider: 'notion',
                        providerAccountId: 'test-notion-id',
                        access_token: 'test-token',
                        token_type: 'bearer',
                    },
                },
                settings: {
                    create: {
                        syncNotifications: true,
                        theme: 'system',
                    },
                },
            },
        });

        // Login
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
    });

    test.afterEach(async () => {
        await prisma.workspace.deleteMany();
        await prisma.user.deleteMany();
    });

    test('initial sync from empty workspace', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Click sync button
        await page.click('button:has-text("Sync Now")');

        // Check for success message
        await expect(page.getByText('Workspace synced successfully')).toBeVisible();
        
        // Verify workspace data is loaded
        await expect(page.getByText(/\d+ Pages/)).toBeVisible();
        await expect(page.getByText(/\d+ Databases/)).toBeVisible();
    });

    test('incremental sync with existing data', async ({ page }) => {
        // Create initial workspace data
        await prisma.workspace.create({
            data: {
                userEmail: 'test@example.com',
                lastSynced: new Date(),
                pages: {
                    create: [
                        { pageId: 'page1', title: 'Test Page', type: 'page' },
                    ],
                },
            },
        });

        await page.goto('/dashboard');
        await page.click('button:has-text("Sync Now")');

        // Verify sync completed
        await expect(page.getByText('Workspace synced successfully')).toBeVisible();
        
        // Check that existing data is preserved/updated
        await expect(page.getByText('Test Page')).toBeVisible();
    });

    test('handles sync errors gracefully', async ({ page }) => {
        // Invalidate token to force sync error
        await prisma.account.update({
            where: { providerAccountId: 'test-notion-id' },
            data: { access_token: 'invalid-token' },
        });

        await page.goto('/dashboard');
        await page.click('button:has-text("Sync Now")');

        // Check for error message
        await expect(page.getByText('Failed to sync workspace')).toBeVisible();
    });

    test('shows sync notification when enabled', async ({ page }) => {
        await page.goto('/dashboard');
        await page.click('button:has-text("Sync Now")');

        // Verify notification appears
        await expect(page.getByText('Workspace synced successfully')).toBeVisible();
        await expect(page.getByText(/Added \d+ pages/)).toBeVisible();
    });

    test('updates last synced timestamp', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Get initial timestamp
        const initialTimestamp = await page.getByText(/Last synced/).textContent();
        
        await page.click('button:has-text("Sync Now")');
        await page.waitForLoadState('networkidle');
        
        // Get updated timestamp
        const updatedTimestamp = await page.getByText(/Last synced/).textContent();
        expect(updatedTimestamp).not.toBe(initialTimestamp);
    });
}); 