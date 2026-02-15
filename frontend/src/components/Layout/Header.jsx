import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Search, Bell, HelpCircle, Sun, Moon, User, Menu, AlertTriangle, Package } from 'lucide-react';
import Button from '../common/Button';

const Header = ({ toggleSidebar, isCollapsed }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const notifRef = useRef(null);

    // Fetch low-stock alerts for notification bell
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await api.get('/analytics/low-stock');
                setAlerts(Array.isArray(res.data) ? res.data : []);
            } catch { /* silent */ }
        };
        fetchAlerts();
    }, [location.pathname]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/components?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    // Map routes to titles
    const getPageTitle = (pathname) => {
        const path = pathname.split('/')[1];
        switch (path) {
            case '': return 'Dashboard';
            case 'components': return 'Inventory Management';
            case 'pcbs': return 'PCB BOM Mapping';
            case 'production': return 'Production Entry';
            case 'future-orders': return 'Future Orders';
            case 'analytics': return 'Analytics & Reports';
            case 'procurement': return 'Procurement';
            case 'import-export': return 'Import / Export';
            case 'admin': return 'System Administration';
            default: return 'Dashboard';
        }
    };

    return (
        <header
            className={`h-16 fixed top-0 right-0 left-0 transition-all duration-300 ease-in-out z-30 px-4 md:px-8 flex items-center justify-between backdrop-blur-md border-b border-default ${isCollapsed ? 'md:left-[80px]' : 'md:left-[260px]'}`}
            style={{ background: 'var(--bg-header)' }}
        >
            {/* Left: Title & Toggle */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
                <h1 className="text-lg md:text-xl font-bold text-primary animate-fade-in truncate">
                    {getPageTitle(location.pathname)}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
                {/* Search - Hidden on small mobile */}
                <div className="relative group hidden sm:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-muted group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search components..."
                        className="pl-12 pr-4 py-2 w-32 md:w-48 rounded-full bg-card border border-default text-sm focus:w-40 md:focus:w-64 transition-all duration-300 outline-none focus:ring-2 focus:ring-blue-500/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="relative w-12 h-7 md:w-14 md:h-8 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors flex items-center px-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    <div
                        className={`absolute w-5 h-5 md:w-6 md:h-6 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'
                            }`}
                    >
                        {theme === 'dark' ? (
                            <Moon size={12} className="text-blue-400" />
                        ) : (
                            <Sun size={12} className="text-orange-500" />
                        )}
                    </div>
                </button>

                {/* Notifications */}
                <div className="relative hidden sm:block" ref={notifRef}>
                    <button
                        className="relative p-2 text-secondary hover:text-primary transition-colors hover:bg-black/5 rounded-full"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {alerts.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-black animate-pulse"></span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-card border border-default rounded-xl shadow-xl z-50 overflow-hidden">
                            <div className="p-3 border-b border-default bg-slate-50 dark:bg-slate-800/50">
                                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-500" />
                                    Low Stock Alerts ({alerts.length})
                                </h4>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {alerts.length === 0 ? (
                                    <div className="p-4 text-center text-secondary text-sm">All stock levels are healthy!</div>
                                ) : (
                                    alerts.slice(0, 8).map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 border-b border-default last:border-0 transition-colors">
                                            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500">
                                                <Package size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-primary truncate">{item.name}</p>
                                                <p className="text-xs text-secondary">Stock: <span className="text-red-500 font-bold">{item.current_stock}</span> / {item.monthly_required_quantity} req.</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {alerts.length > 0 && (
                                <div className="p-2 border-t border-default">
                                    <button
                                        onClick={() => { navigate('/procurement'); setShowNotifications(false); }}
                                        className="w-full text-center text-xs font-medium text-blue-500 hover:text-blue-600 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                                    >
                                        View Procurement →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="flex items-center ml-2 space-x-3 pl-2 md:pl-4 border-l border-default">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-[2px] cursor-pointer hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center">
                            {user?.username ? (
                                <span className="font-bold text-xs">{user.username.substring(0, 2).toUpperCase()}</span>
                            ) : (
                                <User size={16} />
                            )}
                        </div>
                    </div>

                    {/* Logout Button (Small) */}
                    <Button
                        variant="ghost"
                        className="!p-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hidden sm:flex"
                        onClick={logout}
                    >
                        Log out
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
