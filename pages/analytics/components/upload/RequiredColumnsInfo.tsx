import React from 'react';
import styles from '@/styles/analytics/Analytics.module.css';
import { validateCsv } from '../../../../utils/csvValidation';

interface Props {
  dataType: string;
}

const RequiredColumnsInfo: React.FC<Props> = ({ dataType }) => {
  // Reuse the validation utility to get required columns
  const { requiredColumns } = validateCsv([], dataType);

  return (
    <div className={styles.requiredColumns}>
      <h4>Required Columns</h4>
      <ul>
        {requiredColumns.map((column) => (
          <li key={column}>{column}</li>
        ))}
      </ul>
      <p className={styles.note}>
        Please ensure your CSV file contains all required columns.
        Column names are case-sensitive.
      </p>
    </div>
  );
};

export default RequiredColumnsInfo; 