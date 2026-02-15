import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-body text-primary font-sans transition-colors duration-200">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />
            <Header
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                isCollapsed={isCollapsed}
            />

            {/* Main Content Area */}
            <main
                className={`pt-16 min-h-screen transition-all duration-300 ease-in-out pl-0 ${isCollapsed ? 'md:pl-[80px]' : 'md:pl-[260px]'}`}
            >
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
