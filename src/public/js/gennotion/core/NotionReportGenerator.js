import { MetricsCalculator } from './MetricsCalculator.js';
import { PDFGenerator } from './PDFGenerator.js';
import { Client } from "@notionhq/client";
import path from 'path';

export class NotionReportGenerator {
    constructor() {
        this.metricsCalculator = new MetricsCalculator();
        this.pdfGenerator = new PDFGenerator(
            path.join(process.cwd(), 'src', 'public', 'convertToDocs', 'markdown', 'Notion Enterprise, the why 182efdeead058091a021f98ed0898fbe.md'),
            path.join(process.cwd(), 'src', 'public', 'convertToDocs', 'markdown', 'Notion Enterprise, the why 182efdeead058091a021f98ed0898fbe')
        );
        
        // Initialize Notion client with error logging
        try {
            this.notion = new Client({ 
                auth: "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" 
            });
            this.databaseId = "18730aa1-c7a9-80ca-b4ca-000c9fbcdad0";
            console.log('Notion client initialized successfully');
        } catch (error) {
            console.error('Error initializing Notion client:', error);
            throw error;
        }
    }

    async generateReport(dataframe_2, dataframe_3) {
        try {
            console.log('Starting report generation...');

            // Generate placeholder map from metrics
            console.log('Calculating metrics and generating placeholder map...');
            const placeholderMap = this.metricsCalculator.generateMarkdownPlaceholderMap(dataframe_2, dataframe_3);

            // Generate PDF
            console.log('Generating PDF...');
            const pdfBuffer = await this.pdfGenerator.generatePDF(placeholderMap);

            console.log('Report generation completed successfully');
            return pdfBuffer;

        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }

    async uploadToNotion(workspaceId, pdfBuffer, metrics) {
        try {
            console.log('Starting Notion upload process for workspace:', workspaceId);

            // First, upload the PDF file to Notion
            console.log('Uploading PDF file to Notion...');
            const pdfUploadResponse = await this.notion.files.create({
                file: {
                    name: `Workspace Analysis - ${workspaceId}.pdf`,
                    type: 'application/pdf',
                    content: pdfBuffer
                }
            });
            console.log('PDF upload successful:', pdfUploadResponse);

            // Create the database entry with the workspace ID and PDF link
            console.log('Creating database entry...');
            const pageProperties = {
                parent: { database_id: this.databaseId },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: `Workspace Analysis - ${workspaceId}`,
                                },
                            },
                        ],
                    },
                    "Workspace ID": {
                        rich_text: [
                            {
                                text: {
                                    content: workspaceId,
                                },
                            },
                        ],
                    },
                    "Report Date": {
                        date: {
                            start: new Date().toISOString(),
                        },
                    },
                    "Report PDF": {
                        files: [
                            {
                                name: `Workspace Analysis - ${workspaceId}.pdf`,
                                type: "external",
                                external: {
                                    url: pdfUploadResponse.url
                                }
                            }
                        ]
                    }
                },
            };
            console.log('Database entry properties prepared:', pageProperties);

            const response = await this.notion.pages.create(pageProperties);
            console.log('Successfully created Notion page:', response);

            return {
                success: true,
                message: 'Report generated and uploaded successfully',
                notionPageId: response.id,
                pdfUrl: pdfUploadResponse.url
            };

        } catch (error) {
            console.error('Detailed error in Notion upload:', {
                error: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code,
                status: error.status,
                response: error.response
            });
            throw error;
        }
    }

    async generateAndUploadReport(workspaceId, dataframe_2, dataframe_3) {
        try {
            // Generate the report
            const pdfBuffer = await this.generateReport(dataframe_2, dataframe_3);
            
            // Get metrics for the database entry
            const metrics = this.metricsCalculator.calculateAllMetrics(dataframe_2, dataframe_3);
            
            // Upload to Notion
            const result = await this.uploadToNotion(workspaceId, pdfBuffer, metrics);
            
            return result;

        } catch (error) {
            console.error('Error in generate and upload process:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }
} 