'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        await signIn('credentials', {
            email: data.email,
            password: data.password,
            callbackUrl: '/dashboard',
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <Input
                    {...register('email')}
                    type="email"
                    placeholder="Email"
                    error={errors.email?.message}
                />
            </div>
            <div>
                <Input
                    {...register('password')}
                    type="password"
                    placeholder="Password"
                    error={errors.password?.message}
                />
            </div>
            <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="w-full"
            >
                Sign in
            </Button>
        </form>
    );
} 