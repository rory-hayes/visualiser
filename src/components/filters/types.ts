export interface FilterHistoryEntry {
    id: string;
    timestamp: Date;
    criteria: {
        status?: 'all' | 'active' | 'archived';
    };
    search: string;
    sort: {
        type: string;
        direction: 'asc' | 'desc';
    };
}

export interface SortConfig {
    type: 'name' | 'updated' | 'created';
    direction: 'asc' | 'desc';
} 