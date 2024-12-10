'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/utils/cn';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium',
                nav: 'space-x-1 flex items-center',
                nav_button: cn(
                    'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
                ),
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-gray-500 rounded-md w-8 font-normal text-[0.8rem]',
                row: 'flex w-full mt-2',
                cell: cn(
                    'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-100',
                    props.mode === 'range'
                        ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
                        : '[&:has([aria-selected])]:rounded-md'
                ),
                day: cn('h-8 w-8 p-0 font-normal aria-selected:opacity-100'),
                day_range_start: 'day-range-start',
                day_range_end: 'day-range-end',
                day_selected:
                    'bg-gray-900 text-gray-50 hover:bg-gray-800 hover:text-gray-50 focus:bg-gray-900 focus:text-gray-50',
                day_today: 'bg-gray-100 text-gray-900',
                day_outside: 'text-gray-500 opacity-50',
                day_disabled: 'text-gray-500 opacity-50',
                day_range_middle:
                    'aria-selected:bg-gray-100 aria-selected:text-gray-900',
                day_hidden: 'invisible',
                ...classNames,
            }}
            {...props}
        />
    );
} 