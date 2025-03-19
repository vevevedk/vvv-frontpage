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