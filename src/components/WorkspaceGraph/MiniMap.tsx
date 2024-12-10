'use client';

import React, { memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Node, getNodeColor, getLinkColor } from '@/utils/graphLayout';
import { motion } from 'framer-motion';

interface MiniMapProps {
    nodes: Node[];
    links: Array<{ source: Node; target: Node }>;
    width: number;
    height: number;
    viewBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    onViewBoxChange: (viewBox: { x: number; y: number; width: number; height: number }) => void;
}

export const MiniMap = memo(function MiniMap({
    nodes,
    links,
    width,
    height,
    viewBox,
    onViewBoxChange,
}: MiniMapProps) {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const scale = Math.min(width / viewBox.width, height / viewBox.height);
    const transform = `scale(${scale})`;

    const handleDrag = (event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / scale - viewBox.width / 2;
        const y = (event.clientY - rect.top) / scale - viewBox.height / 2;

        onViewBoxChange({
            ...viewBox,
            x,
            y,
        });
    };

    return (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
            <svg
                width={width}
                height={height}
                className="cursor-move"
                onClick={handleDrag}
            >
                <g transform={transform}>
                    {links.map((link, i) => (
                        <line
                            key={i}
                            x1={link.source.x}
                            y1={link.source.y}
                            x2={link.target.x}
                            y2={link.target.y}
                            stroke={getLinkColor(isDarkMode)}
                            strokeWidth={1}
                            opacity={0.6}
                        />
                    ))}
                    {nodes.map((node) => (
                        <circle
                            key={node.id}
                            cx={node.x}
                            cy={node.y}
                            r={3}
                            fill={getNodeColor(node.type, isDarkMode)}
                        />
                    ))}
                    <motion.rect
                        x={viewBox.x}
                        y={viewBox.y}
                        width={viewBox.width}
                        height={viewBox.height}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1}
                        className="opacity-50"
                        initial={false}
                        animate={{
                            x: viewBox.x,
                            y: viewBox.y,
                            width: viewBox.width,
                            height: viewBox.height,
                        }}
                    />
                </g>
            </svg>
        </div>
    );
}); 