import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

        const sizes = {
            sm: "h-8 px-3 text-xs w-auto",
            md: "h-10 px-4 py-2 w-full",
            lg: "h-11 px-8 w-full"
        };

        // Override w-full for sm size if desired, or handle via className. 
        // Button usage in pages often assumes w-full or flex-1 from parent.
        // My previous css had "w-full" in baseStyles.
        // I moved "w-full" to sizes where appropriate or kept it?
        // User pages use `className="flex-1"` etc which handles width.
        // If I put `w-full` in sizes, `sm` buttons might be wide?
        // Let's make `sm` w-auto (inline), `md` w-full default? 
        // Usage in `EntryForm`: `className="w-full"`.
        // Usage in `Categories`: `size="sm"`. Expected to be small button.
        // So `sm` should NOT be `w-full` by default.
        // `md` was `w-full` in my original baseStyles ("... h-10 px-4 py-2 w-full").
        // So I will make `md` have `w-full` but respect `className` overrides.
        // Actually tailwind classes override if later.

        const variants = {
            primary: "bg-blue-600 text-white hover:bg-blue-700",
            secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
            danger: "bg-red-600 text-white hover:bg-red-700",
            ghost: "hover:bg-gray-100 hover:text-gray-900"
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, sizes[size], variants[variant], className)}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
