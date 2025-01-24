export class EventManager {
    constructor() {
        this.retryCount = 0;
        this.MAX_RETRIES = 5;
        this.eventSource = null;
        this.onMessage = null;
        this.onError = null;
        this.onProgress = null;
    }

    connect(endpoint = '/api/hex-results/stream') {
        if (this.eventSource) {
            this.eventSource.close();
        }

        this.eventSource = new EventSource(endpoint);
        
        this.eventSource.onopen = () => {
            console.log('EventSource connection opened');
            this.retryCount = 0;
            this.onProgress?.('Connection established');
        };

        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Error processing message:', error);
                this.onError?.('Error processing message: ' + error.message);
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            this.handleError(error);
        };

        return this.eventSource;
    }

    handleMessage(data) {
        try {
            if (data.type === 'progress') {
                this.onProgress?.(data.message, data);
                return;
            }

            this.onMessage?.(data);
        } catch (error) {
            console.error('Error in handleMessage:', error);
            this.onError?.('Error handling message: ' + error.message);
        }
    }

    handleError(error) {
        if (this.eventSource?.readyState === EventSource.CLOSED) {
            if (this.retryCount < this.MAX_RETRIES) {
                this.retryCount++;
                this.onProgress?.(`Connection lost. Retry attempt ${this.retryCount}/${this.MAX_RETRIES}...`);
                setTimeout(() => {
                    this.connect();
                }, 2000 * this.retryCount);
            } else {
                this.onError?.('Failed to maintain connection after multiple attempts. Please try again.');
            }
        }
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    setHandlers({ onMessage, onError, onProgress }) {
        this.onMessage = onMessage;
        this.onError = onError;
        this.onProgress = onProgress;
    }
} 