import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Treemap } from 'recharts';

const CustomizedContent = (props) => {
    const { root, depth, x, y, width, height, index, payload, colors, rank, name } = props;

    // Ignore root node
    if (depth < 2) return null;

    // Determine color based on status
    let fillColor = '#94a3b8'; // default slate-400
    if (payload.status === 'safe') fillColor = '#22c55e'; // green-500
    else if (payload.status === 'warning') fillColor = '#f59e0b'; // amber-500
    else if (payload.status === 'critical') fillColor = '#ef4444'; // red-500

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
                        {name.length > 10 ? name.substring(0, 10) + '...' : name}
                    </text>
                    <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={10}>
                        {payload.stock_percentage}%
                    </text>
                </>
            )}
        </g>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        // Skip root tooltip
        if (!data.part_number) return null;

        return (
            <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
                <p className="font-bold text-slate-800 mb-1">{data.name}</p>
                <p className="text-slate-600">Part #: <span className="font-mono">{data.part_number}</span></p>
                <p className="text-slate-600">Stock: <span className="font-mono">{data.current_stock} / {data.monthly_required_quantity}</span></p>
                <p className="text-slate-600">Consumed: <span className="font-mono">{data.total_consumed}</span></p>
                <div className={`mt-2 font-semibold ${data.status === 'safe' ? 'text-green-600' :
                    data.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                    Status: {data.status.toUpperCase()} ({data.stock_percentage}%)
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

                const formattedTrend = trendRes.data.map(d => ({
                    ...d,
                    date: new Date(d.date).toLocaleDateString()
                }));

                setTrendData(formattedTrend);
                setTopConsumed(Array.isArray(topRes.data) ? topRes.data : []);
                setSummary(Array.isArray(summaryRes.data) ? summaryRes.data : []);

                // Format for Treemap: Recharts typically requires a root node
                const heatmapRaw = Array.isArray(heatmapRes.data) ? heatmapRes.data : [];
                const formattedHeatmap = [{
                    name: 'Inventory',
                    children: heatmapRaw.map(item => ({
                        ...item,
                        size: item.total_consumed > 0 ? item.total_consumed : 1 // Ensure size > 0 to render
                    }))
                }];
                setHeatmapData(formattedHeatmap);

            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>

            {/* Heatmap Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-700">Inventory Heatmap</h2>
                    <div className="flex space-x-4 text-sm">
                        <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-sm mr-1"></span> Safe (&gt;50%)</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded-sm mr-1"></span> Warning (20-50%)</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-sm mr-1"></span> Critical (&lt;20%)</div>
                    </div>
                </div>
                <div className="h-[500px] w-full bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
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
                <p className="text-xs text-slate-400 mt-2 text-center">Block size represents Total Consumption volume.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">Consumption Trend (30 Days)</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="total_consumed" stroke="#3b82f6" strokeWidth={2} name="Units Consumed" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">Top 10 Most Consumed</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topConsumed} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="total_consumed" fill="#10b981" radius={[0, 4, 4, 0]} name="Total Consumed" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-700 mb-4">Detailed Consumption Summary</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-3">Component Name</th>
                                <th className="px-6 py-3">Part Number</th>
                                <th className="px-6 py-3">Total Consumed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {summary.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium text-slate-700">{item.name}</td>
                                    <td className="px-6 py-3 text-slate-500">{item.part_number}</td>
                                    <td className="px-6 py-3 font-mono text-blue-600">{item.total_consumed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
