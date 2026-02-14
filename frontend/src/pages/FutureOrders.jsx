import { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, CheckCircle, AlertTriangle, AlertOctagon, Plus, TrendingUp } from 'lucide-react';

const FutureOrders = () => {
    const [orders, setOrders] = useState([]);
    const [pcbTypes, setPcbTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        order_name: '',
        pcb_type_id: '',
        quantity_required: '',
        scheduled_production_date: '',
        delivery_date: ''
    });

    // Check Availability Result
    const [availability, setAvailability] = useState(null);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, pcbsRes] = await Promise.all([
                api.get('/future-orders'),
                api.get('/pcbs')
            ]);
            setOrders(ordersRes.data);
            setPcbTypes(pcbsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAvailability = async () => {
        if (!formData.pcb_type_id || !formData.quantity_required || !formData.scheduled_production_date) {
            alert("Please fill all fields to check availability.");
            return;
        }

        setChecking(true);
        try {
            const res = await api.post('/future-orders/check-availability', {
                pcb_type_id: formData.pcb_type_id,
                quantity: formData.quantity_required,
                scheduled_production_date: formData.scheduled_production_date
            });
            setAvailability(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.order_name || !formData.pcb_type_id || !formData.quantity_required || !formData.scheduled_production_date || !formData.delivery_date) {
            alert("Please fill all fields before creating the order.");
            return;
        }

        try {
            // Determine status
            let status = 'pending';
            if (availability) {
                status = availability.can_fulfill ? 'confirmed' : 'at_risk';
            }

            await api.post('/future-orders', {
                ...formData,
                status
            });
            setIsModalOpen(false);
            setFormData({
                order_name: '',
                pcb_type_id: '',
                quantity_required: '',
                scheduled_production_date: '',
                delivery_date: ''
            });
            setAvailability(null);
            fetchData();
            alert("Order created successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to create order: " + (error.response?.data?.error || error.message));
        }
    };

    const handleExecute = async (id) => {
        if (!confirm("Are you sure you want to execute this order? This will deduct physical stock.")) return;
        try {
            await api.post(`/future-orders/${id}/execute`);
            fetchData();
            alert("Order executed successfully!");
        } catch (error) {
            alert(error.response?.data?.error || "Execution failed");
        }
    };

    const handleCancel = async (id) => {
        if (!confirm("Cancel this order? Stock reservation will be released.")) return;
        try {
            await api.delete(`/future-orders/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Future Order Planning</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Order
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3">Order Name</th>
                            <th className="px-6 py-3">PCB Type</th>
                            <th className="px-6 py-3">Qty</th>
                            <th className="px-6 py-3">Scheduled / Delivery</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-700">{order.order_name}</td>
                                <td className="px-6 py-3 text-slate-600">{order.pcb_name}</td>
                                <td className="px-6 py-3 font-mono text-blue-600">{order.quantity_required}</td>
                                <td className="px-6 py-3 text-sm text-slate-500">
                                    <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Prod: {new Date(order.scheduled_production_date).toLocaleDateString()}</div>
                                    <div className="flex items-center mt-1"><CheckCircle className="w-3 h-3 mr-1 text-green-500" /> Del: {new Date(order.delivery_date).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'at_risk' ? 'bg-red-100 text-red-800' :
                                            order.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {order.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right space-x-2">
                                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                                        <>
                                            <button
                                                onClick={() => handleExecute(order.id)}
                                                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                                                title="Execute Production"
                                            >
                                                Execute
                                            </button>
                                            <button
                                                onClick={() => handleCancel(order.id)}
                                                className="text-sm text-red-400 hover:text-red-600"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Order Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Create Future Order</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Order Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.order_name}
                                    onChange={(e) => setFormData({ ...formData, order_name: e.target.value })}
                                    placeholder="e.g. Client X May Batch"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">PCB Type</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.pcb_type_id}
                                    onChange={(e) => setFormData({ ...formData, pcb_type_id: e.target.value })}
                                >
                                    <option value="">Select PCB</option>
                                    {pcbTypes.map(pcb => <option key={pcb.id} value={pcb.id}>{pcb.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Required</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.quantity_required}
                                    onChange={(e) => setFormData({ ...formData, quantity_required: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Production</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.scheduled_production_date}
                                    onChange={(e) => setFormData({ ...formData, scheduled_production_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.delivery_date}
                                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <button
                                onClick={handleCheckAvailability}
                                disabled={checking}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex justify-center items-center transition"
                            >
                                {checking ? 'Calculating...' : 'Check Stock Availability'}
                            </button>
                        </div>

                        {availability && (
                            <div className={`mb-6 p-4 rounded-lg border ${availability.can_fulfill ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center mb-3">
                                    {availability.can_fulfill ?
                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" /> :
                                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                                    }
                                    <h4 className={`font-bold ${availability.can_fulfill ? 'text-green-800' : 'text-red-800'}`}>
                                        {availability.can_fulfill ? 'Order can be fulfilled' : 'Stock Shortage Detected'}
                                    </h4>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b border-black/5">
                                                <th className="pb-2">Component</th>
                                                <th className="pb-2">Required</th>
                                                <th className="pb-2">Projected Available</th>
                                                <th className="pb-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {availability.components.map(comp => (
                                                <tr key={comp.component_id} className="border-b border-black/5 last:border-0">
                                                    <td className="py-2">{comp.name}</td>
                                                    <td className="py-2 font-mono">{comp.required_quantity}</td>
                                                    <td className="py-2 font-mono">
                                                        {comp.projected_available}
                                                        <span className="text-xs text-slate-500 ml-1">
                                                            (Curr: {comp.current_stock} + Inc: {comp.incoming_stock} - Res: {comp.reserved_stock})
                                                        </span>
                                                    </td>
                                                    <td className={`py-2 font-bold ${comp.status === 'shortage' ? 'text-red-600' : 'text-green-600'}`}>
                                                        {comp.status === 'shortage' ? `Shortfall: ${comp.shortfall}` : 'OK'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {!availability.can_fulfill && (
                                    <p className="mt-3 text-xs text-red-600">
                                        Recommendation: Create procurement orders for shortfall items with delivery before {formData.scheduled_production_date}.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className={`px-4 py-2 text-white rounded-lg transition ${availability && !availability.can_fulfill ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {availability && !availability.can_fulfill ? 'Confirm Anyway (At Risk)' : 'Confirm Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FutureOrders;
