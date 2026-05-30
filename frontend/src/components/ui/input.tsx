import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      required,
      id,
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    const labelId = label ? `${inputId}-label` : undefined;
    const describedBy = [
      ariaDescribedBy,
      error ? `${inputId}-error` : undefined,
      !error && helperText ? `${inputId}-helper` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label id={labelId} htmlFor={inputId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label}
            {required && <span className="ml-1 text-error-500" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400" aria-hidden>
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={!!error}
            aria-labelledby={ariaLabelledBy ?? labelId}
            aria-describedby={describedBy}
            className={cn(
              'h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500',
              'disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400',
              'dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500',
              'dark:border-neutral-700 dark:focus:border-primary-400',
              error
                ? 'border-error-500 focus:ring-error-500/40 dark:border-error-400'
                : 'border-neutral-300',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute inset-y-0 right-3 flex items-center text-neutral-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs font-medium text-error-600 dark:text-error-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
