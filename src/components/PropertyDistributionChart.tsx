'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
} from 'recharts';
import { useTheme } from '@/providers/ThemeProvider';

interface PropertyUsage {
    name: string;
    count: number;
}

interface PropertyDistributionChartProps {
    data: PropertyUsage[];
    className?: string;
}

const COLORS = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#6366F1', // indigo
    '#14B8A6', // teal
];

export function PropertyDistributionChart({ data, className }: PropertyDistributionChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const total = data.reduce((sum, item) => sum + item.count, 0);
    const chartData = data.map(item => ({
        name: item.name,
        value: item.count,
        percentage: ((item.count / total) * 100).toFixed(1)
    }));

    return (
        <Card className={className}>
            <Card.Header>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Property Type Distribution
                </h3>
            </Card.Header>
            <Card.Body>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percentage }) => `${name} (${percentage}%)`}
                                labelLine={true}
                            >
                                {chartData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                                }}
                                labelStyle={{
                                    color: isDark ? '#F3F4F6' : '#111827',
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => (
                                    <span className={`text-sm ${
                                        isDark ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        {value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card.Body>
        </Card>
    );
} 