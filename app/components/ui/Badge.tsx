import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "success" | "warning" | "danger" | "neutral";
}

export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
    const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors";

    const variants = {
        default: "bg-brand-100 text-brand-900",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        danger: "bg-red-100 text-red-800",
        neutral: "bg-gray-100 text-gray-800",
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </div>
    );
}
