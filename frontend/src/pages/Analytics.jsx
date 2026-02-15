import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Treemap, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingDown, Calendar, Clock, Download } from 'lucide-react';

const RANGE_OPTIONS = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 3 Months', value: '90d' },
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 border border-default rounded-lg p-3 shadow-xl text-xs">
                <p className="font-bold text-primary">{payload[0].name || payload[0].payload?.name}</p>
                <p className="text-blue-500 font-mono">{payload[0].value?.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustom, setShowCustom] = useState(false);
    const [consumptionTrend, setConsumptionTrend] = useState([]);
    const [topConsumed, setTopConsumed] = useState([]);
    const [consumptionSummary, setConsumptionSummary] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [hoveredNode, setHoveredNode] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let rangeParam = `?range=${range}`;
            if (range === 'custom' && customStart && customEnd) {
                rangeParam = `?range=custom&start=${customStart}&end=${customEnd}`;
            }

            const [trendRes, topRes, summaryRes, heatRes] = await Promise.all([
                api.get(`/analytics/consumption-trend${rangeParam}`),
                api.get(`/analytics/top-consumed${rangeParam}`),
                api.get(`/analytics/consumption-summary${rangeParam}`),
                api.get(`/analytics/heatmap-data${rangeParam}`)
            ]);

            setConsumptionTrend(trendRes.data || []);
            setTopConsumed(topRes.data || []);
            setConsumptionSummary(summaryRes.data || []);
            setConsumptionSummary(summaryRes.data || []);
            console.log("Heatmap Data Received:", heatRes.data);
            setHeatmapData(heatRes.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, [range, customStart, customEnd]);

    // Fetch on mount and when range/filters change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Re-fetch when page becomes visible (user navigated away and back)
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchData();
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);
        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
        };
    }, [fetchData]);

    const selectRange = (val) => {
        if (val === 'custom') {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        setRange(val);
    };

    const applyCustomRange = () => {
        if (customStart && customEnd) {
            setRange('custom');
        } else {
            toast.warn('Select both start and end dates');
        }
    };

    if (loading) return <Loader fullScreen />;

    const trendChartData = consumptionTrend.map(item => ({
        date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        consumed: parseInt(item.total_consumed)
    }));

    const barData = topConsumed.map(item => ({
        name: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name,
        fullName: item.name,
        total_consumed: parseInt(item.total_consumed)
    }));

    // Prepare heatmap data for treemap
    // Logic: Size based on Monthly Requirement (Market Cap style)
    const treemapData = heatmapData.map(item => ({
        name: item.name,
        size: Math.max(parseInt(item.monthly_required_quantity) || 1, 1), // Use Monthly Req for area
        current_stock: parseInt(item.current_stock),
        monthly_required_quantity: parseInt(item.monthly_required_quantity),
        stock_percentage: item.stock_percentage,
        status: item.status,
        fill: item.status === 'critical' ? '#ef4444' : item.status === 'warning' ? '#f59e0b' : '#10b981'
    })).sort((a, b) => b.size - a.size); // Sort descending by size for better packing

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header + Range Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                        <TrendingDown className="text-blue-500" /> Consumption Analytics
                    </h1>
                    <p className="text-secondary mt-1">Deep-dive into component usage and inventory trends</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="seg-container">
                        {RANGE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => selectRange(opt.value)}
                                className={`seg-btn px-3 py-1.5 text-xs font-medium rounded-lg ${range === opt.value && !showCustom ? 'active' : ''}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                        <button
                            onClick={() => selectRange('custom')}
                            className={`seg-btn px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 ${showCustom || range === 'custom' ? 'active' : ''}`}
                        >
                            <Calendar size={12} /> Custom
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Range Picker */}
            {showCustom && (
                <Card className="flex flex-wrap items-end gap-4 p-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-secondary">Start Date</label>
                        <input type="date" className="input w-auto" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-secondary">End Date</label>
                        <input type="date" className="input w-auto" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                    </div>
                    <button onClick={applyCustomRange} className="btn btn-primary px-4 py-2 text-sm">Apply Range</button>
                </Card>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Consumption Trend */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" /> Consumption Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendChartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="consumed" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                {/* Top Consumed */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-primary mb-4">Top Consumed Components</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="total_consumed" radius={[0, 6, 6, 0]}>
                                {barData.map((_, idx) => (
                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Inventory Heatmap Treemap */}
            <Card className="flex flex-col h-[600px] overflow-hidden">
                <div className="p-4 border-b border-default flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 z-10 transition-colors duration-200">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Inventory Health Map</h3>
                    <div className="flex gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded-sm"></span> Healthy (≥50%)</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span> Low (20-50%)</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-sm"></span> Critical (&lt;20%)</div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 relative bg-slate-100 dark:bg-slate-900">
                    {treemapData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={treemapData}
                                dataKey="size"
                                nameKey="name"
                                aspectRatio={1}
                                isAnimationActive={false}
                                content={(props) => {
                                    const { x, y, width, height, name, fill, stock_percentage, status } = props;
                                    if (width < 2 || height < 2) return null; // Skip tiny blocks
                                    return (
                                        <g
                                            onMouseEnter={() => setHoveredNode({ name, stock_percentage, status, fill, ...props })}
                                            onMouseLeave={() => setHoveredNode(null)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <rect
                                                x={x} y={y} width={width} height={height}
                                                fill={fill}
                                                stroke="#1e293b" // Dark border for contrast or match container
                                                strokeWidth={1}
                                                className="transition-opacity duration-200 hover:opacity-90"
                                            />
                                            {width > 40 && height > 30 && (
                                                <>
                                                    <text
                                                        x={x + width / 2}
                                                        y={y + height / 2 - 2}
                                                        textAnchor="middle"
                                                        fill="#fff"
                                                        fontSize={Math.min(width / 5, 12)}
                                                        fontWeight="bold"
                                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)', pointerEvents: 'none' }}
                                                    >
                                                        {name?.length > (width / 6) ? name.slice(0, Math.floor(width / 6)) + '..' : name}
                                                    </text>
                                                    <text
                                                        x={x + width / 2}
                                                        y={y + height / 2 + 10}
                                                        textAnchor="middle"
                                                        fill="#fff"
                                                        fontSize={Math.min(width / 6, 10)}
                                                        fontWeight="normal"
                                                        fillOpacity={0.9}
                                                        style={{ pointerEvents: 'none' }}
                                                    >
                                                        {stock_percentage}%
                                                    </text>
                                                </>
                                            )}
                                        </g>
                                    );
                                }}
                            >
                                <Tooltip content={<CustomTooltip />} cursor={false} />
                            </Treemap>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted">No heatmap data available</div>
                    )}

                    {/* Hover Info Overlay (Absolute positioned to not take space) */}
                    {hoveredNode && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-xl border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 flex items-center gap-6 pointer-events-none z-20">
                            <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Component</p>
                                <p className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{hoveredNode.name}</p>
                            </div>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                            <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stocks</p>
                                <div className="flex gap-3 text-xs">
                                    <span className="text-slate-800 dark:text-slate-200">Current: <span className="font-mono font-bold">{hoveredNode.current_stock?.toLocaleString()}</span></span>
                                    <span className="text-slate-400">/</span>
                                    <span className="text-slate-800 dark:text-slate-200">Monthly: <span className="font-mono font-bold">{hoveredNode.monthly_required_quantity?.toLocaleString()}</span></span>
                                </div>
                            </div>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                            <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Health</p>
                                <p className={`font-bold ${hoveredNode.status === 'critical' ? 'text-red-500' :
                                    hoveredNode.status === 'warning' ? 'text-amber-500' : 'text-green-500'
                                    }`}>{hoveredNode.stock_percentage}%</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Detailed Summary Table */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-primary">Detailed Consumption Summary</h3>
                    <span className="text-xs text-muted">{consumptionSummary.length} components</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-default">
                                <th className="text-left pb-3 text-secondary font-medium">Component</th>
                                <th className="text-left pb-3 text-secondary font-medium">Part Number</th>
                                <th className="text-right pb-3 text-secondary font-medium">Total Consumed</th>
                                <th className="text-right pb-3 text-secondary font-medium">Bar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumptionSummary.slice(0, 20).map((item, idx) => {
                                const maxConsumed = Math.max(...consumptionSummary.map(i => parseInt(i.total_consumed)));
                                const pct = (parseInt(item.total_consumed) / maxConsumed) * 100;
                                return (
                                    <tr key={idx} className="border-b border-default/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3 text-primary font-medium">{item.name}</td>
                                        <td className="py-3 text-secondary font-mono text-xs">{item.part_number}</td>
                                        <td className="py-3 text-right text-primary font-mono font-bold">{parseInt(item.total_consumed).toLocaleString()}</td>
                                        <td className="py-3 w-32">
                                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Analytics;
