'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/Card';
import { NotionLogo } from '@/components/icons';

export default function RegisterPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <Card.Body>
                    <div className="flex flex-col items-center space-y-6">
                        <NotionLogo className="w-12 h-12" />
                        <h2 className="text-2xl font-bold">Create an account</h2>
                        <RegisterForm onSuccess={() => router.push('/login')} />
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
} 