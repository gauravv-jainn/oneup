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
        setLoading(true);
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

    if (loading) return <Loader fullScreen />;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with Range Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Dashboard Overview</h1>
                    <p className="text-secondary mt-1">Real-time inventory and production analytics</p>
                </div>
                <div className="seg-container">
                    {RANGE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setRange(opt.value)}
                            className={`seg-btn px-3 py-1.5 text-xs font-medium rounded-lg ${range === opt.value ? 'active' : ''}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Row */}
            <KPIStats stats={data.stats} />

            {/* Middle Section: Heatmap & Critical Stock */}
            {/* Middle Section: Heatmap & Critical Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <HeatmapPanel data={data.heatmapData} />
                </div>
                <div className="lg:col-span-1 lg:relative">
                    <div className="lg:absolute lg:inset-0">
                        <CriticalStockPanel items={data.criticalStock} className="h-full" />
                    </div>
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
