import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showLabel?: boolean;
}

export default function FormInput({
  label,
  error,
  showLabel = true,
  className = '',
  ...props
}: FormInputProps) {
  const inputClasses = `
    appearance-none relative block w-full px-3 py-2 border
    ${error ? 'border-red-300' : 'border-gray-300'}
    placeholder-gray-500 text-gray-900 rounded-md
    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
    focus:z-10 sm:text-sm
    ${className}
  `;

  return (
    <div>
      {showLabel && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        {...props}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${props.id}-error` : undefined}
      />
      {error && (
        <p
          className="mt-1 text-sm text-red-600"
          id={`${props.id}-error`}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
} 