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
            
            // Track received chunks
            if (!existingResults.metadata.receivedChunks) {
                existingResults.metadata.receivedChunks = new Set();
            } else if (typeof existingResults.metadata.receivedChunks === 'number') {
                // Convert old format to Set if needed
                existingResults.metadata.receivedChunks = new Set([...Array(existingResults.metadata.receivedChunks).keys()].map(i => i + 1));
            }

            // Add current chunk to received chunks
            existingResults.metadata.receivedChunks.add(chunk);

            // Initialize arrays if they don't exist
            if (!existingResults.data.dataframe_2) existingResults.data.dataframe_2 = [];
            if (!existingResults.data.dataframe_5) existingResults.data.dataframe_5 = [];

            // Append chunk data to respective dataframes
            if (Array.isArray(data.dataframe_2)) {
                console.log(`Adding ${data.dataframe_2.length} records to dataframe_2`);
                existingResults.data.dataframe_2.push(...data.dataframe_2);
            }
            if (Array.isArray(data.dataframe_5)) {
                console.log(`Adding ${data.dataframe_5.length} records to dataframe_5`);
                existingResults.data.dataframe_5.push(...data.dataframe_5);
            }

            // For dataframe_3, which is a single object, update it if present
            if (data.dataframe_3) {
                console.log('Updating dataframe_3');
                existingResults.data.dataframe_3 = data.dataframe_3;
            }

            // Update metadata
            existingResults.metadata = {
                ...metadata,
                lastUpdated: new Date().toISOString(),
                receivedChunks: existingResults.metadata.receivedChunks,
                totalChunks: total_chunks,
                isComplete: existingResults.metadata.receivedChunks.size === total_chunks
            };

            // Convert Set to Array for JSON serialization
            const jsonResults = {
                ...existingResults,
                metadata: {
                    ...existingResults.metadata,
                    receivedChunks: Array.from(existingResults.metadata.receivedChunks)
                }
            };

            fs.writeFileSync(
                this.resultsFile,
                JSON.stringify(jsonResults, null, 2)
            );

            console.log('Results saved:', {
                dataframe2Length: existingResults.data.dataframe_2.length,
                hasDataframe3: !!existingResults.data.dataframe_3,
                dataframe5Length: existingResults.data.dataframe_5.length,
                receivedChunks: existingResults.metadata.receivedChunks.size,
                totalChunks: total_chunks,
                isComplete: existingResults.metadata.isComplete
            });

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
                const results = JSON.parse(data);
                
                // Convert receivedChunks array back to Set if it exists
                if (results.metadata && Array.isArray(results.metadata.receivedChunks)) {
                    results.metadata.receivedChunks = new Set(results.metadata.receivedChunks);
                }
                
                return results;
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
                receivedChunks: new Set(),
                totalChunks: 0,
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
            if (!results?.metadata) return false;
            
            const { receivedChunks, totalChunks } = results.metadata;
            if (!receivedChunks || !totalChunks) return false;
            
            return receivedChunks.size === totalChunks;
        } catch (error) {
            console.error('Error checking results completion:', error);
            return false;
        }
    }
} 