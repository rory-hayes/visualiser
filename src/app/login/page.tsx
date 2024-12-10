'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { GoogleIcon } from '@/components/icons';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const response = await signIn('credentials', {
                email: formData.get('email') as string,
                password: formData.get('password') as string,
                redirect: false,
            });

            if (response?.error) {
                toast.error('Invalid credentials');
                return;
            }

            router.push('/dashboard');
        } catch (error) {
            toast.error('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full space-y-8">
                <Card.Header>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Sign in to your account
                    </h2>
                </Card.Header>
                <Card.Body>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={isLoading}
                            >
                                Sign in
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => signIn('google')}
                            >
                                <GoogleIcon className="w-5 h-5 mr-2" />
                                Google
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
} 