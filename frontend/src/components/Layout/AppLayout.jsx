import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-body text-primary font-sans transition-colors duration-200">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content Area */}
            {/* 
                Desktop: pl-[260px] (Sidebar width)
                Mobile: pl-0
            */}
            <main className="md:pl-[260px] pl-0 pt-16 min-h-screen transition-all duration-300">
                <div className="max-w-[1600px] mx-auto p-4 md:p-7 animate-fade-up">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </div>
    );
};

export default AppLayout;
