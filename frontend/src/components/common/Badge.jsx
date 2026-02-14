import React from 'react';

const Badge = ({ children, variant = 'blue', className = '' }) => {
    // Relying on .badge classes to be added to index.css
    return (
        <span className={`badge badge-${variant} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
