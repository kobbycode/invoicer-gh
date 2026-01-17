import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLMotionProps<"div"> {
    hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, hoverEffect = false, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                className={cn(
                    "bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm",
                    hoverEffect && "transition-all hover:shadow-md hover:border-primary/20",
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = "Card";
