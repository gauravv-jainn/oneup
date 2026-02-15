import React from 'react';
import { Package, Cpu, Factory, AlertTriangle, ShoppingCart, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const KPICard = ({ title, value, trend, Icon, color }) => {
    // Map generic color names to our specific badge token names/vars
    const getThemeColor = (c) => {
        const map = {
            blue: { bg: 'var(--badge-blue-bg)', text: 'var(--badge-blue-text)' },
            green: { bg: 'var(--badge-green-bg)', text: 'var(--badge-green-text)' },
            orange: { bg: 'var(--badge-orange-bg)', text: 'var(--badge-orange-text)' },
            red: { bg: 'var(--badge-red-bg)', text: 'var(--badge-red-text)' },
            purple: { bg: 'var(--badge-purple-bg)', text: 'var(--badge-purple-text)' },
            amber: { bg: 'var(--badge-orange-bg)', text: 'var(--badge-orange-text)' }, // Fallback to orange for amber
        };
        return map[c] || map.blue;
    };

    const themeColor = getThemeColor(color);
    const isPositive = trend && (trend.includes('+') || trend === 'Safe');

    return (
        <div className="theme-card p-5 flex flex-col justify-between h-full relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
                <div
                    className="p-2.5 rounded-xl transition-colors"
                    style={{ background: themeColor.bg, color: themeColor.text }}
                >
                    <Icon size={20} className="opacity-90" />
                </div>
                {trend && (
                    <div
                        className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full transition-colors"
                        style={{
                            background: isPositive ? 'var(--badge-green-bg)' :
                                trend === 'Warning' || trend === 'Action' ? 'var(--badge-orange-bg)' :
                                    trend === 'Alert' || trend === 'Urgent' ? 'var(--badge-red-bg)' :
                                        'var(--badge-blue-bg)',
                            color: isPositive ? 'var(--badge-green-text)' :
                                trend === 'Warning' || trend === 'Action' ? 'var(--badge-orange-text)' :
                                    trend === 'Alert' || trend === 'Urgent' ? 'var(--badge-red-text)' :
                                        'var(--badge-blue-text)'
                        }}
                    >
                        {isPositive ? <TrendingUp size={12} /> : <Activity size={12} />}
                        <span>{trend}</span>
                    </div>
                )}
            </div>

            <div className="mt-2">
                <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">{title}</h3>
                <div className="text-2xl font-bold text-primary tracking-tight">{value}</div>
            </div>

            {/* Subtle decorative gradient glow */}
            <div
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl pointer-events-none"
                style={{ background: themeColor.text }}
            />
        </div>
    );
};

const KPIStats = ({ stats }) => {
    // Helper to format large numbers
    const formatNumber = (num) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num;
    };

    const kpiData = [
        {
            title: 'Total Components',
            value: formatNumber(stats.totalComponents),
            trend: '+12%',
            Icon: Package,
            color: 'blue'
        },
        {
            title: 'Active PCBs',
            value: stats.activePCBs,
            trend: '+5%',
            Icon: Cpu,
            color: 'green'
        },
        {
            title: "Today's Production",
            value: stats.dailyProduction,
            trend: '+8%',
            Icon: Factory,
            color: 'orange'
        },
        {
            title: 'Low Stock',
            value: stats.lowStock || 0,
            trend: 'Action',
            Icon: AlertTriangle,
            color: 'amber'
        },
        {
            title: 'Critical Stock',
            value: stats.criticalStock || 0,
            trend: 'Urgent',
            Icon: AlertTriangle,
            color: 'red'
        },
        {
            title: 'Pending Orders',
            value: stats.pendingOrders,
            trend: 'Stable',
            Icon: ShoppingCart,
            color: 'purple'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpiData.map((item, index) => (
                <KPICard key={index} {...item} />
            ))}
        </div>
    );
};

export default KPIStats;
