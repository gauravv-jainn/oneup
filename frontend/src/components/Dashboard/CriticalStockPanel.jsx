import React from 'react';
import Card from '../common/Card';
import { AlertTriangle } from 'lucide-react';

const CriticalStockPanel = ({ items }) => {
    return (
        <Card className="h-full border-red-500/10 bg-red-500/5">
            <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="text-red-500" size={20} />
                <h3 className="text-lg font-bold text-primary">Critical Components</h3>
            </div>

            <div className="space-y-4">
                {items.slice(0, 6).map((item, index) => {
                    // Calculate mock trend and percentage for visual
                    const stockPercent = Math.min(100, Math.round((item.current_stock / item.monthly_required_quantity) * 100));

                    return (
                        <div key={index} className="group">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm text-primary group-hover:text-red-500 transition-colors">
                                    {item.name}
                                </span>
                                <span className="text-red-500 font-bold text-sm">
                                    {item.current_stock} <span className="text-xs text-muted font-normal">/ {item.reorder_point || 50}</span>
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${stockPercent}%` }}
                                />
                            </div>
                            <div className="mt-1 flex justify-between text-xs text-muted">
                                <span>Part: {item.part_number}</span>
                                <span className="text-red-400">-12% this week</span>
                            </div>
                        </div>
                    );
                })}

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
