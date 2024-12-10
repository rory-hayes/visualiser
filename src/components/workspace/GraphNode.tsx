'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import type { WorkspaceItem } from '@/types/workspace';
import { useDrag } from '@use-gesture/react';

interface GraphNodeProps {
    item: WorkspaceItem;
    x: number;
    y: number;
    selected: boolean;
    hovered: boolean;
    onSelect: (item: WorkspaceItem) => void;
    onHover: (item: WorkspaceItem | null) => void;
}

interface DragState {
    movement: [number, number];
    first: boolean;
    last: boolean;
}

const MotionGroup = motion.g as any;

export const GraphNode = memo(function GraphNode({
    item,
    x,
    y,
    selected,
    hovered,
    onSelect,
    onHover,
    onDrag
}: GraphNodeProps & { onDrag?: (x: number, y: number) => void }) {
    const bind = useDrag(({ movement: [mx, my], first, last }: DragState) => {
        if (onDrag) {
            onDrag(x + mx, y + my);
        }
    });

    const baseRadius = 5;
    const scale = selected || hovered ? 1.2 : 1;
    const radius = baseRadius * scale;

    return (
        <MotionGroup
            {...bind()}
            transform={`translate(${x},${y})`}
            initial={false}
            animate={{
                scale,
                transition: { type: "spring", stiffness: 300, damping: 25 }
            }}
            onMouseEnter={() => onHover(item)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(item)}
            style={{ cursor: 'pointer' }}
        >
            <circle
                r={radius}
                fill={item.type === 'page' ? '#4f46e5' : '#10b981'}
                stroke={selected || hovered ? '#000' : 'none'}
                strokeWidth={selected || hovered ? 2 : 0}
                strokeOpacity={0.3}
            />
            {(selected || hovered) && (
                <text
                    dy="-10"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#374151"
                >
                    {item.title}
                </text>
            )}
        </MotionGroup>
    );
}); 