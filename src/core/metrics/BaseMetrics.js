export class BaseMetrics {
    constructor(notionClient = null) {
        this.notion = notionClient;
    }

    // Utility methods that will be shared across all metric calculators
    formatNumber(value) {
        if (value === null || value === undefined) return 'N/A';
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
    }

    formatDecimal(value, decimals = 2) {
        if (value === null || value === undefined) return 'N/A';
        return typeof value === 'number' ? value.toFixed(decimals) : value.toString();
    }

    formatPercentage(value, decimals = 1) {
        if (value === null || value === undefined) return 'N/A';
        return `${this.formatDecimal(value * 100, decimals)}%`;
    }

    formatCurrency(value) {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    calculateMedian(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return 0;
        const sorted = numbers.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        return sorted[middle];
    }

    average(array) {
        return array.length > 0 ? array.reduce((a, b) => a + b, 0) / array.length : 0;
    }

    validateData(dataframe_2, dataframe_3, dataframe_5) {
        const errors = [];
        
        if (!dataframe_2) {
            errors.push('dataframe_2 is null or undefined');
        } else if (!Array.isArray(dataframe_2)) {
            errors.push('dataframe_2 must be an array');
        }

        if (!dataframe_3) {
            errors.push('dataframe_3 is null or undefined');
        } else if (typeof dataframe_3 !== 'object') {
            errors.push('dataframe_3 must be an object');
        }

        if (!dataframe_5) {
            errors.push('dataframe_5 is null or undefined');
        } else if (typeof dataframe_5 !== 'object') {
            errors.push('dataframe_5 must be an object or array');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }
}
