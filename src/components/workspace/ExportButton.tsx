'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { exportGraph } from '@/utils/graphExport';
import { DownloadIcon } from '@/components/icons';

interface ExportButtonProps {
    svgRef: React.RefObject<SVGSVGElement>;
    className?: string;
}

export function ExportButton({ svgRef, className }: ExportButtonProps) {
    const [format, setFormat] = useState<'svg' | 'png'>('svg');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!svgRef.current) return;
        
        setIsExporting(true);
        try {
            await exportGraph(svgRef.current, {
                format,
                filename: `workspace-graph-${new Date().toISOString().split('T')[0]}`,
            });
        } catch (error) {
            console.error('Failed to export graph:', error);
            // You might want to show a toast notification here
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Select value={format} onValueChange={(value: 'svg' | 'png') => setFormat(value)}>
                <SelectTrigger className="w-24">
                    <SelectValue>{format.toUpperCase()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="svg">SVG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
            </Select>
            <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
            >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export
            </Button>
        </div>
    );
} 