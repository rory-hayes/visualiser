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
            const existingResults = this.loadResults();
            const updatedResults = {
                ...existingResults,
                ...results,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(
                this.resultsFile,
                JSON.stringify(updatedResults, null, 2)
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
            return {};
        } catch (error) {
            console.error('Error loading results:', error);
            return {};
        }
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
} 