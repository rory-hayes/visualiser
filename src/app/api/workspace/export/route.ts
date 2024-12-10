import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import { z } from 'zod';

const exportSchema = z.object({
    format: z.enum(['json', 'csv']),
    includeMetadata: z.boolean().optional(),
    types: z.array(z.enum(['pages', 'databases'])).optional(),
});

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { format, includeMetadata = true, types = ['pages', 'databases'] } = exportSchema.parse(body);

        const workspace = await prisma.workspace.findUnique({
            where: { userEmail: session.user.email },
            include: {
                pages: types.includes('pages'),
                databases: types.includes('databases'),
            },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        // Prepare export data
        const exportData = {
            workspace: {
                lastSynced: workspace.lastSynced,
                ...(includeMetadata && { data: workspace.data }),
            },
            ...(types.includes('pages') && { pages: workspace.pages }),
            ...(types.includes('databases') && { databases: workspace.databases }),
        };

        // Format response based on requested format
        if (format === 'csv') {
            const csvData = convertToCSV(exportData);
            return new NextResponse(csvData, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename=workspace-export.csv',
                },
            });
        }

        return NextResponse.json(exportData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.errors },
                { status: 400 }
            );
        }

        logger.error('Failed to export workspace:', error);
        return NextResponse.json(
            { error: 'Failed to export workspace' },
            { status: 500 }
        );
    }
}

function convertToCSV(data: any): string {
    // Flatten and convert data to CSV format
    const rows = [];
    const headers = ['type', 'id', 'title', 'parentId', 'createdAt', 'updatedAt'];
    rows.push(headers.join(','));

    if (data.pages) {
        data.pages.forEach((page: any) => {
            rows.push([
                'page',
                page.pageId,
                `"${page.title.replace(/"/g, '""')}"`,
                page.parentId || '',
                page.createdAt,
                page.updatedAt,
            ].join(','));
        });
    }

    if (data.databases) {
        data.databases.forEach((db: any) => {
            rows.push([
                'database',
                db.databaseId,
                `"${db.title.replace(/"/g, '""')}"`,
                db.parentId || '',
                db.createdAt,
                db.updatedAt,
            ].join(','));
        });
    }

    return rows.join('\n');
} 