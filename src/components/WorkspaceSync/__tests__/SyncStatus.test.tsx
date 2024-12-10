import React from 'react';
import { render, screen } from '@testing-library/react';
import { SyncStatus } from '../SyncStatus';

describe('SyncStatus', () => {
    const mockLastSynced = new Date('2024-01-01T12:00:00Z');

    it('renders different status states correctly', () => {
        const { rerender } = render(<SyncStatus status="idle" />);
        expect(screen.getByText('Ready to sync')).toBeInTheDocument();

        rerender(<SyncStatus status="syncing" />);
        expect(screen.getByText('Syncing...')).toBeInTheDocument();

        rerender(<SyncStatus status="success" />);
        expect(screen.getByText('Synced')).toBeInTheDocument();

        rerender(<SyncStatus status="error" />);
        expect(screen.getByText('Sync failed')).toBeInTheDocument();
    });

    it('shows last synced time when provided', () => {
        render(<SyncStatus status="success" lastSynced={mockLastSynced} />);
        expect(screen.getByText(/12:00:00/)).toBeInTheDocument();
    });

    it('applies correct status colors', () => {
        const { container } = render(<SyncStatus status="success" />);
        const indicator = container.querySelector('div > div');
        expect(indicator).toHaveClass('bg-green-500');
    });

    it('applies animation class when syncing', () => {
        const { container } = render(<SyncStatus status="syncing" />);
        const indicator = container.querySelector('div > div');
        expect(indicator).toHaveClass('animate-pulse');
    });

    it('applies custom className', () => {
        const { container } = render(
            <SyncStatus status="idle" className="custom-class" />
        );
        expect(container.firstChild).toHaveClass('custom-class');
    });
}); 