import * as d3 from 'd3';
import path from 'path';
import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import { JSDOM } from 'jsdom';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class TreeVisualizer {
    constructor() {
        this.colorMap = {
            page: '#4F46E5',
            collection_view_page: '#10B981',
            collection: '#EC4899',
            database: '#F59E0B',
            table: '#6366F1',
            default: '#94A3B8'
        };

        // Configuration for the treemap
        this.config = {
            width: 1200,
            height: 900,
            margin: { top: 20, right: 20, bottom: 20, left: 20 },
            padding: 1,
            legendHeight: 100,
            transitionDuration: 750
        };

        // Set up visualization directory
        const publicDir = path.join(process.cwd(), 'src', 'public');
        this.visualizationsDir = path.join(publicDir, 'visualizations');
        
        // Ensure visualizations directory exists
        try {
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
                console.log('Created public directory:', publicDir);
            }
            
            if (!fs.existsSync(this.visualizationsDir)) {
                fs.mkdirSync(this.visualizationsDir, { recursive: true, mode: 0o755 });
                console.log('Created visualizations directory:', this.visualizationsDir);
            }
            
            // Ensure directory has correct permissions
            fs.chmodSync(this.visualizationsDir, 0o755);
            console.log('Set permissions on visualizations directory');
            
        } catch (error) {
            console.error('Error setting up visualization directories:', error);
        }

        // Color scale for different block types
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Initialize virtual DOM for server-side rendering
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        this.window = dom.window;
        this.document = this.window.document;
        global.window = this.window;
        global.document = this.document;

        // Get base URL from environment variables
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    }

    calculateDepthDistribution(dataframe_2) {
        const distribution = d3.rollup(dataframe_2,
            v => v.length,
            d => d.type || 'unknown',
            d => d.depth || 0
        );

        const totalItems = dataframe_2.length;
        const depthStats = {
            distribution: distribution,
            maxDepth: d3.max(dataframe_2, d => d.depth || 0),
            totalItems: totalItems
        };

        return depthStats;
    }

    processData(dataframe_2) {
        // Group data by space_id and type
        const groupedData = d3.group(dataframe_2, 
            d => d.space_id,
            d => d.type || 'unknown'
        );

        // Transform the grouped data into a hierarchical structure
        const hierarchy = {
            name: 'root',
            children: Array.from(groupedData, ([spaceId, typeGroups]) => ({
                name: spaceId,
                children: Array.from(typeGroups, ([type, items]) => ({
                    name: type,
                    value: items.length,
                    items: items
                }))
            }))
        };

        return hierarchy;
    }

    async saveVisualization() {
        try {
            // Create a unique filename
            const timestamp = Date.now();
            const filename = `treemap_${timestamp}.png`;
            const filePath = path.join(this.visualizationsDir, filename);

            // Get the SVG element and its dimensions
            const svg = d3.select(this.document).select('svg').node();
            if (!svg) {
                throw new Error('SVG element not found');
            }

            // Create canvas with the same dimensions
            const canvas = createCanvas(this.config.width, this.config.height);
            const ctx = canvas.getContext('2d');

            // Set white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Convert SVG to string
            const svgString = new XMLSerializer().serializeToString(svg);
            const svgUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;

            try {
                // Load the SVG into an image
                const image = await loadImage(svgUrl);
                
                // Draw the image onto the canvas
                ctx.drawImage(image, 0, 0);
                
                // Save the canvas as PNG
                const buffer = canvas.toBuffer('image/png');
                fs.writeFileSync(filePath, buffer);
                
                // Return the full URL to the visualization
                return `${this.baseUrl}/visualizations/${filename}`;
            } catch (error) {
                console.error('Error converting SVG to PNG:', error);
                throw error;
            }
        } catch (error) {
            console.error('Error saving visualization:', error);
            throw error;
        }
    }

    async generateVisualization(dataframe_2, containerId) {
        this.containerId = containerId;
        console.log('Generating treemap visualization with full dataset:', {
            totalRecords: dataframe_2.length
        });

        try {
            // Clear any existing content
            const container = d3.select(`#${containerId}`);
            container.html('');

            // Process the full dataset and calculate depth distribution
            const data = this.processData(dataframe_2);
            const depthStats = this.calculateDepthDistribution(dataframe_2);

            // Create the treemap layout
            const treemap = d3.treemap()
                .size([
                    this.config.width - this.config.margin.left - this.config.margin.right,
                    this.config.height - this.config.margin.top - this.config.margin.bottom - this.config.legendHeight
                ])
                .paddingOuter(this.config.padding)
                .paddingInner(this.config.padding)
                .round(true);

            // Create hierarchy and calculate values
            const root = d3.hierarchy(data)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value);

            // Generate the treemap layout
            treemap(root);

            // Create the SVG container
            const svg = container.append('svg')
                .attr('width', this.config.width)
                .attr('height', this.config.height)
                .attr('viewBox', [0, 0, this.config.width, this.config.height])
                .style('font', '10px sans-serif')
                .style('background-color', '#ffffff');

            // Add title
            svg.append('text')
                .attr('x', this.config.width / 2)
                .attr('y', this.config.margin.top / 2)
                .attr('text-anchor', 'middle')
                .attr('font-size', '16px')
                .attr('font-weight', 'bold')
                .text('Workspace Structure Distribution');

            // Create the treemap cells
            const cell = svg.selectAll('g.cell')
                .data(root.leaves())
                .join('g')
                .attr('class', 'cell')
                .attr('transform', d => `translate(${d.x0},${d.y0 + this.config.margin.top})`);

            // Add rectangles for each cell
            cell.append('rect')
                .attr('width', d => d.x1 - d.x0)
                .attr('height', d => d.y1 - d.y0)
                .attr('fill', d => this.colorMap[d.data.name] || this.colorMap.default)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1);

            // Add text labels
            cell.append('text')
                .attr('x', 3)
                .attr('y', 15)
                .attr('fill', 'white')
                .attr('font-size', '12px')
                .selectAll('tspan')
                .data(d => {
                    const name = d.data.name;
                    const value = d.value;
                    const percent = ((value / root.value) * 100).toFixed(1);
                    return [
                        `${name}`,
                        `${value.toLocaleString()} (${percent}%)`
                    ];
                })
                .join('tspan')
                .attr('x', 3)
                .attr('y', (d, i) => 13 + i * 12)
                .attr('fill-opacity', (d, i) => i ? 0.7 : 1)
                .text(d => d);

            // Add depth distribution legend
            this.addDepthDistributionLegend(svg, depthStats);

            // Save the visualization and get its URL
            const visualizationUrl = await this.saveVisualization();
            return visualizationUrl;

        } catch (error) {
            console.error('Error generating visualization:', error);
            throw error;
        }
    }

    addDepthDistributionLegend(svg, depthStats) {
        const legendY = this.config.height - this.config.legendHeight;
        const legendX = this.config.margin.left;
        
        // Create legend container
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        // Add legend title
        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text('Depth Distribution');

        // Process depth distribution data
        const distributionData = [];
        depthStats.distribution.forEach((typeDepths, type) => {
            typeDepths.forEach((count, depth) => {
                distributionData.push({
                    type,
                    depth: +depth,
                    count,
                    percentage: (count / depthStats.totalItems * 100).toFixed(1)
                });
            });
        });

        // Sort by type and depth
        distributionData.sort((a, b) => 
            a.type.localeCompare(b.type) || a.depth - b.depth
        );

        // Create distribution table
        const table = legend.append('g')
            .attr('transform', 'translate(0, 20)');

        // Add table headers
        const headers = ['Type', 'Depth', 'Count', 'Percentage'];
        headers.forEach((header, i) => {
            table.append('text')
                .attr('x', i * 150)
                .attr('y', 0)
                .attr('font-weight', 'bold')
                .text(header);
        });

        // Add table rows
        distributionData.forEach((d, i) => {
            const row = table.append('g')
                .attr('transform', `translate(0, ${20 + i * 15})`);

            row.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .attr('fill', this.colorMap[d.type] || this.colorMap.default)
                .text(d.type);

            row.append('text')
                .attr('x', 150)
                .attr('y', 0)
                .text(d.depth);

            row.append('text')
                .attr('x', 300)
                .attr('y', 0)
                .text(d.count.toLocaleString());

            row.append('text')
                .attr('x', 450)
                .attr('y', 0)
                .text(`${d.percentage}%`);
        });
    }

    async exportAsPNG(containerId) {
        try {
            const svg = document.querySelector(`#${containerId} svg`);
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create image from SVG
            const img = new Image();
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width * 2;  // 2x for higher resolution
                    canvas.height = img.height * 2;
                    ctx.scale(2, 2);
                    ctx.fillStyle = '#ffffff';  // Set white background
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    
                    canvas.toBlob(blob => {
                        resolve(blob);
                    }, 'image/png', 1.0);  // Maximum quality
                };
                img.onerror = reject;
                img.src = url;
            });
        } catch (error) {
            console.error('Error exporting PNG:', error);
            throw error;
        }
    }
} 