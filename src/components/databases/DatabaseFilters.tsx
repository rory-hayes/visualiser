'use client';

import { ContentFilters } from '@/components/filters/ContentFilters';
import { useRouter, useSearchParams } from 'next/navigation';

export function DatabaseFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleFilterChange = (filter: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('filter', filter);
        router.push(`/dashboard/databases?${params.toString()}`);
    };

    return <ContentFilters type="database" onFilterChange={handleFilterChange} />;
} 