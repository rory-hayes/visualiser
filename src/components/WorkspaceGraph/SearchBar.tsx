'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Node {
    id: string;
    title: string;
    type: 'page' | 'database';
}

interface SearchBarProps {
    nodes: Node[];
    onSelect: (node: Node) => void;
}

export function SearchBar({ nodes, onSelect }: SearchBarProps) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    const filteredNodes = nodes.filter((node) =>
        node.title.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const handleSelect = useCallback((node: Node) => {
        onSelect(node);
        setSearch('');
        setIsOpen(false);
    }, [onSelect]);

    return (
        <div className="relative">
            <Input
                type="search"
                placeholder="Search pages and databases..."
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setIsOpen(true);
                }}
                className="w-full"
            />

            {isOpen && search && (
                <Card className="absolute top-full mt-1 w-full z-10 max-h-64 overflow-auto">
                    <div className="p-1">
                        {filteredNodes.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500 text-center">
                                No results found
                            </div>
                        ) : (
                            filteredNodes.map((node) => (
                                <button
                                    key={node.id}
                                    onClick={() => handleSelect(node)}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-2"
                                >
                                    <span className={`w-2 h-2 rounded-full ${
                                        node.type === 'page' ? 'bg-blue-500' : 'bg-green-500'
                                    }`} />
                                    <span>{node.title}</span>
                                </button>
                            ))
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
} 