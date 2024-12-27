function initializeNavigation() {
    const currentPath = window.location.pathname;
    const navItems = [
        { path: '/redirect', label: 'Dashboard' },
        { path: '/metrics', label: 'Metrics' },
        { path: '/analytics', label: 'Analytics' }
    ];

    const navHtml = `
        <nav class="bg-white shadow-sm mb-8">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16 items-center">
                    <div class="flex items-center space-x-8">
                        <a href="/redirect" class="flex-shrink-0">
                            <span class="text-xl font-bold text-gray-800">Notion Visualizer</span>
                        </a>
                        <div class="hidden md:block">
                            <div class="flex items-baseline space-x-4">
                                ${navItems.map(item => `
                                    <a href="${item.path}" 
                                       class="${currentPath === item.path 
                                           ? 'bg-indigo-50 text-indigo-700' 
                                           : 'text-gray-600 hover:text-gray-900'} 
                                           px-4 py-2 text-sm font-medium rounded-md">
                                        ${item.label}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button id="refreshBtn" 
                                class="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            Refresh Data
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navHtml);
    setupNavEventListeners();
}

function setupNavEventListeners() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
            `;
            
            try {
                await refreshData();
                window.location.reload();
            } catch (error) {
                console.error('Error refreshing data:', error);
                refreshBtn.innerHTML = 'Refresh Failed';
                refreshBtn.classList.add('bg-red-600');
            } finally {
                setTimeout(() => {
                    refreshBtn.disabled = false;
                    refreshBtn.innerHTML = `
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Refresh Data
                    `;
                    refreshBtn.classList.remove('bg-red-600');
                }, 3000);
            }
        });
    }
}

async function refreshData() {
    const response = await fetch('/api/data?refresh=true');
    if (!response.ok) throw new Error('Failed to refresh data');
    return response.json();
} 