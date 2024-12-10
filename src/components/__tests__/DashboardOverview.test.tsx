import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardOverview } from '../DashboardOverview';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync';

vi.mock('@/hooks/useWorkspace');
vi.mock('@/hooks/useWorkspaceSync');

describe('DashboardOverview', () => {
    beforeEach(() => {
        (useWorkspace as any).mockReturnValue({
            data: {
                pages: [{ id: '1', title: 'Page 1' }],
                databases: [{ id: '1', title: 'Database 1' }],
                lastSynced: new Date().toISOString(),
            },
            isLoading: false,
            error: null,
        });

        (useWorkspaceSync as any).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        });
    });

    it('renders workspace stats correctly', () => {
        render(<DashboardOverview />);
        
        expect(screen.getByText('1')).toBeInTheDocument(); // Total Pages
        expect(screen.getByText('1')).toBeInTheDocument(); // Total Databases
        expect(screen.getByText(/ago$/)).toBeInTheDocument(); // Last Synced
    });

    it('shows loading state', () => {
        (useWorkspace as any).mockReturnValue({
            isLoading: true,
        });

        render(<DashboardOverview />);
        expect(screen.getByText('Loading workspace data...')).toBeInTheDocument();
    });

    it('shows error state', () => {
        (useWorkspace as any).mockReturnValue({
            error: new Error('Failed to load'),
            isLoading: false,
        });

        render(<DashboardOverview />);
        expect(screen.getByText('Failed to load workspace data')).toBeInTheDocument();
    });

    it('triggers sync when button is clicked', () => {
        const mockSync = vi.fn();
        (useWorkspaceSync as any).mockReturnValue({
            mutate: mockSync,
            isPending: false,
        });

        render(<DashboardOverview />);
        fireEvent.click(screen.getByText('Sync Now'));
        expect(mockSync).toHaveBeenCalled();
    });
}); 