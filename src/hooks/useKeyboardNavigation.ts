import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';

interface KeyboardNavigationOptions {
    itemCount: number;
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    onSelect: () => void;
    onEscape?: () => void;
}

export function useKeyboardNavigation({
    itemCount,
    selectedIndex,
    setSelectedIndex,
    onSelect,
    onEscape,
}: KeyboardNavigationOptions) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setSelectedIndex((selectedIndex + 1) % itemCount);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setSelectedIndex((selectedIndex - 1 + itemCount) % itemCount);
                    break;
                case 'Enter':
                    event.preventDefault();
                    onSelect();
                    break;
                case 'Escape':
                    event.preventDefault();
                    onEscape?.();
                    break;
            }
        },
        [itemCount, selectedIndex, setSelectedIndex, onSelect, onEscape]
    );

    return { handleKeyDown };
} 