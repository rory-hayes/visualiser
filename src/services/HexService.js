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

        if (!data.runId) {
            throw new Error('Invalid response from Hex API: Missing runId');
        }

        return data.runId;
    }

    async checkRunStatus(runId) {
        if (!runId) {
            throw new Error('runId is required');
        }

        console.log(`Checking run status for: ${runId}`);

        const response = await fetch(`${this.HEX_API_URL}/projects/${this.HEX_PROJECT_ID}/runs/${runId}`, {
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

        return data.status;
    }

    async triggerHexRun(workspaceId) {
        try {
            console.log('Triggering Hex run for workspace:', workspaceId);
            const runId = await this.callHexAPI(workspaceId);
            console.log('Successfully got run ID:', runId);
            
            // Wait for the run to start
            let status = await this.checkRunStatus(runId);
            while (status === 'PENDING') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                status = await this.checkRunStatus(runId);
            }
            
            if (status === 'FAILED') {
                throw new Error('Hex run failed to start');
            }
            
            return {
                success: true,
                runId
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