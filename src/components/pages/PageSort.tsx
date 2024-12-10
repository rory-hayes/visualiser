'use client';

import { ContentSort } from '@/components/filters/ContentSort';
import { useRouter, useSearchParams } from 'next/navigation';

export function PageSort() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSortChange = (sort: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', sort);
        router.push(`/dashboard/pages?${params.toString()}`);
    };

    return <ContentSort onSortChange={handleSortChange} />;
} 