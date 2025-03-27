export function cleanValue(value: any, type: 'integer' | 'decimal' | 'percentage'): number | null {
    if (!value || value === '--') return null;
    
    // Convert to string and clean
    const strValue = value.toString().replace(/,/g, '');
    
    // Handle percentage values
    if (type === 'percentage') {
        if (strValue.includes('%')) {
            return Number(strValue.replace('%', '')) / 100;
        }
        if (strValue.startsWith('>')) return Number(strValue.slice(1).trim());
        if (strValue.startsWith('<')) return Number(strValue.slice(1).trim());
    }
    
    // Handle numeric values
    if (type === 'decimal') {
        return Number(parseFloat(strValue).toFixed(2));
    }
    
    return parseInt(strValue, 10);
}

export function formatDate(date: string): string {
    // Ensure date is in YYYY-MM-DD format
    const [year, month, day] = date.split(/[-/]/);
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function cleanPercentageString(value: string): string | null {
    if (!value || value === '--') return null;
    if (value.startsWith('>')) return value.slice(1).trim();
    if (value.startsWith('<')) return value.slice(1).trim();
    return value.replace('%', '').trim();
}

export function validateNumeric(value: any): boolean {
    if (value === null || value === undefined) return false;
    return !isNaN(Number(value.toString().replace(/,/g, '')));
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
} 