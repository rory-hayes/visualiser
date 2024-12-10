'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/providers/ThemeProvider';

interface ChartData {
    name: string;
    value: number;
}

interface AnalyticsChartProps {
    data: ChartData[];
    title: string;
    className?: string;
}

export function AnalyticsChart({ data, title, className }: AnalyticsChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <Card className={className}>
            <Card.Header>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {title}
                </h3>
            </Card.Header>
            <Card.Body>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={isDark ? '#374151' : '#E5E7EB'}
                            />
                            <XAxis
                                dataKey="name"
                                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                                tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }}
                            />
                            <YAxis
                                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                                tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }}
                            />
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
                            <Bar
                                dataKey="value"
                                fill={isDark ? '#60A5FA' : '#3B82F6'}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card.Body>
        </Card>
    );
} 