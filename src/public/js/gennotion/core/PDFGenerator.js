import { marked } from 'marked';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export class PDFGenerator {
    constructor(templatePath, imageFolderPath) {
        this.templatePath = templatePath;
        this.imageFolderPath = imageFolderPath;
    }

    async generatePDF(placeholderMap) {
        try {
            // Read the markdown template
            const markdownTemplate = await fs.readFile(this.templatePath, 'utf-8');

            // Replace placeholders
            const processedMarkdown = this.replacePlaceholders(markdownTemplate, placeholderMap);

            // Convert markdown to HTML
            const html = await this.convertToHTML(processedMarkdown);

            // Generate PDF
            const pdf = await this.generatePDFFromHTML(html);

            return pdf;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    replacePlaceholders(template, placeholderMap) {
        return template.replace(/\[\[(.*?)\]\]/g, (match, placeholder) => {
            return placeholderMap[placeholder] ?? match;
        });
    }

    async convertToHTML(markdown) {
        // Configure marked for GitHub-flavored markdown
        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: true
        });

        // Custom renderer to handle local images
        const renderer = new marked.Renderer();
        const originalImageRenderer = renderer.image.bind(renderer);
        
        renderer.image = (href, title, text) => {
            if (href.startsWith('./') || href.startsWith('../')) {
                // Convert relative paths to absolute data URLs
                const imagePath = path.join(this.imageFolderPath, href);
                const imageData = fs.readFileSync(imagePath);
                const base64Image = imageData.toString('base64');
                const mimeType = this.getMimeType(href);
                href = `data:${mimeType};base64,${base64Image}`;
            }
            return originalImageRenderer(href, title, text);
        };

        // Convert markdown to HTML
        const htmlContent = marked(markdown, { renderer });

        // Wrap with proper HTML structure and styling
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        line-height: 1.6;
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 40px;
                        color: rgb(55, 53, 47);
                        background: white;
                    }
                    h1 {
                        font-size: 2.5em;
                        font-weight: 700;
                        margin-top: 2em;
                        margin-bottom: 0.5em;
                        color: rgb(55, 53, 47);
                    }
                    h2 {
                        font-size: 1.875em;
                        font-weight: 600;
                        margin-top: 1.5em;
                        color: rgb(55, 53, 47);
                    }
                    h3 {
                        font-size: 1.5em;
                        font-weight: 600;
                        margin-top: 1.5em;
                        color: rgb(55, 53, 47);
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 3px;
                        margin: 1em 0;
                    }
                    aside {
                        background: rgba(235, 236, 237, 0.3);
                        border-radius: 3px;
                        padding: 20px;
                        margin: 20px 0;
                        border-left: 4px solid rgb(55, 53, 47);
                    }
                    aside > * {
                        margin: 0.5em 0;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 1em 0;
                        font-size: 0.875em;
                    }
                    th, td {
                        border: 1px solid rgb(233, 233, 231);
                        padding: 8px 12px;
                        text-align: left;
                    }
                    th {
                        background-color: rgba(247, 246, 243, 0.7);
                        font-weight: 600;
                    }
                    ul, ol {
                        padding-left: 1.5em;
                        margin: 0.5em 0;
                    }
                    li {
                        margin: 0.3em 0;
                    }
                    p {
                        margin: 0.8em 0;
                    }
                    code {
                        background: rgba(135, 131, 120, 0.15);
                        padding: 0.2em 0.4em;
                        border-radius: 3px;
                        font-size: 0.85em;
                        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
                    }
                    .metrics-value {
                        font-weight: 600;
                        color: rgb(46, 170, 220);
                    }
                    .growth-positive {
                        color: rgb(68, 131, 97);
                    }
                    .growth-negative {
                        color: rgb(212, 76, 71);
                    }
                    .insight-box {
                        background: rgb(247, 246, 243);
                        border-radius: 3px;
                        padding: 12px 16px;
                        margin: 8px 0;
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;
    }

    async generatePDFFromHTML(html) {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Set content and wait for images to load
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Generate PDF
        const pdf = await page.pdf({
            format: 'A4',
            margin: {
                top: '40px',
                right: '40px',
                bottom: '40px',
                left: '40px'
            },
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="font-size: 10px; text-align: center; width: 100%;">
                    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
            `
        });

        await browser.close();
        return pdf;
    }

    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
} 