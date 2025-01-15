import { OpenAI } from 'openai';
import { processWorkspaceData } from '../utils/dataProcessing.js';

const HEX_API_KEY = '4fe1113357488bccca1d029756edd4f6c361be53f08201a733173e2e478e012a436eb9adfb73e93dc2aa179c241b81df';

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

        try {
            console.log('Processing workspace data for insights...');
            const processedData = processWorkspaceData(workspaceData);
            
            // Generate insights sequentially to handle dependencies
            const structureAnalysis = await this.analyzeWorkspaceStructure(processedData);
            const recommendations = await this.generateRecommendations(processedData, structureAnalysis);
            const trends = await this.analyzeTrends(processedData);

            return {
                insights: structureAnalysis,
                recommendations: recommendations,
                trends: trends
            };
        } catch (error) {
            console.error('Error generating AI insights:', error);
            return this.getDefaultInsights(error);
        }
    }

    async analyzeWorkspaceStructure(data) {
        const prompt = `As an AI workspace analyst, provide a detailed analysis of this Notion workspace:

        METRICS:
        - Total Pages: ${data.totalPages || 0}
        - Max Depth: ${data.maxDepth || 0}
        - Avg Connections: ${data.avgConnections || 0}
        - Active Pages: ${data.activePages || 0}
        
        CONTENT TYPES:
        ${JSON.stringify(data.contentDistribution?.byType || {}, null, 2)}
        
        HIERARCHY:
        ${JSON.stringify(data.contentDistribution?.byDepth || {}, null, 2)}
        
        ACTIVITY:
        - Peak Hours: ${JSON.stringify(data.activityPatterns?.peakActivityTimes || {})}
        - Edit Frequency: ${JSON.stringify(data.activityPatterns?.editFrequency || {})}

        Analyze:
        1. Organization Efficiency
        2. Content Structure
        3. Usage Patterns
        4. Potential Issues
        5. Growth Potential

        Format as JSON:
        {
            "efficiency": { "score": number, "analysis": string },
            "structure": { "score": number, "analysis": string },
            "usage": { "score": number, "analysis": string },
            "issues": string[],
            "growthPotential": { "score": number, "analysis": string }
        }`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error('Error in structure analysis:', error);
            return {
                efficiency: { score: 0, analysis: "AI analysis unavailable" },
                structure: { score: 0, analysis: "AI analysis unavailable" },
                usage: { score: 0, analysis: "AI analysis unavailable" },
                issues: [error.message],
                growthPotential: { score: 0, analysis: "AI analysis unavailable" }
            };
        }
    }

    async generateRecommendations(data, structureAnalysis) {
        const prompt = `Based on this Notion workspace data, provide actionable recommendations:

        CURRENT STATE:
        ${JSON.stringify(data.structuralMetrics || {}, null, 2)}
        
        ACTIVITY:
        ${JSON.stringify(data.activityPatterns || {}, null, 2)}

        PREVIOUS ANALYSIS:
        ${JSON.stringify(structureAnalysis, null, 2)}

        Generate recommendations for:
        1. Organization
        2. Content Structure
        3. Collaboration
        4. Information Architecture
        5. Growth Strategy

        Format as JSON array:
        [{
            "category": string,
            "priority": "high" | "medium" | "low",
            "recommendation": string,
            "benefit": string,
            "implementation": string,
            "effort": "easy" | "medium" | "complex",
            "impact": "high" | "medium" | "low"
        }]`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            const recommendations = JSON.parse(completion.choices[0].message.content);
            return Array.isArray(recommendations) ? recommendations : [];
        } catch (error) {
            console.error('Error generating recommendations:', error);
            return [];
        }
    }

    async analyzeTrends(data) {
        try {
            if (!data || !data.nodes || !Array.isArray(data.nodes)) {
                console.warn('Invalid data structure for trend analysis');
                return null;
            }

            const historicalData = data.nodes
                .filter(node => node && node.lastEdited)
                .map(node => ({
                    date: new Date(node.lastEdited),
                    type: node.type || 'unknown'
                }))
                .sort((a, b) => a.date - b.date);

            if (historicalData.length === 0) {
                return null;
            }

            // Calculate basic trends
            return {
                totalPages: data.nodes.length,
                activePages: historicalData.filter(item => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return item.date >= thirtyDaysAgo;
                }).length,
                growthRate: this.calculateGrowthRate(historicalData),
                contentTypes: this.analyzeContentTypes(data.nodes)
            };
        } catch (error) {
            console.error('Error in trend analysis:', error);
            return null;
        }
    }

    calculateGrowthRate(historicalData) {
        try {
            const periods = this.groupByMonth(historicalData);
            return Object.entries(periods).map(([month, count]) => ({
                month,
                count
            }));
        } catch (error) {
            console.error('Error calculating growth rate:', error);
            return [];
        }
    }

    groupByMonth(data) {
        return data.reduce((acc, item) => {
            const month = item.date.toISOString().slice(0, 7); // YYYY-MM format
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});
    }

    analyzeContentTypes(nodes) {
        return nodes.reduce((acc, node) => {
            const type = node.type || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
    }

    getDefaultInsights(error = null) {
        return {
            insights: error ? 
                `Error analyzing workspace: ${error.message}` : 
                "AI analysis is currently unavailable.",
            recommendations: [],
            trends: null
        };
    }

    async generateHexReport(workspaceId) {
        if (!this.enabled) {
            throw new Error('AI features are disabled due to missing API key');
        }

        try {
            const response = await fetch('https://app.hex.tech/notion/hex/21c6c24a-60e8-487c-b03a-1f04dda4f918/draft/logic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer 4fe1113357488bccca1d029756edd4c6c361be53f08201a733173e2e478e012a436eb9adfb73e93dc2aa179c241b81df`
                },
                body: JSON.stringify({
                    data: {
                        _input_number: workspaceId,
                    },
                    metadata: {
                        _input_number: workspaceId,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error generating Hex report:', error);
            throw error;
        }
    }

    async generateReport(workspaceId) {
        try {
            // Convert workspaceId to number and validate
            const numericWorkspaceId = parseInt(workspaceId, 10);
            if (isNaN(numericWorkspaceId)) {
                throw new Error('Workspace ID must be a valid number');
            }

            // Extract project ID and construct the URL for the API endpoint
            const projectId = '21c6c24a-60e8-487c-b03a-1f04dda4f918';
            const hexUrl = `https://app.hex.tech/api/v1/projects/${projectId}/runs`;
            
            console.log('Initiating Hex run with workspace ID:', numericWorkspaceId);

            // Create payload according to Hex API specifications
            const payload = {
                parameters: {
                    numeric_input_1: numericWorkspaceId
                },
                project_id: projectId,
                version: 'latest'  // Add version specification
            };

            console.log('Hex API request payload:', payload);

            const createRunResponse = await fetch(hexUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HEX_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Log the full response for debugging
            const responseText = await createRunResponse.text();
            console.log('Hex API response:', {
                status: createRunResponse.status,
                statusText: createRunResponse.statusText,
                response: responseText
            });

            if (!createRunResponse.ok) {
                throw new Error(`Failed to create Hex run: ${createRunResponse.status} - ${responseText}`);
            }

            // Parse the response as JSON
            const runData = JSON.parse(responseText);
            console.log('Hex run initiated successfully:', runData);
            
            if (!runData.runId) {
                throw new Error('No runId received from Hex API');
            }

            // Wait for the project run to complete and get results
            const result = await this.waitForHexRunCompletion(runData.runId, projectId);

            return {
                success: true,
                runId: runData.runId,
                status: result.status,
                data: result.data
            };
        } catch (error) {
            console.error('Error generating report:', error);
            // Include more details in the error response
            throw new Error(`Failed to generate report: ${error.message}. Check console for details.`);
        }
    }

    async waitForHexRunCompletion(runId, projectId, maxAttempts = 30) {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        let attempts = 0;

        // Get the base URL from environment or default to production URL
        const baseUrl = process.env.BASE_URL || 'https://visualiser-xhjh.onrender.com';

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`https://app.hex.tech/api/v1/projects/${projectId}/runs/${runId}`, {
                    headers: {
                        'Authorization': `Bearer ${HEX_API_KEY}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to check run status: ${response.statusText}`);
                }

                const status = await response.json();
                console.log('Run status:', status);

                if (status.status === 'COMPLETED') {
                    // Try to fetch results from our stored results using absolute URL
                    const resultsResponse = await fetch(`${baseUrl}/api/hex-results/latest`);
                    
                    if (resultsResponse.ok) {
                        const results = await resultsResponse.json();
                        return {
                            status: 'completed',
                            data: results.data
                        };
                    }
                    
                    // If no results found yet, wait a bit longer
                    if (attempts < maxAttempts - 1) {
                        await delay(2000);
                        attempts++;
                        continue;
                    }
                    
                    throw new Error('Run completed but results not available');
                }

                if (status.status === 'FAILED') {
                    throw new Error('Hex project run failed');
                }

                // Wait 2 seconds before next check
                await delay(2000);
                attempts++;
            } catch (error) {
                console.error('Error checking run status:', error);
                throw error;
            }
        }

        throw new Error('Timeout waiting for Hex project completion');
    }
} 