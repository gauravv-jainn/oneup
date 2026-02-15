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
    const treemapData = heatmapData.map(item => ({
        name: item.name,
        size: Math.max(parseInt(item.total_consumed) || 1, 1),
        stock_percentage: Math.min(100, item.stock_percentage),
        status: item.status,
        fill: item.status === 'critical' ? '#ef4444' : item.status === 'warning' ? '#f59e0b' : '#10b981'
    }));

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
            <Card className="p-6">
                <h3 className="text-lg font-bold text-primary mb-4">Inventory Health Map</h3>
                <div className="flex gap-4 mb-4 text-xs">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded"></span> Healthy (≥50%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-500 rounded"></span> Low (20-50%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded"></span> Critical (&lt;20%)</div>
                </div>
                <div className="flex flex-col gap-4">
                    {/* Heatmap Visualization */}
                    {treemapData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <Treemap
                                data={treemapData}
                                dataKey="size"
                                nameKey="name"
                                content={(props) => {
                                    const { x, y, width, height, name, fill, stock_percentage, status } = props;
                                    if (width < 30 || height < 25) return null;
                                    return (
                                        <g
                                            onMouseEnter={() => setHoveredNode({ name, stock_percentage, status, fill, ...props })}
                                            onMouseLeave={() => setHoveredNode(null)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <rect
                                                x={x} y={y} width={width} height={height}
                                                fill={fill}
                                                stroke="#1e293b"
                                                strokeWidth={2}
                                                rx={4}
                                                className="transition-all duration-200 hover:opacity-80"
                                            />
                                            {width > 60 && height > 35 && (
                                                <>
                                                    <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                                        {name?.length > 10 ? name.slice(0, 10) + '…' : name}
                                                    </text>
                                                    <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="normal" fillOpacity={0.9}>
                                                        {stock_percentage}%
                                                    </text>
                                                </>
                                            )}
                                        </g>
                                    );
                                }}
                            >
                                <Tooltip content={<CustomTooltip />} />
                            </Treemap>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-muted py-12">No heatmap data available</div>
                    )}

                    {/* Details Panel (Below) */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-default min-h-[80px] flex items-center justify-center transition-all">
                        {hoveredNode ? (
                            <div className="flex items-center gap-8 w-full justify-around animate-fade-in">
                                <div className="text-left">
                                    <p className="text-xs text-secondary font-medium uppercase tracking-wider">Component</p>
                                    <h4 className="text-xl font-bold text-primary">{hoveredNode.name}</h4>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-secondary font-medium uppercase tracking-wider">Stock Health</p>
                                    <div className={`text-2xl font-bold ${hoveredNode.status === 'critical' ? 'text-red-500' : hoveredNode.status === 'warning' ? 'text-amber-500' : 'text-green-500'}`}>
                                        {hoveredNode.stock_percentage}%
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-secondary font-medium uppercase tracking-wider">Consumption Impact</p>
                                    <p className="text-lg font-mono text-primary">{hoveredNode.value?.toLocaleString() || hoveredNode.size?.toLocaleString()}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-secondary text-sm flex items-center gap-2">
                                <TrendingDown size={16} />
                                Hover over any block above to see detailed metrics
                            </div>
                        )}
                    </div>
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
