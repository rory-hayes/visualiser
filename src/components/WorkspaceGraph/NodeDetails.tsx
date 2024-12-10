import React from 'react';
import { Node } from '@/types/workspace';

interface NodeDetailsProps {
    node: Node;
    onClose: () => void;
}

export function NodeDetails({ node, onClose }: NodeDetailsProps) {
    return (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-lg">{node.name}</h3>
                    <span className="text-sm text-gray-500 capitalize">{node.type}</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close details"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            {node.properties && (
                <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Properties</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(node.properties).map(([key, value]) => (
                            <div key={key} className="truncate">
                                <span className="text-gray-500">{key}:</span>{' '}
                                <span className="text-gray-900">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 