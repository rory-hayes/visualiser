import { renderHook, act } from '@testing-library/react';
import { useGraphState } from '../useGraphState';

describe('useGraphState', () => {
    it('initializes with default values', () => {
        const { result } = renderHook(() => useGraphState());

        expect(result.current.layout).toBe('force');
        expect(result.current.showLabels).toBe(true);
        expect(result.current.zoomLevel).toBe(1);
        expect(result.current.selectedNode).toBeNull();
    });

    it('accepts custom initial layout', () => {
        const { result } = renderHook(() => useGraphState('tree'));
        expect(result.current.layout).toBe('tree');
    });

    it('handles node selection', () => {
        const { result } = renderHook(() => useGraphState());
        const mockNode = { id: '1', title: 'Test', type: 'page', parentId: null };

        act(() => {
            result.current.selectNode(mockNode);
        });

        expect(result.current.selectedNode).toEqual(mockNode);
    });

    it('toggles labels', () => {
        const { result } = renderHook(() => useGraphState());

        act(() => {
            result.current.toggleLabels();
        });

        expect(result.current.showLabels).toBe(false);

        act(() => {
            result.current.toggleLabels();
        });

        expect(result.current.showLabels).toBe(true);
    });

    it('updates layout', () => {
        const { result } = renderHook(() => useGraphState());

        act(() => {
            result.current.setLayout('radial');
        });

        expect(result.current.layout).toBe('radial');
    });

    it('updates zoom level', () => {
        const { result } = renderHook(() => useGraphState());

        act(() => {
            result.current.setZoomLevel(1.5);
        });

        expect(result.current.zoomLevel).toBe(1.5);
    });

    it('resets view', () => {
        const { result } = renderHook(() => useGraphState());

        // Set some values
        act(() => {
            result.current.selectNode({ id: '1', title: 'Test', type: 'page', parentId: null });
            result.current.setZoomLevel(2);
        });

        // Reset
        act(() => {
            result.current.resetView();
        });

        expect(result.current.selectedNode).toBeNull();
        expect(result.current.zoomLevel).toBe(1);
    });
}); 