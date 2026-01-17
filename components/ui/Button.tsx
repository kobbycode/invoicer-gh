import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

// Merge standard button props with motion props
type CombinedButtonProps = ButtonProps & Omit<HTMLMotionProps<"button">, "onDrag" | "onDragStart" | "onDragEnd">;

export const Button = React.forwardRef<HTMLButtonElement, CombinedButtonProps>(
    ({
        className,
        variant = 'primary',
        size = 'md',
        isLoading = false,
        leftIcon,
        rightIcon,
        fullWidth = false,
        children,
        disabled,
        ...props
    }, ref) => {

        const variants = {
            primary: "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 border-transparent",
            secondary: "bg-white text-gray-900 border-gray-200 hover:border-gray-300 shadow-sm hover:bg-gray-50",
            outline: "bg-transparent border-primary text-primary hover:bg-primary/5",
            ghost: "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800",
            destructive: "bg-red-600 text-white shadow-lg shadow-red-600/25 hover:bg-red-700",
            link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs rounded-lg",
            md: "h-10 px-4 text-sm rounded-xl",
            lg: "h-12 px-6 text-base rounded-2xl",
            icon: "h-10 w-10 p-0 flex items-center justify-center rounded-xl",
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.96 }}
                className={cn(
                    "inline-flex items-center justify-center font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none border",
                    variants[variant],
                    sizes[size],
                    fullWidth ? "w-full" : "",
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Spinner size="sm" className="mr-2" />}
                {!isLoading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}

                {children}

                {!isLoading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
            </motion.button>
        );
    }
);

Button.displayName = "Button";
