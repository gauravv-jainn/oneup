import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-card border border-default rounded-xl shadow-2xl animate-fade-up glass-panel max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-default sticky top-0 bg-card z-10 backdrop-blur-xl">
                    <h3 className="text-xl font-bold text-primary">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-black/5 text-secondary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
