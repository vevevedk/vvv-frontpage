type ValidationResult = {
  isValid: boolean;
  missingColumns: string[];
  requiredColumns: string[];
};

export const validateCsv = (headers: string[], dataType: string): ValidationResult => {
  const requiredColumns: { [key: string]: string[] } = {
    search_console: [
      'Query',
      'Landing Page',
      'Date',
      'Country',
      'Impressions',
      'Url Clicks',
      'Average Position'
    ],
    // Add other data types here as needed
  };

  const required = requiredColumns[dataType] || [];
  const missing = required.filter(col => !headers.includes(col));

  return {
    isValid: missing.length === 0,
    missingColumns: missing,
    requiredColumns: required
  };
}; 