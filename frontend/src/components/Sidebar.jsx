import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, CircuitBoard, Factory, BarChart3, ShoppingCart, FileSpreadsheet, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const links = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Components', path: '/components', icon: Package },
        { name: 'PCBs', path: '/pcbs', icon: CircuitBoard },
        { name: 'Production', path: '/production', icon: Factory },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Procurement', path: '/procurement', icon: ShoppingCart },
        { name: 'Import/Export', path: '/import-export', icon: FileSpreadsheet },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0">
            <div className="p-4 border-b border-slate-700">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Inventory<span className="font-light text-white">Auto</span>
                </h1>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1 px-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <li key={link.path}>
                                <Link
                                    to={link.path}
                                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    <span className="font-medium">{link.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
