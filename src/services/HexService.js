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
        if (!workspaceId) {
            throw new Error('workspaceId is required');
        }

        const response = await fetch(`${this.HEX_API_URL}/projects/${this.HEX_PROJECT_ID}/runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.HEX_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                parameters: {
                    workspace_id: workspaceId
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to call Hex API');
        }

        if (!data.run_id) {
            throw new Error('Invalid response from Hex API: Missing run_id');
        }

        return data.run_id;
    }

    async waitForHexResults(runId, maxAttempts = 30) {
        if (!runId) {
            throw new Error('runId is required');
        }

        let attempts = 0;
        const delay = 5000; // 5 seconds

        while (attempts < maxAttempts) {
            const response = await fetch(`${this.HEX_API_URL}/runs/${runId}`, {
                headers: {
                    'Authorization': `Bearer ${this.HEX_API_KEY}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to check run status');
            }

            if (data.status === 'COMPLETED') {
                if (!data.results) {
                    throw new Error('Completed run has no results');
                }
                return data.results;
            } else if (data.status === 'FAILED') {
                throw new Error('Hex run failed');
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            attempts++;
        }

        throw new Error('Timeout waiting for Hex results');
    }

    async triggerHexRun(workspaceId) {
        try {
            const runId = await this.callHexAPI(workspaceId);
            const results = await this.waitForHexResults(runId);
            
            return {
                success: true,
                runId,
                results
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
} 