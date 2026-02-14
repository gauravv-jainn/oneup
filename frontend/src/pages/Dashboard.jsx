import { useState, useEffect } from 'react';
import api from '../services/api';
import KPIStats from '../components/Dashboard/KPIStats';
import HeatmapPanel from '../components/Dashboard/HeatmapPanel';
import CriticalStockPanel from '../components/Dashboard/CriticalStockPanel';
import DashboardCharts from '../components/Dashboard/DashboardCharts';
import Loader from '../components/common/Loader';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: {
            totalComponents: 0,
            activePCBs: 0,
            dailyProduction: 0,
            lowStock: 0,
            pendingOrders: 0
        },
        heatmapData: [],
        criticalStock: [],
        consumptionData: { labels: [], values: [] },
        topComponentsData: { labels: [], values: [] },
        productionData: { labels: [], values: [] }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel
                const [
                    statsRes,
                    trendRes,
                    productionTrendRes,
                    topConsumedRes,
                    heatmapRes,
                    lowStockRes
                ] = await Promise.all([
                    api.get('/analytics/stats'),
                    api.get('/analytics/consumption-trend'),
                    api.get('/analytics/production-trend'),
                    api.get('/analytics/top-consumed'),
                    api.get('/analytics/heatmap-data'),
                    api.get('/analytics/low-stock')
                ]);

                // Process Charts Data
                const topConsumed = topConsumedRes.data || [];
                const consumptionTrend = trendRes.data || [];
                const productionTrend = productionTrendRes.data || { labels: [], values: [] };

                // Format Top Consumed for Chart
                const topLabels = topConsumed.slice(0, 5).map(i => i.name);
                const topValues = topConsumed.slice(0, 5).map(i => parseInt(i.total_consumed));

                // Format Consumption Trend for Chart
                const consumptionLabels = consumptionTrend.map(i => new Date(i.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
                const consumptionValues = consumptionTrend.map(i => parseInt(i.total_consumed));

                setData({
                    stats: statsRes.data || {
                        totalComponents: 0,
                        activePCBs: 0,
                        dailyProduction: 0,
                        lowStock: 0,
                        pendingOrders: 0
                    },
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
        };

        fetchData();
    }, []);

    if (loading) return <Loader fullScreen />;

    return (
        <div className="space-y-6 animate-fade-in">
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
