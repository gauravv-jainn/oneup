import React from 'react';
import Card from '../common/Card';

const HeatmapPanel = ({ data }) => {
    // Determine color based on stock percentage
    const getCellColor = (percentage) => {
        if (percentage >= 50) return 'bg-green-500';
        if (percentage >= 20) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <Card className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-primary">Inventory Heatmap</h3>

                {/* Legend */}
                <div className="flex items-center gap-3 text-xs text-secondary">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Healthy
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Warning
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Critical
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-3 flex-1">
                {(!data || data.length === 0) && (
                    <div className="col-span-5 flex items-center justify-center text-secondary text-sm py-8 opacity-60">
                        No heatmap data available yet.
                    </div>
                )}
                {data.map((item, index) => {
                    // Calculate percentage (mock logic if needed, or real)
                    const stockPercent = item.stockPercentage || Math.min(100, Math.round((item.current_stock / item.monthly_required_quantity) * 100));

                    return (
                        <div
                            key={index}
                            className={`
                                rounded-lg p-3 flex flex-col justify-between text-white shadow-sm cursor-pointer
                                transition-transform hover:scale-105 hover:z-10 hover:shadow-lg
                                ${getCellColor(stockPercent)}
                            `}
                            title={`${item.name}: ${item.current_stock} units (${stockPercent}%)`}
                        >
                            <span className="text-xs font-semibold truncate opacity-90">{item.name}</span>
                            <span className="text-lg font-bold">{stockPercent}%</span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default HeatmapPanel;
