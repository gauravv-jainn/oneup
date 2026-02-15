import React from 'react';
import Card from '../common/Card';
import { AlertTriangle, AlertCircle } from 'lucide-react';

const CriticalStockPanel = ({ items }) => {
    const critical = items.filter(i => i.severity === 'critical' || (i.stock_percent !== undefined ? parseFloat(i.stock_percent) < 20 : i.current_stock < (i.monthly_required_quantity * 0.2)));
    const low = items.filter(i => i.severity === 'low' || (i.stock_percent !== undefined ? (parseFloat(i.stock_percent) >= 20 && parseFloat(i.stock_percent) < 50) : (i.current_stock >= (i.monthly_required_quantity * 0.2) && i.current_stock < (i.monthly_required_quantity * 0.5))));

    return (
        <Card className="h-full border-red-500/10 bg-red-500/5 flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <AlertTriangle className="text-red-500" size={20} />
                <h3 className="text-lg font-bold text-primary">Stock Alerts</h3>
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {items.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2">

                {/* Critical Section */}
                {critical.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                            <AlertCircle size={14} className="text-red-500" />
                            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Critical (&lt;20%)</span>
                        </div>
                        <div className="space-y-3">
                            {critical.slice(0, 4).map((item, index) => {
                                const stockPercent = Math.min(100, Math.round((item.current_stock / Math.max(item.monthly_required_quantity, 1)) * 100));
                                return (
                                    <div key={index} className="group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-sm text-primary group-hover:text-red-500 transition-colors truncate mr-2">
                                                {item.name}
                                            </span>
                                            <span className="text-red-500 font-bold text-sm whitespace-nowrap">
                                                {item.current_stock} <span className="text-xs text-muted font-normal">/ {item.monthly_required_quantity}</span>
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${stockPercent}%` }} />
                                        </div>
                                        <div className="mt-0.5 flex justify-between text-xs text-muted">
                                            <span>{item.part_number}</span>
                                            <span className="text-red-400 font-medium">{stockPercent}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Low Stock Section */}
                {low.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle size={14} className="text-amber-500" />
                            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Low Stock (20-50%)</span>
                        </div>
                        <div className="space-y-3">
                            {low.slice(0, 4).map((item, index) => {
                                const stockPercent = Math.min(100, Math.round((item.current_stock / Math.max(item.monthly_required_quantity, 1)) * 100));
                                return (
                                    <div key={index} className="group">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-sm text-primary group-hover:text-amber-500 transition-colors truncate mr-2">
                                                {item.name}
                                            </span>
                                            <span className="text-amber-500 font-bold text-sm whitespace-nowrap">
                                                {item.current_stock} <span className="text-xs text-muted font-normal">/ {item.monthly_required_quantity}</span>
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${stockPercent}%` }} />
                                        </div>
                                        <div className="mt-0.5 flex justify-between text-xs text-muted">
                                            <span>{item.part_number}</span>
                                            <span className="text-amber-400 font-medium">{stockPercent}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {items.length === 0 && (
                    <div className="text-center text-muted text-sm py-10">
                        No critical alerts. Inventory is healthy.
                    </div>
                )}
            </div>
        </Card>
    );
};

export default CriticalStockPanel;
