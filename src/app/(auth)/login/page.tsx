'use client';

import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card } from '@/components/ui/Card';
import { NotionLogo } from '@/components/icons';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <Card.Body>
                    <div className="flex flex-col items-center space-y-6">
                        <NotionLogo className="w-12 h-12" />
                        <h2 className="text-2xl font-bold">Sign in with Notion</h2>
                        <LoginForm />
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
} 