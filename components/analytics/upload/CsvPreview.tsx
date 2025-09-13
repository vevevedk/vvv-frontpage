import React from 'react';
import styles from '@/styles/analytics/Analytics.module.css';

interface CsvPreviewProps {
  headers: string[];
  rows: string[][];
  requiredColumns: string[];
  missingColumns: string[];
}

const CsvPreview: React.FC<CsvPreviewProps> = ({ 
  headers, 
  rows, 
  requiredColumns,
  missingColumns 
}) => {
  return (
    <div className={styles.previewContainer}>
      <h3>CSV Preview</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.previewTable}>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className={`
                    ${styles.headerCell}
                    ${requiredColumns.includes(header) ? styles.requiredColumn : ''}
                    ${missingColumns.includes(header) ? styles.missingColumn : ''}
                  `}
                >
                  {header}
                  {requiredColumns.includes(header) && <span className={styles.requiredIndicator}>*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 5).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {missingColumns.length > 0 && (
        <div className={styles.validationError}>
          Missing required columns: {missingColumns.join(', ')}
        </div>
      )}
    </div>
  );
};

export default CsvPreview; 