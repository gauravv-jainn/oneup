import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Treemap } from 'recharts';
import { Activity, TrendingUp, BarChart2, Grid } from 'lucide-react';
import Card from '../components/common/Card';

const CustomizedContent = (props) => {
    const { depth, x, y, width, height, name } = props;

    // Skip root and intermediate nodes (depth 0 = root, depth 1 = category)
    if (!depth || depth < 2) return null;

    // Read data props directly from props (Recharts flattens them)
    const status = props.status || '';
    const stockPercentage = props.stock_percentage != null ? props.stock_percentage : '';

    // Determine color based on status
    let fillColor = '#94a3b8'; // default slate-400
    if (status === 'safe') fillColor = '#10b981';
    else if (status === 'warning') fillColor = '#f59e0b';
    else if (status === 'critical') fillColor = '#ef4444';

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: fillColor,
                    stroke: '#fff',
                    strokeWidth: 2,
                    strokeOpacity: 1,
                }}
            />
            {width > 30 && height > 30 && (
                <>
                    <text x={x + width / 2} y={y + height / 2 - 5} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                        {name && name.length > 10 ? name.substring(0, 10) + '...' : (name || '')}
                    </text>
                    <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={10}>
                        {stockPercentage}%
                    </text>
                </>
            )}
        </g>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload;
        // Skip root tooltip or missing data
        if (!data || !data.part_number) return null;

        const status = data.status || 'unknown';
        return (
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg text-sm">
                <p className="font-bold text-primary mb-1">{data.name}</p>
                <p className="text-secondary">Part #: <span className="font-mono">{data.part_number}</span></p>
                <p className="text-secondary">Stock: <span className="font-mono">{data.current_stock} / {data.monthly_required_quantity}</span></p>
                <p className="text-secondary">Consumed: <span className="font-mono">{data.total_consumed}</span></p>
                <div className={`mt-2 font-semibold ${status === 'safe' ? 'text-green-600' :
                    status === 'warning' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                    Status: {status.toUpperCase()} ({data.stock_percentage || 0}%)
                </div>
            </div>
        );
    }
    return null;
};

const Analytics = () => {
    const [trendData, setTrendData] = useState([]);
    const [topConsumed, setTopConsumed] = useState([]);
    const [summary, setSummary] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trendRes, topRes, summaryRes, heatmapRes] = await Promise.all([
                    api.get('/analytics/consumption-trend'),
                    api.get('/analytics/top-consumed'),
                    api.get('/analytics/consumption-summary'),
                    api.get('/analytics/heatmap-data')
                ]);

                const trendDataArray = Array.isArray(trendRes.data) ? trendRes.data : [];
                const formattedTrend = trendDataArray.map(d => ({
                    ...d,
                    date: new Date(d.date).toLocaleDateString()
                }));

                setTrendData(formattedTrend);
                setTopConsumed(Array.isArray(topRes.data) ? topRes.data : []);
                setSummary(Array.isArray(summaryRes.data) ? summaryRes.data : []);

                // Format for Treemap: Recharts requires a root node
                const heatmapRaw = Array.isArray(heatmapRes.data) ? heatmapRes.data : [];
                const formattedHeatmap = [{
                    name: 'Inventory',
                    children: heatmapRaw.map(item => ({
                        ...item,
                        size: (item.total_consumed && item.total_consumed > 0) ? parseInt(item.total_consumed) : 1
                    }))
                }];
                setHeatmapData(formattedHeatmap);

            } catch (error) {
                console.error('Analytics fetch error:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Analytics Dashboard</h1>
                    <p className="text-secondary mt-1">Deep dive into consumption patterns and inventory health</p>
                </div>
            </div>

            {/* Heatmap Section */}
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                            <Grid size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-primary">Inventory Heatmap</h2>
                    </div>
                    <div className="flex space-x-4 text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-sm shadow-green-500/50"></span> Safe</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-full mr-2 shadow-sm shadow-amber-500/50"></span> Warning</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-sm shadow-red-500/50"></span> Critical</div>
                    </div>
                </div>
                <div className="h-[400px] w-full rounded-xl overflow-hidden border border-default">
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={heatmapData}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={<CustomizedContent />}
                        >
                            <Tooltip content={<CustomTooltip />} />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-secondary mt-3 text-center">
                    Block size represents total consumption volume. Color indicates current stock health.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                            <TrendingUp size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-primary">Consumption Trend (30 Days)</h2>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="total_consumed" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Units Consumed" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                            <BarChart2 size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-primary">Top 10 Most Consumed</h2>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topConsumed} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="total_consumed" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Total Consumed" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <Card>
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-slate-500/10 rounded-lg text-slate-600">
                        <Activity size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-primary">Detailed Consumption Summary</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-secondary">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-lg">Component Name</th>
                                <th className="px-6 py-4">Part Number</th>
                                <th className="px-6 py-4 rounded-tr-lg">Total Consumed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-default">
                            {summary.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-primary">{item.name}</td>
                                    <td className="px-6 py-4 text-secondary font-mono text-sm">{item.part_number}</td>
                                    <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{item.total_consumed}</td>
                                </tr>
                            ))}
                            {summary.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="text-center py-8 text-secondary italic">No consumption data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Analytics;
