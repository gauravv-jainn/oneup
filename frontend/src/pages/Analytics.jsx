import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Analytics = () => {
    const [trendData, setTrendData] = useState([]);
    const [topConsumed, setTopConsumed] = useState([]);
    const [summary, setSummary] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trendRes, topRes, summaryRes] = await Promise.all([
                    api.get('/analytics/consumption-trend'),
                    api.get('/analytics/top-consumed'),
                    api.get('/analytics/consumption-summary')
                ]);

                // Format date for trend
                const formattedTrend = trendRes.data.map(d => ({
                    ...d,
                    date: new Date(d.date).toLocaleDateString()
                }));

                setTrendData(formattedTrend);
                setTopConsumed(topRes.data);
                setSummary(summaryRes.data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>

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
