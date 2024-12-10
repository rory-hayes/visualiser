import type { SimulationNodeDatum, Force } from 'd3';

export interface ForceClusterNode extends SimulationNodeDatum {
    id: string;
    type: string;
    parentId?: string;
}

interface ForceClusterFn<T extends ForceClusterNode = ForceClusterNode> extends Force<T, undefined> {
    centers(fn: (d: T) => T | null): this;
    strength(strength: number): this;
}

declare module 'd3' {
    export function forceCluster<T extends ForceClusterNode = ForceClusterNode>(): ForceClusterFn<T>;
} 