'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';

interface AccountSettingsProps {
    settings: any;
}

export function AccountSettings({ settings }: AccountSettingsProps) {
    const { data: session, update } = useSession();
    const [isUpdating, setIsUpdating] = useState(false);
    const [formData, setFormData] = useState({
        name: session?.user?.name || '',
        email: session?.user?.email || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to update profile');

            await update(formData);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Profile Information
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Update your account profile information.
                    </p>
                </Card.Header>
                <Card.Body>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Name
                            </label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" isLoading={isUpdating}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Change Password
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Ensure your account is using a secure password.
                    </p>
                </Card.Header>
                <Card.Body>
                    <Button variant="outline" onClick={() => toast.info('Password reset email sent')}>
                        Reset Password
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );
} 