import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, id, ...props }, ref) => {
        const inputId = id || React.useId();

        return (
            <div className="w-full space-y-2">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-extrabold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-indigo-950 mb-2 block transition-all duration-300 group-focus-within:text-purple-700 group-focus-within:translate-x-1"
                    >
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white/60 px-4 py-2 text-sm font-semibold text-indigo-950 transition-all duration-300 placeholder:text-gray-400 focus:bg-white focus:border-purple-500 focus:ring-8 focus:ring-purple-500/10 focus:outline-none shadow-sm disabled:cursor-not-allowed disabled:opacity-50",
                        error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "",
                        className
                    )}
                    ref={ref}
                    id={inputId}
                    {...props}
                />
                {error && (
                    <p className="text-sm font-medium text-red-500">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
