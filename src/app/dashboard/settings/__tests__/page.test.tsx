import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from '../page';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        userSettings: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

describe('SettingsPage', () => {
    const mockSession = {
        user: { email: 'test@example.com' },
    };

    const mockSettings = {
        theme: 'system',
        showLabels: true,
        animateTransitions: true,
        defaultLayout: 'force',
        syncNotifications: true,
        weeklyDigest: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
        (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);
    });

    it('renders settings sections', async () => {
        render(await SettingsPage());

        expect(screen.getByText('Appearance')).toBeInTheDocument();
        expect(screen.getByText('Workspace')).toBeInTheDocument();
        expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('updates theme setting', async () => {
        render(await SettingsPage());

        const themeSelect = screen.getByLabelText('Theme');
        fireEvent.change(themeSelect, { target: { value: 'dark' } });

        await waitFor(() => {
            expect(prisma.userSettings.update).toHaveBeenCalledWith({
                where: { userEmail: 'test@example.com' },
                data: expect.objectContaining({ theme: 'dark' }),
            });
        });
    });

    it('toggles notification settings', async () => {
        render(await SettingsPage());

        const syncToggle = screen.getByRole('switch', { name: /Sync Notifications/i });
        fireEvent.click(syncToggle);

        await waitFor(() => {
            expect(prisma.userSettings.update).toHaveBeenCalledWith({
                where: { userEmail: 'test@example.com' },
                data: expect.objectContaining({ syncNotifications: false }),
            });
        });
    });

    it('shows success message on save', async () => {
        render(await SettingsPage());

        fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'dark' } });

        await waitFor(() => {
            expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
        });
    });

    it('handles save errors', async () => {
        (prisma.userSettings.update as jest.Mock).mockRejectedValue(new Error('Failed to save'));

        render(await SettingsPage());
        fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'dark' } });

        await waitFor(() => {
            expect(screen.getByText('Failed to save settings')).toBeInTheDocument();
        });
    });
}); 