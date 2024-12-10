'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useTheme } from '@/providers/ThemeProvider';
import { event as analyticsEvent } from '@/utils/analytics';

export function AccountSettings() {
    const { data: session } = useSession();
    const { theme, toggleTheme } = useTheme();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            analyticsEvent({
                action: 'account_delete_attempt',
                category: 'Account'
            });

            const response = await fetch('/api/account/delete', {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            analyticsEvent({
                action: 'account_delete_success',
                category: 'Account'
            });

            await signOut({ callbackUrl: '/' });
        } catch (error) {
            analyticsEvent({
                action: 'account_delete_error',
                category: 'Account',
                label: error instanceof Error ? error.message : 'Unknown error'
            });
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <Card>
            <Card.Header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Account Settings
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage your account preferences and connected services
                </p>
            </Card.Header>
            <Card.Body className="space-y-6">
                {/* Account Info */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Account Information
                    </h3>
                    <div className="mt-2 space-y-2">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                                Email
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">
                                {session?.user?.email}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                                Name
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">
                                {session?.user?.name || 'Not set'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Theme Settings */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                Theme Preference
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Choose between light and dark mode
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={toggleTheme}
                        >
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </Button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                        Danger Zone
                    </h3>
                    <div className="mt-4">
                        <Button
                            variant="danger"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            Delete Account
                        </Button>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Once you delete your account, it cannot be undone. All your data will be permanently removed.
                        </p>
                    </div>
                </div>
            </Card.Body>

            {/* Delete Account Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                title="Delete Account"
                description="Are you sure you want to delete your account? This action cannot be undone."
            >
                <div className="mt-4 space-x-3">
                    <Button
                        variant="danger"
                        onClick={handleDeleteAccount}
                        isLoading={isDeleting}
                    >
                        Yes, delete my account
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                </div>
            </Dialog>
        </Card>
    );
} 