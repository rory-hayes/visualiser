'use client';

import React from 'react';

export default function Sidebar() {
    return (
        <div className="w-64 bg-white shadow-lg">
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Workspace Analysis</h2>
                <nav className="space-y-2">
                    <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                        Overview
                    </a>
                    <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                        Pages
                    </a>
                    <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                        Databases
                    </a>
                    <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                        Team Spaces
                    </a>
                    <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                        Analytics
                    </a>
                </nav>
            </div>
        </div>
    );
} 