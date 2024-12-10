import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
    const session = await getServerSession();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect('/login?error=NoCode');
    }

    try {
        // Store the successful connection
        // You might want to store this in your database
        return NextResponse.redirect('/dashboard');
    } catch (error) {
        console.error('Notion callback error:', error);
        return NextResponse.redirect('/login?error=NotionError');
    }
} 