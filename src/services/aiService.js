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
        return `As an AI workspace analyst, analyze this Notion workspace data and provide valuable insights:

        WORKSPACE METRICS:
        - Total Pages: ${data.totalPages}
        - Max Depth: ${data.maxDepth}
        - Average Connections: ${data.avgConnections}
        - Active Pages (Last 30 days): ${data.activePages}
        
        CONTENT DISTRIBUTION:
        ${JSON.stringify(data.contentDistribution.byType, null, 2)}
        
        PAGE HIERARCHY:
        - Depth Distribution: ${JSON.stringify(data.contentDistribution.byDepth, null, 2)}
        
        ACTIVITY PATTERNS:
        - Peak Activity Hours: ${JSON.stringify(data.activityPatterns.peakActivityTimes)}
        - Recent Edit Frequency: ${JSON.stringify(data.activityPatterns.editFrequency)}

        Please provide a comprehensive analysis focusing on:
        1. Workspace Organization:
           - Evaluate the hierarchy structure
           - Identify potential organizational bottlenecks
           - Assess content distribution efficiency
        
        2. Usage Patterns:
           - Analyze activity patterns and their implications
           - Identify peak productivity periods
           - Highlight underutilized areas
        
        3. Connectivity Analysis:
           - Evaluate page relationships and connections
           - Identify isolated content
           - Suggest potential linking opportunities
        
        4. Growth and Scaling:
           - Assess workspace scalability
           - Identify potential growth challenges
           - Suggest structural improvements

        Format the response in clear, concise paragraphs with specific, actionable insights.`;
    }

    createRecommendationsPrompt(data) {
        return `Based on the following Notion workspace analysis, provide specific, actionable recommendations:

        CURRENT STATE:
        ${JSON.stringify(data.structuralMetrics, null, 2)}
        
        ACTIVITY METRICS:
        ${JSON.stringify(data.activityPatterns, null, 2)}

        Generate 5 specific recommendations focusing on:
        1. Improving workspace organization and findability
        2. Enhancing content connectivity and relationships
        3. Optimizing page hierarchy and depth
        4. Boosting workspace efficiency and usability
        5. Preparing for future growth and scaling

        For each recommendation:
        - Provide a clear, actionable step
        - Explain the expected benefit
        - Include implementation guidance
        
        Format as a JSON array of objects with structure:
        {
            "recommendation": "The specific action to take",
            "benefit": "Expected improvement or outcome",
            "implementation": "How to implement this change"
        }`;
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