import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hideErrorText?: boolean;
    rightElement?: React.ReactNode;
    restrictNumbers?: boolean;
    restrictSymbols?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, hideErrorText, rightElement, restrictNumbers, restrictSymbols, id, ...props }, ref) => {
        const generatedId = React.useId();
        const inputId = id || generatedId;
        const [showPassword, setShowPassword] = React.useState(false);

        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
                <div className="relative group/input">
                    <input
                        type={inputType}
                        className={cn(
                            "flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white/60 px-4 py-2 text-sm font-semibold text-indigo-950 transition-all duration-300 placeholder:text-gray-400 focus:bg-white focus:border-purple-500 focus:ring-8 focus:ring-purple-500/10 focus:outline-none shadow-sm disabled:cursor-not-allowed disabled:opacity-50",
                            isPassword ? "pr-12" : "",
                            rightElement ? (isPassword ? "pr-20" : "pr-12") : "",
                            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "",
                            className
                        )}
                        ref={ref}
                        id={inputId}
                        {...props}
                        onKeyDown={(e) => {
                            if (isPassword && e.key === ' ') {
                                e.preventDefault();
                            }
                            if (restrictNumbers && /[0-9]/.test(e.key)) {
                                e.preventDefault();
                            }
                            if (restrictSymbols && /[^a-zA-Z\s]/.test(e.key) && e.key.length === 1) {
                                e.preventDefault();
                            }
                            props.onKeyDown?.(e);
                        }}
                        onChange={(e) => {
                            let value = e.target.value;
                            if (isPassword) {
                                value = value.replace(/\s/g, '');
                            }
                            if (restrictNumbers) {
                                value = value.replace(/[0-9]/g, '');
                            }
                            if (restrictSymbols) {
                                value = value.replace(/[^a-zA-Z\s]/g, '');
                            }
                            // Strictly enforce maxLength
                            if (props.maxLength && value.length > props.maxLength) {
                                value = value.slice(0, props.maxLength);
                            }
                            e.target.value = value;
                            props.onChange?.(e);
                        }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        {rightElement && (
                            <div className="flex items-center">
                                {rightElement}
                            </div>
                        )}
                        {isPassword && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors focus:outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
                {error && !hideErrorText && (
                    <p className="text-sm font-medium text-red-500">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
