import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';

const HeatmapPanel = ({ data }) => {
    const navigate = useNavigate();

    const getCellColor = (percentage) => {
        if (percentage >= 50) return 'bg-green-500';
        if (percentage >= 20) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const handleBlockClick = (item) => {
        if (item.id) {
            navigate(`/components?highlight=${item.id}`);
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-primary">Inventory Heatmap</h3>
                <div className="flex items-center gap-3 text-xs text-secondary">
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-green-500"></span> Healthy (≥50%)
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Low (20-50%)
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-red-500"></span> Critical (&lt;20%)
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 rounded-lg pr-2">
                <div className="flex flex-wrap gap-2 content-start">
                    {(!data || data.length === 0) && (
                        <div className="w-full flex items-center justify-center text-secondary text-sm py-8 opacity-60">
                            No heatmap data available yet.
                        </div>
                    )}
                    {data.map((item, index) => {
                        // Remove the 100% cap
                        const stockPercent = item.stock_percentage || Math.round((item.current_stock / Math.max(item.monthly_required_quantity, 1)) * 100);

                        return (
                            <div
                                key={index}
                                className={`
                                    rounded-lg p-2.5 flex flex-col justify-between text-white shadow-sm cursor-pointer
                                    transition-all hover:scale-105 hover:z-10 hover:shadow-lg
                                    active:scale-95 flex-grow basis-[120px] max-w-[200px] min-h-[80px]
                                    ${getCellColor(stockPercent)}
                                `}
                                title={`${item.name}: ${item.current_stock} units (${stockPercent}%) — Click to view details`}
                                onClick={() => handleBlockClick(item)}
                            >
                                <span className="text-[10px] font-semibold truncate opacity-90 leading-tight block w-full">{item.name}</span>
                                <div className="flex items-end justify-between mt-1">
                                    <span className="text-lg font-bold leading-none">{stockPercent}%</span>
                                    <span className="text-[9px] opacity-70">{item.current_stock}u</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};

export default HeatmapPanel;
