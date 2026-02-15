import React from 'react';
import { Package, Cpu, Factory, AlertTriangle, ShoppingCart } from 'lucide-react';
import Card from '../common/Card';

const KPICard = ({ title, value, trend, Icon, colorClass, borderColorClass }) => (
    <Card className={`relative overflow-hidden border-l-4 ${borderColorClass} flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-secondary text-sm font-medium mb-1">{title}</h3>
                <div className="text-2xl font-bold text-primary">{value}</div>
            </div>
            <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 mb-2`}>
                <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
            </div>
        </div>
        <div className="text-xs text-muted flex items-center">
            <span className="text-green-500 font-medium mr-1">{trend}</span>
            from last month
        </div>

        {/* Glow Effect */}
        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${colorClass} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />
    </Card>
);

const KPIStats = ({ stats }) => {
    const kpiData = [
        {
            title: 'Total Components',
            value: stats.totalComponents,
            trend: '+12%',
            Icon: Package,
            colorClass: 'text-blue-500',
            borderColorClass: 'border-blue-500'
        },
        {
            title: 'Active PCBs',
            value: stats.activePCBs,
            trend: '+5%',
            Icon: Cpu,
            colorClass: 'text-green-500',
            borderColorClass: 'border-green-500'
        },
        {
            title: "Today's Production",
            value: stats.dailyProduction,
            trend: '+8%',
            Icon: Factory,
            colorClass: 'text-orange-500',
            borderColorClass: 'border-orange-500'
        },
        {
            title: 'Low Stock',
            value: stats.lowStock || 0,
            trend: 'Warning',
            Icon: AlertTriangle,
            colorClass: 'text-amber-500',
            borderColorClass: 'border-amber-500'
        },
        {
            title: 'Critical Stock',
            value: stats.criticalStock || 0,
            trend: 'Alert',
            Icon: AlertTriangle,
            colorClass: 'text-red-500',
            borderColorClass: 'border-red-500'
        },
        {
            title: 'Pending Orders',
            value: stats.pendingOrders,
            trend: '',
            Icon: ShoppingCart,
            colorClass: 'text-purple-500',
            borderColorClass: 'border-purple-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpiData.map((item, index) => (
                <KPICard key={index} {...item} />
            ))}
        </div>
    );
};

export default KPIStats;
