import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    GitBranch,
    Factory,
    ShoppingCart,
    BarChart3,
    Bell,
    FileSpreadsheet,
    Settings,
    Zap,
    X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/components', label: 'Inventory', icon: Package },
        { path: '/pcbs', label: 'BOM Mapping', icon: GitBranch },
        { path: '/production', label: 'Production', icon: Factory },
        { path: '/future-orders', label: 'Orders', icon: ShoppingCart },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/procurement', label: 'Procurement', icon: Bell },
        { path: '/import-export', label: 'Import/Export', icon: FileSpreadsheet },
        { path: '/admin', label: 'Admin', icon: Settings },
    ];

    return (
        <aside
            className={`
                w-[260px] h-screen fixed left-0 top-0 flex flex-col z-50 bg-[#1e293b] text-slate-300 
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white mr-3 shadow-lg shadow-blue-500/20 animate-pulse-slow">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
                        PCB-ICS
                    </span>
                </div>
                {/* Close Button (Mobile Only) */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden text-slate-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Menu
                </div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)} // Close sidebar on mobile when link clicked
                        className={({ isActive }) => `
                            flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group
                            ${isActive
                                ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500'
                                : 'hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                            }
                        `}
                    >
                        <item.icon size={20} className="mr-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="font-medium text-sm">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-[#1e293b]">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                        {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-white truncate">{user?.username || 'User'}</div>
                        <div className="text-xs text-slate-500 truncate">{user?.role || 'User'}</div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                >
                    Log out
                </button>
                <div className="mt-2 text-xs text-slate-600 text-center">
                    v2.0.1 • PCB-ICS
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
