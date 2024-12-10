import { saveAs } from 'file-saver';

interface ExportOptions {
    format: 'svg' | 'png';
    filename?: string;
    width?: number;
    height?: number;
}

export async function exportGraph(svgElement: SVGSVGElement, options: ExportOptions) {
    const { format, filename = 'graph', width, height } = options;

    if (format === 'svg') {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(svgBlob, `${filename}.svg`);
    } else if (format === 'png') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Set canvas size
        canvas.width = width || svgElement.clientWidth;
        canvas.height = height || svgElement.clientHeight;

        // Create image from SVG
        const img = new Image();
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        return new Promise((resolve, reject) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        saveAs(blob, `${filename}.png`);
                        resolve(undefined);
                    } else {
                        reject(new Error('Failed to create PNG'));
                    }
                }, 'image/png');
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load SVG'));
            };
            img.src = url;
        });
    }
} 