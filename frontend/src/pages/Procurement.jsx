import { useState, useEffect } from 'react';
import api from '../services/api';
import { Truck, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

const Procurement = () => {
    const [triggers, setTriggers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTrigger, setSelectedTrigger] = useState(null);
    const [deliveryForm, setDeliveryForm] = useState({
        quantity_ordered: '',
        expected_delivery_date: '',
        supplier_name: ''
    });

    const fetchTriggers = async () => {
        try {
            const res = await api.get('/procurement/triggers');
            setTriggers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTriggers();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        if (status === 'ordered') {
            const trigger = triggers.find(t => t.id === id);
            setSelectedTrigger(trigger);
            setDeliveryForm({
                quantity_ordered: trigger.required_threshold * 2, // Default suggestion
                expected_delivery_date: '',
                supplier_name: ''
            });
            setIsModalOpen(true);
        } else {
            // For 'received' or direct status change without details
            try {
                await api.put(`/procurement/triggers/${id}`, { status });
                fetchTriggers();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const submitOrderDetails = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/procurement/triggers/${selectedTrigger.id}`, {
                status: 'ordered',
                ...deliveryForm
            });
            setIsModalOpen(false);
            fetchTriggers();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Procurement Management</h1>

            {/* Incoming Deliveries Section could go here */}

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3">Component</th>
                            <th className="px-6 py-3">Stock / Threshold</th>
                            <th className="px-6 py-3">Trigger Date</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Delivery Info</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {triggers.map((trigger) => (
                            <tr key={trigger.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3">
                                    <div className="font-medium text-slate-700">{trigger.component_name}</div>
                                    <div className="text-xs text-slate-500">{trigger.part_number}</div>
                                </td>
                                <td className="px-6 py-3">
                                    <span className="text-red-500 font-bold">{trigger.current_stock}</span>
                                    <span className="text-slate-400"> / {trigger.required_threshold}</span>
                                </td>
                                <td className="px-6 py-3 text-slate-500 text-sm">
                                    {new Date(trigger.trigger_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trigger.status === 'pending' ? 'bg-red-100 text-red-800' :
                                            trigger.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>
                                        {trigger.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-600">
                                    {trigger.status === 'ordered' && (
                                        <div>
                                            <p className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(trigger.expected_delivery_date).toLocaleDateString()}</p>
                                            <p className="text-xs opacity-75">{trigger.quantity_ordered} units from {trigger.supplier_name}</p>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    {trigger.status === 'pending' && (
                                        <button
                                            onClick={() => handleUpdateStatus(trigger.id, 'ordered')}
                                            className="ml-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Mark Ordered
                                        </button>
                                    )}
                                    {trigger.status === 'ordered' && (
                                        <button
                                            onClick={() => handleUpdateStatus(trigger.id, 'received')}
                                            className="ml-2 text-sm text-green-600 hover:text-green-800 font-medium"
                                        >
                                            Mark Received
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Order Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Confirm Procurement Order</h3>
                        <form onSubmit={submitOrderDetails} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Ordered</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={deliveryForm.quantity_ordered}
                                    onChange={(e) => setDeliveryForm({ ...deliveryForm, quantity_ordered: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={deliveryForm.expected_delivery_date}
                                    onChange={(e) => setDeliveryForm({ ...deliveryForm, expected_delivery_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={deliveryForm.supplier_name}
                                    onChange={(e) => setDeliveryForm({ ...deliveryForm, supplier_name: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Confirm Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Procurement;
