import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { }

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm ring-offset-white dark:ring-offset-gray-900 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };

interface NumericInputProps extends Omit<InputProps, 'type' | 'onChange'> {
    value: number | '';
    onChange: (value: number | '') => void;
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
    ({ className, value, onChange, onKeyDown, ...props }, ref) => {
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.currentTarget.blur();
            }
            onKeyDown?.(e);
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            if (val === '') {
                onChange('');
                return;
            }
            const num = parseInt(val, 10);
            if (!isNaN(num) && num >= 0) {
                onChange(num);
            }
        };

        return (
            <Input
                ref={ref}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className={cn("text-right font-mono text-lg", className)}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                {...props}
            />
        );
    }
);
NumericInput.displayName = "NumericInput";
