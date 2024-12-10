import { useState, useCallback } from 'react';
import { Node } from '@/utils/graphLayout';

export type LayoutType = 'force' | 'tree' | 'radial';

interface GraphState {
    selectedNode: Node | null;
    layout: LayoutType;
    showLabels: boolean;
    zoomLevel: number;
}

export function useGraphState(initialLayout: LayoutType = 'force') {
    const [state, setState] = useState<GraphState>({
        selectedNode: null,
        layout: initialLayout,
        showLabels: true,
        zoomLevel: 1,
    });

    const selectNode = useCallback((node: Node | null) => {
        setState(prev => ({ ...prev, selectedNode: node }));
    }, []);

    const setLayout = useCallback((layout: LayoutType) => {
        setState(prev => ({ ...prev, layout }));
    }, []);

    const toggleLabels = useCallback(() => {
        setState(prev => ({ ...prev, showLabels: !prev.showLabels }));
    }, []);

    const setZoomLevel = useCallback((level: number) => {
        setState(prev => ({ ...prev, zoomLevel: level }));
    }, []);

    const resetView = useCallback(() => {
        setState(prev => ({
            ...prev,
            selectedNode: null,
            zoomLevel: 1,
        }));
    }, []);

    return {
        ...state,
        selectNode,
        setLayout,
        toggleLabels,
        setZoomLevel,
        resetView,
    };
} 