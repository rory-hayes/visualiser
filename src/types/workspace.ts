export interface Node {
    id: string;
    name: string;
    type: string;
    properties?: Record<string, any>;
    parent?: {
        type: string;
        page_id?: string;
        database_id?: string;
    };
}

export interface Link {
    source: string;
    target: string;
    type: string;
}

export interface WorkspaceData {
    nodes: Node[];
    links: Link[];
}

export interface GraphConfig {
    width: number;
    height: number;
    nodeRadius: number;
    linkDistance: number;
    chargeStrength: number;
    centerStrength: number;
}

export interface WorkspaceItem {
    id: string;
    title: string;
    type: 'page' | 'database';
    parentId?: string;
    updatedAt?: string;
}

export interface WorkspaceNode extends WorkspaceItem {
    x: number;
    y: number;
    children?: WorkspaceNode[];
}

export interface WorkspaceGroup {
    id: string;
    type: 'group';
    title: string;
    items: WorkspaceItem[];
}

export type WorkspaceViewItem = WorkspaceItem | WorkspaceGroup;

export type FilterType = 'all' | 'pages' | 'databases' | 'root';
export type SortType = 'name' | 'updated' | 'created';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    type: SortType;
    direction: SortDirection;
}

export function isWorkspaceItem(item: any): item is WorkspaceItem {
    return item && (item.type === 'page' || item.type === 'database');
}

export function isWorkspaceGroup(item: any): item is WorkspaceGroup {
    return item && item.type === 'group' && Array.isArray(item.items);
} 