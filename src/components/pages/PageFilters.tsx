'use client';

import { ContentFilters } from '@/components/filters/ContentFilters';
import { useRouter, useSearchParams } from 'next/navigation';

export function PageFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleFilterChange = (filter: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('filter', filter);
        router.push(`/dashboard/pages?${params.toString()}`);
    };

    return <ContentFilters type="page" onFilterChange={handleFilterChange} />;
} 