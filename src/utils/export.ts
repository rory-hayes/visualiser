import { saveAs } from 'file-saver';

interface ExportOptions {
    format: 'json' | 'csv';
    filename?: string;
}

export async function exportWorkspaceData(data: any, options: ExportOptions) {
    const { format, filename = `workspace-export-${new Date().toISOString()}` } = options;

    switch (format) {
        case 'json':
            return exportJson(data, filename);
        case 'csv':
            return exportCsv(data, filename);
        default:
            throw new Error(`Unsupported export format: ${format}`);
    }
}

function exportJson(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8'
    });
    saveAs(blob, `${filename}.json`);
}

function exportCsv(data: any, filename: string) {
    // Convert workspace data to CSV format
    const pages = data.pages.map((page: any) => ({
        type: 'page',
        id: page.pageId,
        title: page.title,
        parentId: page.parentId || '',
        created: page.createdAt,
        updated: page.updatedAt
    }));

    const databases = data.databases.map((db: any) => ({
        type: 'database',
        id: db.databaseId,
        title: db.title,
        parentId: db.parentId || '',
        created: db.createdAt,
        updated: db.updatedAt
    }));

    const items = [...pages, ...databases];
    const headers = Object.keys(items[0]);
    const csvContent = [
        headers.join(','),
        ...items.map(item => 
            headers.map(header => 
                JSON.stringify(item[header] || '')
            ).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${filename}.csv`);
} 