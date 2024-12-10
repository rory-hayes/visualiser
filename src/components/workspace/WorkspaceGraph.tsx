'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphControls } from './GraphControls';
import { GraphNode } from './GraphNode';
import type { WorkspaceItem, WorkspaceGroup } from '@/types/workspace';
import { NodeDetails } from './NodeDetails';
import { MiniMap } from './MiniMap';
import { SearchOverlay } from './SearchOverlay';
import { LayoutControls, LayoutType } from './LayoutControls';
import { ExportButton } from './ExportButton';
import { GraphFilters } from './GraphFilters';
import { useGraphFilters } from '@/hooks/useGraphFilters';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toast } from '@/components/ui/Toast';
import '@/types/d3-extensions';

interface WorkspaceGraphProps {
    items: WorkspaceItem[];
    className?: string;
    onNodeSelect?: (item: WorkspaceItem) => void;
}

export function WorkspaceGraph({ items, className, onNodeSelect }: WorkspaceGraphProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [zoom, setZoom] = useState(1);
    const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
    const [selectedNode, setSelectedNode] = useState<WorkspaceItem | null>(null);
    const [hoveredNode, setHoveredNode] = useState<WorkspaceItem | null>(null);
    const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
    const [viewport, setViewport] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [layout, setLayout] = useState<LayoutType>('force');

    const {
        filter,
        groupBy,
        showOrphans,
        setFilter,
        setGroupBy,
        setShowOrphans,
        filteredItems,
        groupedItems
    } = useGraphFilters(items);

    const createForceLayout = useCallback((width: number, height: number) => {
        return d3.forceSimulation()
            .force('link', d3.forceLink().id((d: any) => d.id))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));
    }, []);

    const createRadialLayout = useCallback((width: number, height: number) => {
        return d3.forceSimulation()
            .force('link', d3.forceLink().id((d: any) => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-1000))
            .force('r', d3.forceRadial(200, width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30));
    }, []);

    const createHierarchicalLayout = useCallback((width: number, height: number) => {
        const hierarchy = d3.stratify<any>()
            .id(d => d.id)
            .parentId(d => d.parentId)(items);

        const treeLayout = d3.tree<any>()
            .size([width - 100, height - 100]);

        const root = treeLayout(hierarchy);
        
        return d3.forceSimulation()
            .force('x', d3.forceX().x((d: any) => {
                const node = root.descendants().find(n => n.data.id === d.id);
                return node ? node.x + 50 : width / 2;
            }))
            .force('y', d3.forceY().y((d: any) => {
                const node = root.descendants().find(n => n.data.id === d.id);
                return node ? node.y + 50 : height / 2;
            }))
            .force('collision', d3.forceCollide().radius(30));
    }, [items]);

    const handleError = (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('Graph error:', error);
        toast.show({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive'
        });
    };

    const isValidItem = (
        item: WorkspaceItem | { id: string; type: string; title: string; items: WorkspaceItem[] }
    ): item is WorkspaceItem => {
        return 'type' in item && (item.type === 'page' || item.type === 'database');
    };

    useEffect(() => {
        if (!svgRef.current || !items.length) return;

        try {
            const svg = d3.select(svgRef.current);
            const width = svgRef.current.clientWidth;
            const height = svgRef.current.clientHeight;

            // Clear previous graph
            svg.selectAll('*').remove();

            const g = svg.append('g');

            // Setup zoom behavior
            zoomBehaviorRef.current = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.1, 2])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                    setTransform(event.transform);
                    setZoom(event.transform.k);
                });

            svg.call(zoomBehaviorRef.current);

            // Create simulation based on layout
            const simulation = (() => {
                const sim = (() => {
                    switch (layout) {
                        case 'radial':
                            return createRadialLayout(width, height);
                        case 'hierarchical':
                            return createHierarchicalLayout(width, height);
                        default:
                            return createForceLayout(width, height);
                    }
                })();

                if (groupBy !== 'none') {
                    // Add forces to cluster grouped items
                    sim.force('cluster', d3.forceCluster()
                        .centers((d: any) => {
                            if (d.type === 'group') return d;
                            const groupId = groupBy === 'type' ? d.type :
                                          groupBy === 'parent' ? (d.parentId || 'root') :
                                          'unknown';
                            return groupedItems.find(g => g.id === `group-${groupId}`);
                        })
                        .strength(0.5)
                    );
                }

                return sim;
            })();

            // Create links array from parent relationships
            const links = items
                .filter(item => item.parentId)
                .map(item => ({
                    source: item.parentId,
                    target: item.id
                }));

            // Draw links
            const link = g.append('g')
                .selectAll('line')
                .data(links)
                .enter()
                .append('line')
                .attr('stroke', '#999')
                .attr('stroke-opacity', 0.6);

            // Update positions on simulation tick
            simulation
                .nodes(items as any)
                .on('tick', () => {
                    link
                        .attr('x1', d => (d as any).source.x)
                        .attr('y1', d => (d as any).source.y)
                        .attr('x2', d => (d as any).target.x)
                        .attr('y2', d => (d as any).target.y);

                    // Update node positions in state
                    const newPositions = new Map();
                    items.forEach((item, i) => {
                        const node = simulation.nodes()[i];
                        newPositions.set(item.id, { x: node.x, y: node.y });
                    });
                    setNodePositions(newPositions);
                });

            (simulation.force('link') as d3.ForceLink<any, any>)
                .links(links);

            return () => {
                simulation.stop();
            };
        } catch (error) {
            handleError(error);
        }
    }, [items, layout, createForceLayout, createRadialLayout, createHierarchicalLayout]);

    useEffect(() => {
        if (!svgRef.current) return;
        const { width, height } = svgRef.current.getBoundingClientRect();
        setViewport({ x: 0, y: 0, width, height });
    }, []);

    const handleNodeSelect = (item: WorkspaceItem) => {
        setSelectedNode(item);
        onNodeSelect?.(item);
    };

    const handleZoomIn = () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
        svg.transition()
            .duration(300)
            .call(zoomBehaviorRef.current.scaleBy, 1.2);
    };

    const handleZoomOut = () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
        svg.transition()
            .duration(300)
            .call(zoomBehaviorRef.current.scaleBy, 0.8);
    };

    const handleReset = () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
        svg.transition()
            .duration(300)
            .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    };

    const handleZoomChange = (value: number) => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
        svg.transition()
            .duration(300)
            .call(zoomBehaviorRef.current.scaleTo, value);
    };

    const handleNodeDrag = useCallback((itemId: string, x: number, y: number) => {
        try {
            setNodePositions(prev => {
                const newPositions = new Map(prev);
                newPositions.set(itemId, { x, y });
                return newPositions;
            });
        } catch (error) {
            console.error('Failed to update node position:', error);
            toast.show({
                title: 'Error',
                description: 'Failed to update node position',
                variant: 'destructive',
            });
        }
    }, []);

    const nodeElements = useMemo(() => {
        return (groupBy === 'none' ? filteredItems : groupedItems).map((item) => {
            if (!isValidItem(item)) {
                return null;
            }

            const position = nodePositions.get(item.id);
            if (!position) return null;

            return (
                <GraphNode
                    key={item.id}
                    item={item}
                    x={position.x}
                    y={position.y}
                    selected={selectedNode?.id === item.id}
                    hovered={hoveredNode?.id === item.id}
                    onSelect={handleNodeSelect}
                    onHover={setHoveredNode}
                    onDrag={(x, y) => handleNodeDrag(item.id, x, y)}
                />
            );
        });
    }, [filteredItems, groupedItems, groupBy, nodePositions, selectedNode, hoveredNode]);

    const visibleNodes = useMemo(() => {
        if (!svgRef.current) return nodeElements;
        
        const { width, height } = svgRef.current.getBoundingClientRect();
        const scale = transform.k;
        const visibleArea = {
            x1: -transform.x / scale,
            y1: -transform.y / scale,
            x2: (-transform.x + width) / scale,
            y2: (-transform.y + height) / scale,
        };

        return nodeElements.filter((node): node is NonNullable<typeof node> => {
            if (!node) return false;
            const position = nodePositions.get(node.props.item.id);
            if (!position) return false;
            
            return (
                position.x >= visibleArea.x1 &&
                position.x <= visibleArea.x2 &&
                position.y >= visibleArea.y1 &&
                position.y <= visibleArea.y2
            );
        });
    }, [nodeElements, nodePositions, transform]);

    return (
        <ErrorBoundary>
            <div className={`relative ${className}`}>
                <ErrorBoundary>
                    <div className="controls-section">
                        <LayoutControls
                            layout={layout}
                            onLayoutChange={setLayout}
                        />
                        <ExportButton svgRef={svgRef} />
                        <GraphFilters
                            filter={filter}
                            groupBy={groupBy}
                            showOrphans={showOrphans}
                            onFilterChange={setFilter}
                            onGroupByChange={setGroupBy}
                            onShowOrphansChange={setShowOrphans}
                        />
                    </div>
                </ErrorBoundary>
                
                <ErrorBoundary>
                    <div className="graph-section">
                        <svg ref={svgRef} className="w-full h-full">
                            <g>{visibleNodes}</g>
                        </svg>
                    </div>
                </ErrorBoundary>

                <ErrorBoundary>
                    <div className="details-section">
                        {selectedNode && (
                            <NodeDetails
                                node={selectedNode}
                                items={items}
                                onClose={() => setSelectedNode(null)}
                                onNodeSelect={(item) => {
                                    handleNodeSelect(item);
                                    // Center the view on the selected node
                                    const position = nodePositions.get(item.id);
                                    if (position && svgRef.current && zoomBehaviorRef.current) {
                                        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
                                        const width = svgRef.current.clientWidth;
                                        const height = svgRef.current.clientHeight;
                                        
                                        svg.transition()
                                            .duration(500)
                                            .call(
                                                zoomBehaviorRef.current.transform,
                                                d3.zoomIdentity
                                                    .translate(width / 2, height / 2)
                                                    .scale(1)
                                                    .translate(-position.x, -position.y)
                                            );
                                    }
                                }}
                            />
                        )}
                        <MiniMap
                            items={Array.from(nodePositions.entries()).map(([id, pos]) => ({
                                id,
                                ...pos,
                                type: items.find(item => item.id === id)?.type || 'page'
                            }))}
                            viewBox={viewport}
                            width={200}
                            height={150}
                            onViewBoxChange={setViewport}
                        />
                        <SearchOverlay
                            items={items}
                            onSelect={(item) => {
                                handleNodeSelect(item);
                                // Center the view on the selected node
                                const position = nodePositions.get(item.id);
                                if (position && svgRef.current && zoomBehaviorRef.current) {
                                    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
                                    const width = svgRef.current.clientWidth;
                                    const height = svgRef.current.clientHeight;
                                    
                                    svg.transition()
                                        .duration(500)
                                        .call(
                                            zoomBehaviorRef.current.transform,
                                            d3.zoomIdentity
                                                .translate(width / 2, height / 2)
                                                .scale(1)
                                                .translate(-position.x, -position.y)
                                        );
                                }
                            }}
                        />
                    </div>
                </ErrorBoundary>
            </div>
        </ErrorBoundary>
    );
} 