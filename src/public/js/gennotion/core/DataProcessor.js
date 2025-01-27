export class DataProcessor {
    constructor() {
        this.accumulatedData = {
            dataframe_2: [],
            dataframe_3: null
        };
        this.lastProcessedChunk = 0;
        this.totalExpectedRecords = 0;
    }

    reset() {
        this.accumulatedData = {
            dataframe_2: [],
            dataframe_3: null
        };
        this.lastProcessedChunk = 0;
        this.totalExpectedRecords = 0;
    }

    processChunk(data) {
        try {
            if (!data.data?.data?.dataframe_2) {
                return null;
            }

            const newRecords = data.data.data.dataframe_2;
            const currentChunk = data.currentChunk;

            // Only process new chunks
            if (currentChunk > this.lastProcessedChunk) {
                this.accumulatedData.dataframe_2 = this.accumulatedData.dataframe_2.concat(newRecords);
                
                if (data.data.data.dataframe_3 && !this.accumulatedData.dataframe_3) {
                    this.accumulatedData.dataframe_3 = data.data.data.dataframe_3;
                }
                
                this.lastProcessedChunk = currentChunk;
                
                return {
                    currentChunk,
                    totalChunks: data.totalChunks,
                    accumulatedRecords: this.accumulatedData.dataframe_2.length,
                    totalRecords: data.totalRecords,
                    isComplete: data.isLastChunk || this.accumulatedData.dataframe_2.length >= this.totalExpectedRecords
                };
            }

            return null;
        } catch (error) {
            console.error('Error processing chunk:', error);
            throw error;
        }
    }

    setTotalExpectedRecords(total) {
        this.totalExpectedRecords = total;
    }

    getProcessedData() {
        return {
            data: {
                dataframe_2: this.accumulatedData.dataframe_2,
                dataframe_3: this.accumulatedData.dataframe_3
            },
            metadata: {
                status: 'success',
                timestamp: new Date().toISOString()
            },
            success: true
        };
    }

    isProcessingComplete() {
        return this.totalExpectedRecords > 0 && 
               this.accumulatedData.dataframe_2.length >= this.totalExpectedRecords;
    }
} 