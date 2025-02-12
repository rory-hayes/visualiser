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

        console.log('Calling Hex API with:', {
            url: `${this.HEX_API_URL}/projects/${this.HEX_PROJECT_ID}/runs`,
            workspaceId
        });

        // Format request body according to Hex API requirements
        const requestBody = {
            inputParams: {
                _input_text: workspaceId
            }
        };

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${this.HEX_API_URL}/projects/${this.HEX_PROJECT_ID}/runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.HEX_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        console.log('Raw API Response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            console.error('Failed to parse response:', error);
            throw new Error('Invalid JSON response from Hex API');
        }

        if (!response.ok) {
            console.error('Hex API error:', {
                status: response.status,
                statusText: response.statusText,
                data
            });
            throw new Error(data.message || `Hex API error: ${response.statusText}`);
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
            console.log(`Checking run status (attempt ${attempts + 1}/${maxAttempts}):`, runId);

            const response = await fetch(`${this.HEX_API_URL}/runs/${runId}`, {
                headers: {
                    'Authorization': `Bearer ${this.HEX_API_KEY}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            console.log('Run status response:', {
                status: response.status,
                data
            });

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
            console.log('Triggering Hex run for workspace:', workspaceId);
            const runId = await this.callHexAPI(workspaceId);
            console.log('Successfully got run ID:', runId);
            const results = await this.waitForHexResults(runId);
            console.log('Successfully got results');
            
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