import React from 'react';
import { Node } from '@/types/workspace';
import { getNodeColor } from './utils';

interface NodeGroupProps {
    node: Node;
    x: number;
    y: number;
    onSelect: (node: Node) => void;
}

export function NodeGroup({ node, x, y, onSelect }: NodeGroupProps) {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <g
            transform={`translate(${x},${y})`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(node);
            }}
            style={{ cursor: 'pointer' }}
        >
            <circle
                r={isHovered ? 10 : 8}
                fill={getNodeColor(node)}
                stroke="#fff"
                strokeWidth={2}
                transition="all 0.2s ease"
            />
            {isHovered && (
                <title>{node.name}</title>
            )}
            <text
                dx={12}
                dy={4}
                fontSize={12}
                fill={isHovered ? '#000' : '#666'}
                style={{ pointerEvents: 'none' }}
            >
                {node.name}
            </text>
        </g>
    );
} 