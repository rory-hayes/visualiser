import React from 'react';
import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import { FilterProvider } from '@/contexts/FilterContext';
import type { WorkspaceItem } from '@/types/workspace';

function render(
    ui: React.ReactElement,
    {
        initialItems = [] as WorkspaceItem[],
        ...renderOptions
    } = {}
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <FilterProvider initialItems={initialItems}>
                {children}
            </FilterProvider>
        );
    }
    return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';
// Override render method
export { render, screen, fireEvent }; 