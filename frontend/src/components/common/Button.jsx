import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

    let variantStyles = "";

    switch (variant) {
        case 'primary':
            variantStyles = "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30";
            // We use inline styles for dynamic colors in CSS variables usually, but for now relying on utility classes mapping to vars is hard without valid CSS classes.
            // Let's use direct style objects or custom classes defined in index.css if needed. 
            // Actually, I removed Tailwind, so "bg-blue-600" won't work unless I define it.
            // I should stick to style objects or defined utility classes in index.css.
            // WAIT - I removed Tailwind. "bg-blue-600" is a Tailwind class. 
            // I need to use the CSS variables I defined.
            break;
        case 'outline':
            variantStyles = "border border-default text-primary hover:bg-card";
            break;
        case 'danger':
            variantStyles = "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-500/30";
            break;
        case 'ghost':
            variantStyles = "text-secondary hover:text-primary hover:bg-black/5";
            break;
        default:
            variantStyles = "bg-blue-600 text-white";
    }

    // Since I removed Tailwind, I need to make sure these classes exist or use inline styles.
    // The previous plan was to use Vanilla CSS. 
    // I will write a Button.css or use inline styles for now to be safe, or update index.css with these utility classes.
    // Better: Update index.css with utility classes for buttons or use module.

    // For this specific implementation, I'll use a `style` prop approach combined with the global classes I defined.
    // But to make it clean, I'll define `.btn` classes in index.css in the next step.

    return (
        <button
            className={`btn btn-${variant} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
