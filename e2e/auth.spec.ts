import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

test.describe('Authentication', () => {
    test.beforeEach(async () => {
        // Clean up database before each test
        await prisma.user.deleteMany();
    });

    test('registration flow', async ({ page }) => {
        await page.goto('/register');

        // Fill registration form
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="confirmPassword"]', 'password123');

        // Submit form
        await page.click('button[type="submit"]');

        // Should redirect to Notion connection page
        await expect(page).toHaveURL('/dashboard/connect');
        await expect(page.getByText('Connect your Notion account')).toBeVisible();
    });

    test('login flow', async ({ page }) => {
        // Create test user
        const hashedPassword = await hash('password123', 12);
        await prisma.user.create({
            data: {
                email: 'test@example.com',
                name: 'Test User',
                password: hashedPassword,
            },
        });

        await page.goto('/login');

        // Fill login form
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
    });

    test('protected routes', async ({ page }) => {
        // Try accessing protected routes without auth
        await page.goto('/dashboard');
        await expect(page).toHaveURL('/login');

        await page.goto('/dashboard/settings');
        await expect(page).toHaveURL('/login');
    });

    test('logout flow', async ({ page }) => {
        // Create and login user
        const hashedPassword = await hash('password123', 12);
        await prisma.user.create({
            data: {
                email: 'test@example.com',
                name: 'Test User',
                password: hashedPassword,
            },
        });

        await page.goto('/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Click logout button
        await page.click('button:has-text("Sign out")');

        // Should redirect to login
        await expect(page).toHaveURL('/login');

        // Should not be able to access protected routes
        await page.goto('/dashboard');
        await expect(page).toHaveURL('/login');
    });

    test('invalid credentials', async ({ page }) => {
        await page.goto('/login');

        // Try invalid credentials
        await page.fill('input[name="email"]', 'wrong@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.getByText('Invalid credentials')).toBeVisible();
    });
}); 