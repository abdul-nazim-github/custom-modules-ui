import * as React from 'react';

import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

// Note: I am not installing class-variance-authority or radix-ui/react-slot yet.
// I should probably stick to simple props if I don't want to install more dependencies,
// OR I should install them. The user asked for "Clean, modern UI".
// I will use simple props for now to avoid extra deps unless necessary, but `cn` utility is needed.
// Wait, I haven't created `lib/utils.ts` yet. I need to create that too.

// Let's create a simpler button without cva/radix for now to keep it lightweight unless I install them.
// Actually, I'll install `clsx` and `tailwind-merge` (already installed).
// I will create `lib/utils.ts` first.

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'default', isLoading, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            primary: "bg-blue-600 text-white hover:bg-blue-700",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline",
        };

        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
