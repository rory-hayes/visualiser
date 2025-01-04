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
            return this.getDefaultInsights();
        }

        const processedData = processWorkspaceData(workspaceData);
        
        try {
            const [structureAnalysis, recommendations, trends] = await Promise.all([
                this.analyzeWorkspaceStructure(processedData),
                this.generateRecommendations(processedData),
                this.analyzeTrends(processedData)
            ]);

            return {
                structureAnalysis,
                recommendations,
                trends,
                summary: await this.generateExecutiveSummary(structureAnalysis, recommendations, trends)
            };
        } catch (error) {
            console.error('Error generating AI insights:', error);
            return this.getDefaultInsights(error);
        }
    }

    async analyzeWorkspaceStructure(data) {
        const prompt = `As a Notion workspace optimization expert, analyze this workspace:

        WORKSPACE METRICS:
        - Total Pages: ${data.totalPages}
        - Max Depth: ${data.maxDepth}
        - Avg Connections: ${data.avgConnections}
        - Active Pages: ${data.activePages}
        
        CONTENT DISTRIBUTION:
        Pages by Type:
        ${JSON.stringify(data.contentDistribution.byType, null, 2)}
        
        Hierarchy Depth:
        ${JSON.stringify(data.contentDistribution.byDepth, null, 2)}
        
        ACTIVITY PATTERNS:
        - Peak Activity: ${JSON.stringify(data.activityPatterns.peakActivityTimes)}
        - Edit Frequency: ${JSON.stringify(data.activityPatterns.editFrequency)}
        - Database Usage: ${JSON.stringify(data.databaseMetrics)}

        Provide a comprehensive analysis focusing on:
        1. Information Architecture
            - Evaluate page hierarchy and navigation flow
            - Assess database structure and relations
            - Identify potential structural bottlenecks
        
        2. Workspace Efficiency
            - Content organization best practices
            - Database vs. page usage optimization
            - Template utilization opportunities
        
        3. Collaboration Patterns
            - Team workspace usage patterns
            - Content accessibility and findability
            - Knowledge sharing effectiveness
        
        4. Growth Scalability
            - Current structure sustainability
            - Potential bottlenecks as workspace grows
            - Areas needing restructuring
        
        Format as JSON:
        {
            "architecture": {
                "score": number,
                "strengths": string[],
                "weaknesses": string[],
                "notionSpecificTips": string[]
            },
            "efficiency": {
                "score": number,
                "currentPractices": string[],
                "improvementAreas": string[],
                "notionFeatureSuggestions": string[]
            },
            "collaboration": {
                "score": number,
                "patterns": string[],
                "bottlenecks": string[],
                "notionCollaborationTips": string[]
            },
            "scalability": {
                "score": number,
                "sustainableElements": string[],
                "riskAreas": string[],
                "growthRecommendations": string[]
            }
        }`;

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content);
    }

    async generateRecommendations(data) {
        const prompt = `As a Notion workspace consultant, provide actionable recommendations:

        CURRENT STATE:
        ${JSON.stringify(data.structuralMetrics, null, 2)}
        
        ACTIVITY PATTERNS:
        ${JSON.stringify(data.activityPatterns, null, 2)}

        DATABASES:
        ${JSON.stringify(data.databaseMetrics, null, 2)}

        Provide specific, Notion-focused recommendations for:
        1. Immediate Optimizations (Next 7 Days)
        2. Short-term Improvements (Next 30 Days)
        3. Long-term Strategy (90+ Days)

        For each recommendation:
        - Use specific Notion features and capabilities
        - Consider built-in templates and database types
        - Include step-by-step implementation guides
        - Estimate effort and impact
        - Consider team adoption factors

        Format as JSON array:
        [{
            "timeframe": "immediate" | "short-term" | "long-term",
            "category": "structure" | "efficiency" | "collaboration" | "automation",
            "title": string,
            "description": string,
            "notionFeatures": string[],
            "implementation": {
                "steps": string[],
                "estimatedTime": string,
                "prerequisiteSetup": string[]
            },
            "impact": {
                "score": number,
                "benefits": string[],
                "metrics": string[]
            },
            "effort": {
                "level": "easy" | "medium" | "complex",
                "teamFactors": string[],
                "resourceNeeds": string[]
            }
        }]`;

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content);
    }

    async analyzeTrends(data) {
        const historicalData = await this.getHistoricalData(data);
        
        return {
            growth: this.calculateGrowthTrends(historicalData),
            activity: this.calculateActivityTrends(historicalData),
            structure: this.calculateStructuralTrends(historicalData)
        };
    }

    async generateExecutiveSummary(structure, recommendations, trends) {
        const prompt = `Create a concise executive summary based on:
        
        STRUCTURE ANALYSIS:
        ${JSON.stringify(structure, null, 2)}
        
        RECOMMENDATIONS:
        ${JSON.stringify(recommendations, null, 2)}
        
        TRENDS:
        ${JSON.stringify(trends, null, 2)}

        Provide a brief, high-level overview focusing on:
        1. Key Strengths
        2. Critical Issues
        3. Priority Actions
        4. Growth Trajectory

        Format as a concise paragraph.`;

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        });

        return completion.choices[0].message.content;
    }

    calculateGrowthTrends(historicalData) {
        // Implement growth trend analysis
        return {
            pageGrowth: this.calculatePageGrowthRate(historicalData),
            contentExpansion: this.analyzeContentExpansion(historicalData),
            projectedGrowth: this.projectFutureGrowth(historicalData)
        };
    }

    calculateActivityTrends(historicalData) {
        // Implement activity trend analysis
        return {
            dailyActivity: this.analyzeDailyActivity(historicalData),
            peakTimes: this.analyzePeakTimes(historicalData),
            userEngagement: this.analyzeUserEngagement(historicalData)
        };
    }

    calculateStructuralTrends(historicalData) {
        // Implement structural trend analysis
        return {
            depthChanges: this.analyzeDepthChanges(historicalData),
            connectivityTrends: this.analyzeConnectivityTrends(historicalData),
            organizationalShifts: this.analyzeOrganizationalShifts(historicalData)
        };
    }

    getDefaultInsights(error = null) {
        return {
            structureAnalysis: {
                efficiency: { score: 0, analysis: "AI analysis unavailable" },
                structure: { score: 0, analysis: "AI analysis unavailable" },
                usage: { score: 0, analysis: "AI analysis unavailable" },
                issues: error ? [error.message] : ["AI service is disabled"],
                growthPotential: { score: 0, analysis: "AI analysis unavailable" }
            },
            recommendations: [],
            trends: null,
            summary: "AI insights are currently unavailable. Please check your configuration."
        };
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