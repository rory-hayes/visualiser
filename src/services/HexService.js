export class HexService {
    constructor(hexApiKey, hexProjectId) {
        if (!hexApiKey || !hexProjectId) {
            throw new Error('HexService requires both hexApiKey and hexProjectId');
        }
        this.HEX_API_URL = 'https://app.hex.tech/api/v1';
        this.HEX_API_KEY = hexApiKey;
        this.HEX_PROJECT_ID = hexProjectId;
    }

    async callHexAPI(workspaceId) {
        try {
            console.log('Calling Hex API with:', {
                projectId: this.HEX_PROJECT_ID,
                workspaceId,
                apiKeyPresent: !!this.HEX_API_KEY
            });

            const response = await fetch(`${this.HEX_API_URL}/projects/${this.HEX_PROJECT_ID}/runs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.HEX_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    parameters: {
                        workspace_id: workspaceId
                    }
                })
            });

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || response.statusText;
                } catch (e) {
                    errorMessage = response.statusText;
                }

                if (response.status === 401) {
                    throw new Error('Invalid Hex API key or unauthorized access');
                }
                throw new Error(`Hex API Error: ${errorMessage}`);
            }

            const data = await response.json();
            return data.run_id;
        } catch (error) {
            console.error('Error calling Hex API:', error);
            throw error;
        }
    }

    async waitForHexResults(runId, maxAttempts = 30) {
        let attempts = 0;
        const delay = 5000; // 5 seconds

        while (attempts < maxAttempts) {
            try {
                console.log(`Checking run status (attempt ${attempts + 1}/${maxAttempts}):`, runId);

                const response = await fetch(`${this.HEX_API_URL}/runs/${runId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.HEX_API_KEY}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Invalid Hex API key or unauthorized access');
                    }
                    throw new Error(`Failed to check run status: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Run status:', data.status);
                
                if (data.status === 'COMPLETED') {
                    return data.results;
                } else if (data.status === 'FAILED') {
                    throw new Error('Hex run failed');
                }

                await new Promise(resolve => setTimeout(resolve, delay));
                attempts++;
            } catch (error) {
                console.error('Error checking Hex run status:', error);
                throw error;
            }
        }

        throw new Error('Timeout waiting for Hex results');
    }

    async triggerHexRun(workspaceId) {
        try {
            if (!workspaceId) {
                throw new Error('workspaceId is required');
            }

            console.log('Triggering Hex run for workspace:', workspaceId);
            
            const runId = await this.callHexAPI(workspaceId);
            console.log('Hex run triggered:', runId);
            
            const results = await this.waitForHexResults(runId);
            console.log('Hex run completed with results');
            
            return {
                success: true,
                runId,
                results
            };
        } catch (error) {
            console.error('Error in triggerHexRun:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
} 