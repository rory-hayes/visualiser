export class BaseVisualizer {
    constructor() {
        this.width = 1200;
        this.height = 800;
        this.colorMap = {
            page: '#4F46E5',
            collection_view_page: '#10B981',
            collection: '#EC4899',
            database: '#F59E0B',
            table: '#6366F1',
            default: '#94A3B8'
        };
    }

    validateData(data) {
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array');
        }
        if (data.length === 0) {
            throw new Error('Data array is empty');
        }
    }

    getNodeColor(type) {
        return this.colorMap[type?.toLowerCase()] || this.colorMap.default;
    }

    calculateNodeRadius(node) {
        const baseRadius = 5;
        const connectionFactor = Math.sqrt(node.connections || 1);
        return Math.min(20, baseRadius * connectionFactor);
    }

    isValidCoordinate(point) {
        return point && 
               typeof point.x === 'number' && 
               typeof point.y === 'number' && 
               !isNaN(point.x) && 
               !isNaN(point.y);
    }

    addSVGFilters() {
        return `
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        `;
    }

    generateEmptySVG(message = 'No data available') {
        return `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#fff"/>
            <text 
                x="${this.width/2}" 
                y="${this.height/2}" 
                text-anchor="middle" 
                font-size="24" 
                fill="#666"
            >${message}</text>
        </svg>`;
    }

    async exportAsPNG(svgString) {
        try {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create an image from the SVG
            const img = new Image();
            const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width * 2;  // 2x for higher resolution
                    canvas.height = img.height * 2;
                    ctx.scale(2, 2);
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    
                    canvas.toBlob(blob => {
                        resolve(blob);
                    }, 'image/png');
                };
                img.onerror = reject;
                img.src = url;
            });
        } catch (error) {
            console.error('Error exporting PNG:', error);
            throw error;
        }
    }

    addTitle(svg, title) {
        return svg.replace('</svg>', `
            <text 
                x="${this.width/2}" 
                y="30" 
                text-anchor="middle" 
                font-size="20" 
                font-weight="bold" 
                fill="#333"
            >${title}</text>
            </svg>
        `);
    }

    addLegend(svg) {
        const legendX = 50;
        const legendY = this.height - 100;
        const itemHeight = 20;

        let legend = `<g transform="translate(${legendX},${legendY})">`;
        legend += `<rect x="-10" y="-25" width="200" height="100" fill="white" fill-opacity="0.9" stroke="#ccc"/>`;
        
        Object.entries(this.colorMap).forEach(([type, color], i) => {
            if (type !== 'default') {
                legend += `
                    <circle cx="0" cy="${i * itemHeight}" r="5" fill="${color}"/>
                    <text x="15" y="${i * itemHeight + 4}" font-size="12">${type}</text>
                `;
            }
        });

        legend += '</g>';
        return svg.replace('</svg>', `${legend}</svg>`);
    }
} 