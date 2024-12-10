'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Node } from '@/utils/graphLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { getNodeColor, getTextColor } from '@/utils/graphLayout';
import { cn } from '@/utils/cn';

interface GraphNodeProps {
    node: Node;
    x: number;
    y: number;
    selected: boolean;
    showLabel: boolean;
    onClick: (node: Node) => void;
}

export const GraphNode = memo(function GraphNode({
    node,
    x,
    y,
    selected,
    showLabel,
    onClick,
}: GraphNodeProps) {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transform={`translate(${x},${y})`}
            onClick={() => onClick(node)}
            className="cursor-pointer"
            whileHover={{ scale: 1.1 }}
            data-testid={`graph-node-${node.id}`}
        >
            <circle
                r={selected ? 8 : 6}
                fill={getNodeColor(node.type, isDarkMode)}
                className={cn(
                    'transition-all duration-200',
                    selected && 'stroke-2 stroke-current'
                )}
            />
            {showLabel && (
                <text
                    dx={10}
                    dy=".35em"
                    fill={getTextColor(isDarkMode)}
                    fontSize={12}
                    className="select-none pointer-events-none"
                >
                    {node.title}
                </text>
            )}
        </motion.g>
    );
}); 