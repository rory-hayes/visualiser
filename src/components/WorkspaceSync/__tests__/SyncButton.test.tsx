import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncButton } from '../SyncButton';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';

vi.mock('@/hooks/useWorkspaceSync', () => ({
    useWorkspaceSync: vi.fn(),
}));

describe('SyncButton', () => {
    const mockLastSynced = new Date('2024-01-01T12:00:00Z');
    const mockSync = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useWorkspaceSync as jest.Mock).mockReturnValue({
            mutate: mockSync,
            isPending: false,
        });
    });

    it('renders sync button with last synced time', () => {
        render(<SyncButton lastSynced={mockLastSynced} />);

        expect(screen.getByText('Sync Now')).toBeInTheDocument();
        expect(screen.getByText(/Last synced/)).toBeInTheDocument();
    });

    it('handles sync click', () => {
        render(<SyncButton lastSynced={mockLastSynced} />);

        fireEvent.click(screen.getByText('Sync Now'));
        expect(mockSync).toHaveBeenCalled();
    });

    it('shows loading state', () => {
        (useWorkspaceSync as jest.Mock).mockReturnValue({
            mutate: mockSync,
            isPending: true,
        });

        render(<SyncButton lastSynced={mockLastSynced} />);

        const icon = screen.getByTestId('sync-icon');
        expect(icon).toHaveClass('animate-spin');
    });

    it('applies custom className', () => {
        const { container } = render(
            <SyncButton lastSynced={mockLastSynced} className="custom-class" />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });
}); 