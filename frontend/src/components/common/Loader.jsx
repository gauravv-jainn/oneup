import React from 'react';

const Loader = ({ fullScreen = false, size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
        xl: 'w-16 h-16 border-4'
    };

    const spinner = (
        <div
            className={`
                ${sizeClasses[size] || sizeClasses.md}
                border-blue-500 border-t-transparent 
                rounded-full animate-spin 
                ${className}
            `}
            role="status"
            aria-label="loading"
        />
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                <div className="flex flex-col items-center">
                    {spinner}
                    <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center py-4">
            {spinner}
        </div>
    );
};

export default Loader;
