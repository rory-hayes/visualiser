import React from 'react';
import { Node } from '@/types/workspace';

interface ControlsProps {
    nodes: Node[];
    onFilterChange: (filters: string[]) => void;
    onGroupingChange: (grouping: 'type' | 'parent' | 'none') => void;
    onLayoutChange: (layout: 'force' | 'hierarchical' | 'circular') => void;
}

export function Controls({ nodes, onFilterChange, onGroupingChange, onLayoutChange }: ControlsProps) {
    const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
    const nodeTypes = React.useMemo(() => 
        Array.from(new Set(nodes.map(node => node.type))),
        [nodes]
    );

    return (
        <div className="absolute left-4 bottom-4 bg-white rounded-lg shadow-lg p-4">
            <div className="space-y-4">
                {/* Filters */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Filter Nodes</h3>
                    <div className="space-y-2">
                        {nodeTypes.map(type => (
                            <label key={type} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={selectedTypes.includes(type)}
                                    onChange={(e) => {
                                        const newTypes = e.target.checked
                                            ? [...selectedTypes, type]
                                            : selectedTypes.filter(t => t !== type);
                                        setSelectedTypes(newTypes);
                                        onFilterChange(newTypes);
                                    }}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-600 capitalize">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Grouping */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Group By</h3>
                    <select
                        onChange={(e) => onGroupingChange(e.target.value as any)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="none">None</option>
                        <option value="type">Type</option>
                        <option value="parent">Parent</option>
                    </select>
                </div>

                {/* Layout */}
                <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Layout</h3>
                    <select
                        onChange={(e) => onLayoutChange(e.target.value as any)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="force">Force</option>
                        <option value="hierarchical">Hierarchical</option>
                        <option value="circular">Circular</option>
                    </select>
                </div>
            </div>
        </div>
    );
} 