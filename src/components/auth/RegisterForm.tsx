'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

interface RegisterFormProps {
    onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to register');
            }

            onSuccess();
        } catch (error) {
            setError('root', {
                message: error instanceof Error ? error.message : 'Registration failed',
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/50 dark:text-red-400 rounded-md">
                    {errors.root.message}
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                </label>
                <Input
                    id="name"
                    type="text"
                    {...register('name')}
                    error={errors.name?.message}
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                </label>
                <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                </label>
                <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    error={errors.password?.message}
                />
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                </label>
                <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                />
            </div>

            <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
            >
                Create Account
            </Button>
        </form>
    );
} 