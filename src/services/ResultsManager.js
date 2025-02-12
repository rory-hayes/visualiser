import fs from 'fs';
import path from 'path';

export class ResultsManager {
    constructor(resultsDir = 'results') {
        this.resultsDir = resultsDir;
        this.resultsFile = path.join(this.resultsDir, 'results.json');
        this.ensureResultsDirectory();
    }

    ensureResultsDirectory() {
        if (!fs.existsSync(this.resultsDir)) {
            fs.mkdirSync(this.resultsDir, { recursive: true });
        }
    }

    saveResults(results) {
        try {
            const existingResults = this.loadResults() || this.initializeResultsStructure();
            const { data, metadata } = results;

            if (!data || !metadata) {
                console.error('Invalid results format:', results);
                return false;
            }

            const { chunk, total_chunks } = metadata;
            
            // Initialize arrays if they don't exist
            if (!existingResults.data.dataframe_2) existingResults.data.dataframe_2 = [];
            if (!existingResults.data.dataframe_5) existingResults.data.dataframe_5 = [];

            // Append chunk data to respective dataframes
            if (data.dataframe_2) {
                existingResults.data.dataframe_2.push(...data.dataframe_2);
            }
            if (data.dataframe_5) {
                existingResults.data.dataframe_5.push(...data.dataframe_5);
            }

            // For dataframe_3, which is a single object, update it if present
            if (data.dataframe_3) {
                existingResults.data.dataframe_3 = data.dataframe_3;
            }

            // Update metadata
            existingResults.metadata = {
                ...metadata,
                lastUpdated: new Date().toISOString(),
                receivedChunks: (existingResults.metadata?.receivedChunks || 0) + 1,
                isComplete: metadata.chunk === metadata.total_chunks
            };

            fs.writeFileSync(
                this.resultsFile,
                JSON.stringify(existingResults, null, 2)
            );

            return true;
        } catch (error) {
            console.error('Error saving results:', error);
            return false;
        }
    }

    loadResults() {
        try {
            if (fs.existsSync(this.resultsFile)) {
                const data = fs.readFileSync(this.resultsFile, 'utf8');
                return JSON.parse(data);
            }
            return this.initializeResultsStructure();
        } catch (error) {
            console.error('Error loading results:', error);
            return this.initializeResultsStructure();
        }
    }

    initializeResultsStructure() {
        return {
            data: {
                dataframe_2: [],
                dataframe_3: {},
                dataframe_5: []
            },
            metadata: {
                receivedChunks: 0,
                isComplete: false,
                lastUpdated: new Date().toISOString()
            }
        };
    }

    clearResults() {
        try {
            if (fs.existsSync(this.resultsFile)) {
                fs.unlinkSync(this.resultsFile);
            }
            return true;
        } catch (error) {
            console.error('Error clearing results:', error);
            return false;
        }
    }

    getResultsStream() {
        return fs.createReadStream(this.resultsFile);
    }

    isResultsComplete() {
        try {
            const results = this.loadResults();
            return results?.metadata?.isComplete || false;
        } catch (error) {
            console.error('Error checking results completion:', error);
            return false;
        }
    }
} 