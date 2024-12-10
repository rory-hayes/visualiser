import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatabaseList } from '../DatabaseList';

describe('DatabaseList', () => {
    const mockDatabases = [
        {
            id: '1',
            databaseId: 'db1',
            title: 'Tasks',
            parentId: null,
            updatedAt: new Date('2024-01-01'),
        },
        {
            id: '2',
            databaseId: 'db2',
            title: 'Projects',
            parentId: 'page1',
            updatedAt: new Date('2024-01-02'),
        },
    ];

    it('renders list of databases', () => {
        render(<DatabaseList databases={mockDatabases} />);

        expect(screen.getByText('Tasks')).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('renders empty state when no databases', () => {
        render(<DatabaseList databases={[]} />);

        expect(screen.getByText('No databases')).toBeInTheDocument();
        expect(screen.getByText(/Your Notion workspace doesn't have any databases yet/)).toBeInTheDocument();
    });

    it('handles database click', () => {
        const onDatabaseClick = vi.fn();
        render(<DatabaseList databases={mockDatabases} onDatabaseClick={onDatabaseClick} />);

        fireEvent.click(screen.getByText('Tasks'));
        expect(onDatabaseClick).toHaveBeenCalledWith(mockDatabases[0]);
    });

    it('shows update time', () => {
        render(<DatabaseList databases={mockDatabases} />);

        expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(
            <DatabaseList databases={mockDatabases} className="custom-class" />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('adds cursor-pointer class when click handler provided', () => {
        const { container } = render(
            <DatabaseList databases={mockDatabases} onDatabaseClick={() => {}} />
        );

        const cards = container.querySelectorAll('.cursor-pointer');
        expect(cards).toHaveLength(mockDatabases.length);
    });
}); 