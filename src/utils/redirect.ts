import { redirect as nextRedirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

export async function redirectIfAuthenticated(redirectTo: string = '/dashboard') {
    const session = await getServerSession();
    if (session) {
        nextRedirect(redirectTo);
    }
}

export async function redirectIfUnauthenticated(redirectTo: string = '/login') {
    const session = await getServerSession();
    if (!session) {
        nextRedirect(redirectTo);
    }
}

export async function redirectIfNotConnected() {
    const session = await getServerSession();
    if (!session?.user?.email) {
        nextRedirect('/login');
    }

    const workspace = await prisma.workspace.findUnique({
        where: { userEmail: session.user.email },
    });

    if (!workspace) {
        nextRedirect('/dashboard/connect');
    }
}

export function createRedirectUrl(path: string, searchParams?: Record<string, string>) {
    const url = new URL(path, process.env.NEXTAUTH_URL);
    
    if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }

    return url.toString();
} 