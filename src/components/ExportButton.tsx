'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { exportWorkspaceData } from '@/utils/export';
import { useWorkspace } from '@/hooks/useWorkspace';

export function ExportButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const { data: workspace } = useWorkspace();

    const handleExport = async (format: 'json' | 'csv') => {
        if (!workspace) return;

        setIsExporting(true);
        try {
            await exportWorkspaceData(workspace, { format });
            setIsOpen(false);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
            >
                Export Data
            </Button>

            <Dialog
                open={isOpen}
                onClose={() => !isExporting && setIsOpen(false)}
                title="Export Workspace Data"
                description="Choose a format to export your workspace data"
            >
                <div className="mt-4 space-y-4">
                    <Button
                        onClick={() => handleExport('json')}
                        isLoading={isExporting}
                        className="w-full"
                    >
                        Export as JSON
                    </Button>
                    <Button
                        onClick={() => handleExport('csv')}
                        isLoading={isExporting}
                        className="w-full"
                    >
                        Export as CSV
                    </Button>
                </div>
            </Dialog>
        </>
    );
} 