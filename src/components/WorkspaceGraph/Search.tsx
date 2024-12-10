import React, { useState } from 'react';
import { Node } from '@/types/workspace';

interface SearchProps {
    nodes: Node[];
    onSelect: (node: Node) => void;
}

export function Search({ nodes, onSelect }: SearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredNodes = query
        ? nodes.filter(node => 
            node.name.toLowerCase().includes(query.toLowerCase()) ||
            node.type.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    return (
        <div className="absolute top-4 left-4 w-64">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    placeholder="Search nodes..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                {isOpen && filteredNodes.length > 0 && (
                    <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto z-10">
                        {filteredNodes.map(node => (
                            <button
                                key={node.id}
                                onClick={() => {
                                    onSelect(node);
                                    setIsOpen(false);
                                    setQuery('');
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                            >
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getNodeTypeColor(node.type) }}
                                />
                                <span>{node.name}</span>
                                <span className="text-xs text-gray-500 ml-auto">
                                    {node.type}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function getNodeTypeColor(type: string): string {
    switch (type) {
        case 'workspace':
            return '#FF4081';
        case 'database':
            return '#4CAF50';
        case 'page':
            return '#2196F3';
        case 'teamspace':
            return '#FFC107';
        default:
            return '#9E9E9E';
    }
} 