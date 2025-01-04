import { OpenAI } from 'openai';
import { processWorkspaceData } from '../utils/dataProcessing.js';

export class AIInsightsService {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not set. AI features will be disabled.');
            this.enabled = false;
            return;
        }
        this.enabled = true;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateWorkspaceInsights(workspaceData) {
        if (!this.enabled) {
            return {
                insights: "AI features are currently disabled. Please configure OpenAI API key.",
                recommendations: [],
                trends: null
            };
        }
        const processedData = processWorkspaceData(workspaceData);
        
        try {
            const [insights, recommendations, trends] = await Promise.all([
                this.analyzeWorkspaceStructure(processedData),
                this.generateRecommendations(processedData),
                this.analyzeTrends(processedData)
            ]);

            return {
                insights,
                recommendations,
                trends
            };
        } catch (error) {
            console.error('Error generating AI insights:', error);
            throw error;
        }
    }

    async analyzeWorkspaceStructure(data) {
        const prompt = this.createStructureAnalysisPrompt(data);
        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ 
                role: "user", 
                content: prompt 
            }],
            temperature: 0.7,
        });

        return completion.choices[0].message.content;
    }

    async generateRecommendations(data) {
        const prompt = this.createRecommendationsPrompt(data);
        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ 
                role: "user", 
                content: prompt 
            }],
            temperature: 0.7,
        });

        // Parse the response into an array of recommendations
        return JSON.parse(completion.choices[0].message.content);
    }

    async analyzeTrends(data) {
        const historicalData = await this.getHistoricalData(data);
        return this.predictionService.predictGrowth(historicalData);
    }

    createStructureAnalysisPrompt(data) {
        return `Analyze this Notion workspace structure and provide detailed insights:
            
            Workspace Statistics:
            - Total Pages: ${data.totalPages}
            - Max Depth: ${data.maxDepth}
            - Avg Connections: ${data.avgConnections}
            
            Content Distribution:
            - By Type: ${JSON.stringify(data.contentDistribution.byType)}
            - By Depth: ${JSON.stringify(data.contentDistribution.byDepth)}
            
            Activity Patterns:
            - Peak Times: ${JSON.stringify(data.activityPatterns.peakActivityTimes)}
            - Edit Frequency: ${JSON.stringify(data.activityPatterns.editFrequency)}
            
            Provide insights about:
            1. Organization efficiency
            2. Content structure health
            3. Usage patterns
            4. Potential bottlenecks
            5. Areas for improvement`;
    }

    createRecommendationsPrompt(data) {
        return `Based on this Notion workspace data, generate specific, actionable recommendations:
            
            Workspace Metrics:
            ${JSON.stringify(data.structuralMetrics, null, 2)}
            
            Recent Activity:
            ${JSON.stringify(data.activityPatterns, null, 2)}
            
            Generate 5 specific recommendations to improve:
            1. Workspace organization
            2. Content accessibility
            3. Collaboration efficiency
            4. Information architecture
            5. Overall workspace health
            
            Format the response as a JSON array of strings.`;
    }

    async getHistoricalData(data) {
        // Extract historical data for trend analysis
        const timeseriesData = data.pages.map(page => ({
            timestamp: new Date(page.lastEdited).getTime(),
            depth: page.depth,
            connections: page.incomingLinks.length + page.outgoingLinks.length
        }));

        return timeseriesData.sort((a, b) => a.timestamp - b.timestamp);
    }
} 