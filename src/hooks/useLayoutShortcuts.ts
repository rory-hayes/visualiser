import { useEffect } from 'react';
import type { LayoutType } from '@/components/workspace/LayoutControls';

export function useLayoutShortcuts(
    currentLayout: LayoutType,
    onLayoutChange: (layout: LayoutType) => void
) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey) {
                switch (e.key) {
                    case '1':
                        onLayoutChange('force');
                        break;
                    case '2':
                        onLayoutChange('radial');
                        break;
                    case '3':
                        onLayoutChange('hierarchical');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onLayoutChange]);
} 