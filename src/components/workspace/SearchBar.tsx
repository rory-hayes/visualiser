'use client';

import React from 'react';
import { SearchIcon } from '@/components/icons';
import { Input } from '@/components/ui/Input';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
    const [localValue, setLocalValue] = React.useState(value);
    const debouncedOnChange = useDebounce(onChange, 300);

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        debouncedOnChange(newValue);
    };

    return (
        <div className={`relative ${className}`}>
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                type="search"
                placeholder="Search workspace..."
                value={localValue}
                onChange={handleChange}
                className="pl-10"
                data-testid="search-input"
            />
        </div>
    );
} 