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
    X,
    Menu,
    MoreVertical,
    LogOut
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, toggleCollapse }) => {
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
                fixed left-0 top-0 h-screen flex flex-col z-50 bg-[#1e293b] text-slate-300 
                transition-all duration-300 ease-in-out border-r border-white/5
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-[80px]' : 'md:w-[260px]'}
                w-[260px]
            `}
        >
            {/* Logo Area & Toggle */}
            <div className={`h-16 flex items-center relative transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-white/10`}>

                {/* Logo & Text */}
                <div className={`flex items-center overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 p-0' : 'w-auto opacity-100'}`}>
                    <div className="w-8 h-8 min-w-[32px] rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 animate-pulse-slow">
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <span
                        className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400 ml-3 whitespace-nowrap"
                    >
                        PCB-ICS
                    </span>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={toggleCollapse}
                    className={`hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-300
                        ${isCollapsed ? 'absolute left-1/2 -translate-x-1/2' : ''}
                    `}
                    title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
                >
                    {isCollapsed ? <MoreVertical size={20} /> : <Menu size={20} />}
                </button>


                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden text-slate-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
                <div className={`px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-200 ${isCollapsed ? 'opacity-0 text-center' : 'opacity-100'}`}>
                    {isCollapsed ? '•' : 'Menu'}
                </div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        title={isCollapsed ? item.label : ''}
                        className={({ isActive }) => `
                            flex items-center py-2.5 rounded-lg transition-all duration-200 group mx-2
                            ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                            ${isActive
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30 shadow-sm'
                                : 'hover:bg-white/5 hover:text-white border border-transparent'
                            }
                        `}
                    >
                        <item.icon size={20} className={`${isCollapsed ? 'mr-0' : 'mr-3'} opacity-70 group-hover:opacity-100 transition-opacity min-w-[20px]`} />
                        <span className={`font-medium text-sm whitespace-nowrap transition-all duration-200 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-[#1e293b]">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                    <div className="w-8 h-8 min-w-[32px] rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white cursor-help" title={user?.username}>
                        {user?.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className={`flex-1 overflow-hidden transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                        <div className="text-sm font-medium text-white truncate">{user?.username || 'User'}</div>
                        <div className="text-xs text-slate-500 truncate">{user?.role || 'User'}</div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    title="Log Out"
                    className={`mt-3 w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors`}
                >
                    <LogOut size={16} />
                    <span className={`${isCollapsed ? 'hidden' : 'block'}`}>Log out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
