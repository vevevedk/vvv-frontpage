import Papa from 'papaparse';

export interface ValidationResult {
  isValid: boolean;
  headers: string[];
  rows: string[][];
  missingColumns: string[];
  errorMessage?: string;
}

export const validateCsv = async (
  file: File, 
  requiredColumns: string[]
): Promise<ValidationResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const headers = results.data[0] as string[];
        const rows = results.data.slice(1) as string[][];
        
        // Check for missing required columns
        const missingColumns = requiredColumns.filter(
          col => !headers.includes(col)
        );

        const isValid = missingColumns.length === 0;

        resolve({
          isValid,
          headers,
          rows,
          missingColumns,
          errorMessage: isValid ? undefined : `Missing required columns: ${missingColumns.join(', ')}`
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}; 