import type { SimulationNodeDatum, Force } from 'd3';

type ForceClusterNode = SimulationNodeDatum & {
    id: string;
    type: string;
    parentId?: string;
};

declare module 'd3' {
    interface ForceClusterFn<T extends ForceClusterNode = ForceClusterNode> extends Force<T, undefined> {
        centers(fn: (d: T) => T | null): this;
        strength(strength: number): this;
    }

    export function forceCluster<T extends ForceClusterNode = ForceClusterNode>(): ForceClusterFn<T>;
}