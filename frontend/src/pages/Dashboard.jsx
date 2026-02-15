import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import KPIStats from '../components/Dashboard/KPIStats';
import HeatmapPanel from '../components/Dashboard/HeatmapPanel';
import CriticalStockPanel from '../components/Dashboard/CriticalStockPanel';
import DashboardCharts from '../components/Dashboard/DashboardCharts';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';

const RANGE_OPTIONS = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 3 Months', value: '90d' },
];

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30d');
    const [data, setData] = useState({
        stats: {
            totalComponents: 0,
            activePCBs: 0,
            dailyProduction: 0,
            lowStock: 0,
            criticalStock: 0,
            pendingOrders: 0
        },
        heatmapData: [],
        criticalStock: [],
        consumptionData: { labels: [], values: [] },
        topComponentsData: { labels: [], values: [] },
        productionData: { labels: [], values: [] }
    });

    const fetchData = useCallback(async () => {
        try {
            const rangeParam = `?range=${range}`;
            const [
                statsRes,
                trendRes,
                productionTrendRes,
                topConsumedRes,
                heatmapRes,
                lowStockRes
            ] = await Promise.all([
                api.get('/analytics/stats'),
                api.get(`/analytics/consumption-trend${rangeParam}`),
                api.get(`/analytics/production-trend${rangeParam}`),
                api.get(`/analytics/top-consumed${rangeParam}`),
                api.get(`/analytics/heatmap-data${rangeParam}`),
                api.get('/analytics/low-stock')
            ]);

            const topConsumed = topConsumedRes.data || [];
            const consumptionTrend = trendRes.data || [];
            const productionTrend = productionTrendRes.data || { labels: [], values: [] };

            const topLabels = topConsumed.slice(0, 5).map(i => i.name);
            const topValues = topConsumed.slice(0, 5).map(i => parseInt(i.total_consumed));

            const consumptionLabels = consumptionTrend.map(i => new Date(i.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
            const consumptionValues = consumptionTrend.map(i => parseInt(i.total_consumed));

            setData({
                stats: statsRes.data || data.stats,
                heatmapData: heatmapRes.data || [],
                criticalStock: lowStockRes.data || [],
                consumptionData: { labels: consumptionLabels, values: consumptionValues },
                topComponentsData: { labels: topLabels, values: topValues },
                productionData: { labels: productionTrend.labels, values: productionTrend.values }
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <Loader fullScreen />;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with Range Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Dashboard Overview</h1>
                    <p className="text-secondary mt-1">Real-time inventory and production analytics</p>
                </div>
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {RANGE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setRange(opt.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${range === opt.value
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-secondary hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Row */}
            <KPIStats stats={data.stats} />

            {/* Middle Section: Heatmap & Critical Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[450px]">
                <div className="lg:col-span-2 h-full">
                    <HeatmapPanel data={data.heatmapData} />
                </div>
                <div className="lg:col-span-1 h-full">
                    <CriticalStockPanel items={data.criticalStock} />
                </div>
            </div>

            {/* Bottom Section: Charts */}
            <DashboardCharts
                consumptionData={data.consumptionData}
                topComponentsData={data.topComponentsData}
                productionData={data.productionData}
            />
        </div>
    );
};

export default Dashboard;
