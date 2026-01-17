import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, fullWidth = true, ...props }, ref) => {
        return (
            <div className={cn("flex flex-col gap-1.5", fullWidth ? "w-full" : "", className)}>
                {label && (
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">{label}</span>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "rounded-xl border-[#dce0e4] dark:border-gray-700 bg-white dark:bg-gray-800 h-10 sm:h-11 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900 placeholder:text-gray-400 dark:text-white",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-200"
                    )}
                    {...props}
                />
                {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
            </div>
        );
    }
);

Input.displayName = "Input";
