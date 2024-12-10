'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { getLinkColor } from '@/utils/graphLayout';

interface GraphLinkProps {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
}

export const GraphLink = memo(function GraphLink({
    sourceX,
    sourceY,
    targetX,
    targetY,
}: GraphLinkProps) {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <motion.line
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            exit={{ opacity: 0 }}
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
            stroke={getLinkColor(isDarkMode)}
            strokeWidth={1}
            className="pointer-events-none"
        />
    );
}); 