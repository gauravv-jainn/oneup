import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, AlertTriangle, Factory, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalComponents: 0,
        lowStock: 0,
        productionEntries: 0,
        pendingTriggers: 0
    });
    const [topConsumed, setTopConsumed] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [componentsRes, triggersRes, topConsumedRes] = await Promise.all([
                    api.get('/components'),
                    api.get('/procurement/triggers'),
                    api.get('/analytics/top-consumed')
                ]);

                const components = componentsRes.data || [];
                const triggers = triggersRes.data || [];

                const lowStockCount = Array.isArray(components) ? components.filter(c => c.current_stock < (c.monthly_required_quantity * 0.2)).length : 0;
                const pendingTriggersCount = Array.isArray(triggers) ? triggers.filter(t => t.status === 'pending').length : 0;

                setStats({
                    totalComponents: Array.isArray(components) ? components.length : 0,
                    lowStock: lowStockCount,
                    productionEntries: '-',
                    pendingTriggers: pendingTriggersCount
                });

                setTopConsumed(Array.isArray(topConsumedRes.data) ? topConsumedRes.data : []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="text-center text-slate-500 mt-20">Loading dashboard...</div>;

    const cards = [
        { title: 'Total Components', value: stats.totalComponents, icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Low Stock Alerts', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
        { title: 'Pending Procurement', value: stats.pendingTriggers, icon: ShoppingCart, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        // Replaced Production Entries with something else or keep layout
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                            <div className={`p-4 rounded-lg ${card.bg} mr-4`}>
                                <Icon className={`w-8 h-8 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">{card.title}</p>
                                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Top Consumed Components</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topConsumed}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="total_consumed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/production" className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-dashed border-slate-300">
                            <Factory className="w-8 h-8 text-blue-600 mb-2" />
                            <span className="font-semibold text-slate-700">Record Production</span>
                        </Link>
                        <Link to="/components" className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-dashed border-slate-300">
                            <Package className="w-8 h-8 text-green-600 mb-2" />
                            <span className="font-semibold text-slate-700">Manage Inventory</span>
                        </Link>
                        <Link to="/procurement" className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-dashed border-slate-300">
                            <ShoppingCart className="w-8 h-8 text-yellow-600 mb-2" />
                            <span className="font-semibold text-slate-700">Procurement</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
