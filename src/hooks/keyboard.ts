import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';

interface UseKeyboardProps {
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onEnter?: () => void;
    onEscape?: () => void;
}

export function useKeyboard({
    onArrowUp,
    onArrowDown,
    onEnter,
    onEscape,
}: UseKeyboardProps) {
    return useCallback(
        (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    onArrowUp?.();
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    onArrowDown?.();
                    break;
                case 'Enter':
                    event.preventDefault();
                    onEnter?.();
                    break;
                case 'Escape':
                    event.preventDefault();
                    onEscape?.();
                    break;
            }
        },
        [onArrowUp, onArrowDown, onEnter, onEscape]
    );
} 