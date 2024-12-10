'use client';

import React, { useRef, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface MiniMapProps {
    items: Array<{ id: string; x: number; y: number; type: string }>;
    viewBox: { x: number; y: number; width: number; height: number };
    width: number;
    height: number;
    onViewBoxChange: (viewBox: { x: number; y: number; width: number; height: number }) => void;
}

export function MiniMap({ items, viewBox, width, height, onViewBoxChange }: MiniMapProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const svgRef = useRef<SVGSVGElement>(null);

    const handleClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;

        const svgRect = svgRef.current.getBoundingClientRect();
        const x = event.clientX - svgRect.left;
        const y = event.clientY - svgRect.top;

        // Convert click coordinates to graph coordinates
        const point = svgRef.current.createSVGPoint();
        point.x = x;
        point.y = y;
        const transformedPoint = point.matrixTransform(svgRef.current.getScreenCTM()?.inverse());

        onViewBoxChange({
            x: transformedPoint.x - viewBox.width / 2,
            y: transformedPoint.y - viewBox.height / 2,
            width: viewBox.width,
            height: viewBox.height,
        });
    }, [viewBox, onViewBoxChange]);

    // Calculate bounds
    const bounds = items.reduce(
        (acc, item) => ({
            minX: Math.min(acc.minX, item.x),
            maxX: Math.max(acc.maxX, item.x),
            minY: Math.min(acc.minY, item.y),
            maxY: Math.max(acc.maxY, item.y),
        }),
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    const padding = 20;
    const scale = Math.min(
        width / (bounds.maxX - bounds.minX + padding * 2),
        height / (bounds.maxY - bounds.minY + padding * 2)
    );

    return (
        <div className="absolute left-4 bottom-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`${bounds.minX - padding} ${bounds.minY - padding} ${
                    bounds.maxX - bounds.minX + padding * 2
                } ${bounds.maxY - bounds.minY + padding * 2}`}
                className="border border-gray-200 dark:border-gray-700 rounded cursor-pointer"
                onClick={handleClick}
            >
                {/* Draw nodes */}
                {items.map((item) => (
                    <circle
                        key={item.id}
                        cx={item.x}
                        cy={item.y}
                        r={3}
                        fill={item.type === 'page' ? '#4f46e5' : '#10b981'}
                    />
                ))}

                {/* Draw viewport rectangle */}
                <rect
                    x={viewBox.x}
                    y={viewBox.y}
                    width={viewBox.width}
                    height={viewBox.height}
                    fill="none"
                    stroke={isDark ? '#fff' : '#000'}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                />
            </svg>
        </div>
    );
} 