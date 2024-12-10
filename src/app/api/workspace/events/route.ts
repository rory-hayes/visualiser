import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection message
            controller.enqueue(encoder.encode('data: connected\n\n'));

            // Set up Notion webhook handling here
            // This is a simplified example
            const interval = setInterval(() => {
                const message = {
                    id: 'some-id',
                    type: 'update',
                    data: {
                        // Update data
                    },
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
            }, 30000);

            return () => {
                clearInterval(interval);
            };
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
} 