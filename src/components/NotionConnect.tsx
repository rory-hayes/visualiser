'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { NotionLogo } from '@/components/icons/NotionLogo';

export function NotionConnect() {
    return (
        <Button
            onClick={() => signIn('notion', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-2"
        >
            <NotionLogo className="w-5 h-5" />
            Connect with Notion
        </Button>
    );
} 