'use client';

import { ContentSort } from '@/components/filters/ContentSort';
import { useRouter, useSearchParams } from 'next/navigation';

export function DatabaseSort() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSortChange = (sort: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', sort);
        router.push(`/dashboard/databases?${params.toString()}`);
    };

    return <ContentSort onSortChange={handleSortChange} />;
} 