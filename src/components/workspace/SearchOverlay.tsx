'use client';

import React, { useState } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/Command';
import { CommandDialog } from '@/components/ui/CommandDialog';
import { SearchIcon, DocumentIcon, DatabaseIcon } from '@/components/icons';
import type { WorkspaceItem } from '@/types/workspace';
import { useKeyboard } from '@/hooks/keyboard';

interface SearchOverlayProps {
    items: WorkspaceItem[];
    onSelect: (item: WorkspaceItem) => void;
}

export function SearchOverlay({ items, onSelect }: SearchOverlayProps) {
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [query, setQuery] = useState('');

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
    );

    const handleKeyDown = useKeyboard({
        onArrowUp: () => {
            setSelectedIndex((prev) => 
                (prev - 1 + filteredItems.length) % filteredItems.length
            );
        },
        onArrowDown: () => {
            setSelectedIndex((prev) => 
                (prev + 1) % filteredItems.length
            );
        },
        onEnter: () => {
            if (filteredItems[selectedIndex]) {
                onSelect(filteredItems[selectedIndex]);
                setOpen(false);
            }
        },
        onEscape: () => setOpen(false),
    });

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
                <SearchIcon className="w-4 h-4" />
                <span>Search...</span>
                <kbd className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    ⌘K
                </kbd>
            </button>

            <CommandDialog
                open={open}
                onOpenChange={setOpen}
                onKeyDown={handleKeyDown}
            >
                <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                    <CommandInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search nodes..."
                        className="w-full px-4 py-3 text-base border-b border-gray-200 dark:border-gray-700 focus:outline-none"
                    />
                    <CommandList className="max-h-[300px] overflow-y-auto p-2">
                        <CommandEmpty className="p-4 text-sm text-gray-500 text-center">
                            No results found.
                        </CommandEmpty>
                        {filteredItems.map((item, index) => (
                            <CommandItem
                                key={item.id}
                                value={item.title}
                                onSelect={() => {
                                    onSelect(item);
                                    setOpen(false);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 text-sm rounded cursor-pointer ${
                                    index === selectedIndex
                                        ? 'bg-gray-100 dark:bg-gray-700'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                                }`}
                            >
                                {item.type === 'page' ? (
                                    <DocumentIcon className="w-4 h-4 text-blue-500" />
                                ) : (
                                    <DatabaseIcon className="w-4 h-4 text-green-500" />
                                )}
                                {item.title}
                            </CommandItem>
                        ))}
                    </CommandList>
                </div>
            </CommandDialog>
        </>
    );
} 