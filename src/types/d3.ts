import type { SimulationNodeDatum, Force } from 'd3';

declare module 'd3' {
    interface ForceClusterNode extends SimulationNodeDatum {
        id: string;
        type: string;
        parentId?: string;
    }

    interface ForceClusterFn<T extends ForceClusterNode> extends Force<T, undefined> {
        centers(fn: (d: T) => T | null): ForceClusterFn<T>;
        strength(strength: number): ForceClusterFn<T>;
    }

    function forceCluster<T extends ForceClusterNode>(): ForceClusterFn<T>;
} 