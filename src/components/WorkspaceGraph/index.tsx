'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { GraphNode } from './GraphNode';
import { GraphLink } from './GraphLink';
import { MiniMap } from './MiniMap';
import { useGraphState } from '@/hooks/useGraphState';
import { createGraphData, createForceSimulation, createTreeLayout, createRadialLayout } from '@/utils/graphLayout';
import type { Node } from '@/utils/graphLayout';

interface WorkspaceGraphProps {
    data: {
        nodes: Node[];
    };
    onNodeClick?: (node: Node) => void;
}

export function WorkspaceGraph({ data, onNodeClick }: WorkspaceGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const { theme } = useTheme();
    const {
        layout,
        showLabels,
        selectedNode,
        zoomLevel,
        setLayout,
        toggleLabels,
        selectNode,
        setZoomLevel,
        resetView,
    } = useGraphState();

    const graphData = createGraphData(data.nodes);

    useEffect(() => {
        if (!svgRef.current) return;

        const updateDimensions = () => {
            const { width, height } = svgRef.current!.getBoundingClientRect();
            setDimensions({ width, height });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        if (!dimensions.width || !dimensions.height) return;

        let layoutFunction;
        switch (layout) {
            case 'tree':
                layoutFunction = createTreeLayout;
                break;
            case 'radial':
                layoutFunction = createRadialLayout;
                break;
            default:
                layoutFunction = createForceSimulation;
        }

        const simulation = layoutFunction(graphData, dimensions.width, dimensions.height);
        return () => simulation.stop?.();
    }, [graphData, dimensions, layout]);

    const handleNodeClick = (node: Node) => {
        selectNode(node);
        onNodeClick?.(node);
    };

    return (
        <div className="relative w-full h-full">
            <svg
                ref={svgRef}
                className="w-full h-full"
                style={{ background: 'transparent' }}
            >
                <g transform={`scale(${zoomLevel})`}>
                    {graphData.links.map((link, i) => (
                        <GraphLink
                            key={i}
                            sourceX={link.source.x}
                            sourceY={link.source.y}
                            targetX={link.target.x}
                            targetY={link.target.y}
                        />
                    ))}
                    {graphData.nodes.map((node) => (
                        <GraphNode
                            key={node.id}
                            node={node}
                            x={node.x}
                            y={node.y}
                            selected={selectedNode?.id === node.id}
                            showLabel={showLabels}
                            onClick={handleNodeClick}
                        />
                    ))}
                </g>
            </svg>
            <MiniMap
                nodes={graphData.nodes}
                links={graphData.links}
                width={200}
                height={150}
                viewBox={{
                    x: -dimensions.width / 2,
                    y: -dimensions.height / 2,
                    width: dimensions.width,
                    height: dimensions.height,
                }}
                onViewBoxChange={(viewBox) => {
                    // Implement view box change logic
                }}
            />
        </div>
    );
} 