'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

interface LoginFormProps {
    callbackUrl?: string;
}

export function LoginForm({ callbackUrl = '/dashboard' }: LoginFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        await signIn('credentials', {
            email: data.email,
            password: data.password,
            callbackUrl,
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
            >
                Sign in
            </Button>
        </form>
    );
} 