import * as React from "react";

export function Card({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`p-5 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`px-5 py-4 border-b border-gray-50 flex flex-col gap-1.5 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className = "", children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={`font-semibold text-lg text-gray-900 leading-tight ${className}`} {...props}>
            {children}
        </h3>
    );
}

export function CardFooter({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`px-5 py-4 bg-gray-50/50 flex items-center ${className}`} {...props}>
            {children}
        </div>
    );
}
