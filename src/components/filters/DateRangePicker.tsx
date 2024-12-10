'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';
import { CalendarIcon } from '@/components/icons';

interface DateRange {
    start: Date | undefined;
    end: Date | undefined;
}

interface DateRangePickerProps {
    value?: DateRange;
    onChange: (range: DateRange | null) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
    return (
        <div>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value ? (
                            <>
                                {value.start ? format(value.start, 'LLL dd, y') : 'Start date'} -{' '}
                                {value.end ? format(value.end, 'LLL dd, y') : 'End date'}
                            </>
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        selected={value ? { from: value.start, to: value.end } : undefined}
                        onSelect={(range) => {
                            if (!range?.from || !range?.to) {
                                onChange(null);
                                return;
                            }
                            onChange({ start: range.from, end: range.to });
                        }}
                        numberOfMonths={2}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
} 