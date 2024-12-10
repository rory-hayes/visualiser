'use client';

import * as React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectFieldProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    'aria-label'?: string;
}

export function SelectField({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className,
    'aria-label': ariaLabel,
}: SelectFieldProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={className} aria-label={ariaLabel}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
} 