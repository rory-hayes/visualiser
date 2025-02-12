export class HexService {
    constructor(hexApiKey, hexProjectId) {
        this.HEX_API_URL = 'https://app.hex.tech/api/v1';
        this.HEX_API_KEY = hexApiKey;
        this.HEX_PROJECT_ID = hexProjectId;
    }

    async callHexAPI(workspaceId) {
        try {
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
                const errorData = await response.json();
                throw new Error(`Hex API Error: ${errorData.message || response.statusText}`);
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
                const response = await fetch(`${this.HEX_API_URL}/runs/${runId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.HEX_API_KEY}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to check run status: ${response.statusText}`);
                }

                const data = await response.json();
                
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
            const runId = await this.callHexAPI(workspaceId);
            console.log('Hex run triggered:', runId);
            
            const results = await this.waitForHexResults(runId);
            console.log('Hex run completed');
            
            return {
                success: true,
                runId,
                results
            };
        } catch (error) {
            console.error('Error in triggerHexRun:', error);
            throw error;
        }
    }
} 