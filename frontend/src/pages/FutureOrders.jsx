import { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, CheckCircle, AlertTriangle, Plus, TrendingUp, Tag, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';

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
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAvailability = async () => {
        if (!formData.pcb_type_id || !formData.quantity_required || !formData.scheduled_production_date) {
            toast.warn("Please fill all fields to check availability.");
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
            toast.info("Availability check complete");
        } catch (error) {
            console.error(error);
            toast.error("Failed to check availability");
        } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.order_name || !formData.pcb_type_id || !formData.quantity_required || !formData.scheduled_production_date || !formData.delivery_date) {
            toast.warn("Please fill all fields before creating the order.");
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
            toast.success("Future order created successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create order: " + (error.response?.data?.error || error.message));
        }
    };

    const handleExecute = async (id) => {
        if (!confirm("Are you sure you want to execute this order? This will deduct physical stock.")) return;
        try {
            await api.post(`/future-orders/${id}/execute`);
            fetchData();
            toast.success("Order executed and stock deducted!");
        } catch (error) {
            toast.error(error.response?.data?.error || "Execution failed");
        }
    };

    const handleCancel = async (id) => {
        if (!confirm("Cancel this order? Stock reservation will be released.")) return;
        try {
            await api.delete(`/future-orders/${id}`);
            fetchData();
            toast.info("Order cancelled");
        } catch (error) {
            console.error(error);
            toast.error("Failed to cancel order");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <Badge variant="green" className="gap-1"><CheckCircle size={12} /> Confirmed</Badge>;
            case 'at_risk': return <Badge variant="red" className="gap-1"><AlertTriangle size={12} /> At Risk</Badge>;
            case 'completed': return <Badge variant="gray" className="gap-1"><CheckCircle size={12} /> Completed</Badge>;
            default: return <Badge variant="orange" className="gap-1"><Clock size={12} /> Pending</Badge>;
        }
    };

    if (loading) return <Loader fullScreen />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Order Planning</h1>
                    <p className="text-secondary mt-1">Manage future production schedules and reservations</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-2" /> New Order
                </Button>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => (
                    <Card key={order.id} className="flex flex-col h-full group hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-blue-500">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-primary">{order.order_name}</h3>
                                <div className="flex items-center text-sm text-secondary mt-1">
                                    <Tag size={14} className="mr-1" />
                                    {order.pcb_name}
                                </div>
                            </div>
                            {getStatusBadge(order.status)}
                        </div>

                        <div className="flex-1 space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <span className="text-secondary">Quantity</span>
                                <span className="font-bold text-primary font-mono">{order.quantity_required} Units</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center text-secondary">
                                    <Calendar size={14} className="mr-2 text-blue-500" />
                                    <span className="w-20">Production:</span>
                                    <span className="text-primary font-medium">{new Date(order.scheduled_production_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center text-secondary">
                                    <Clock size={14} className="mr-2 text-green-500" />
                                    <span className="w-20">Delivery:</span>
                                    <span className="text-primary font-medium">{new Date(order.delivery_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-default flex justify-end gap-2">
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleCancel(order.id)}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => handleExecute(order.id)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20">
                                        Execute Run
                                    </Button>
                                </>
                            )}
                            {order.status === 'completed' && (
                                <span className="text-xs text-secondary italic flex items-center">
                                    Order fulfilled <CheckCircle size={12} className="ml-1" />
                                </span>
                            )}
                        </div>
                    </Card>
                ))}
                {orders.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-default rounded-xl bg-slate-50/30">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No active orders found.</p>
                        <p className="text-sm">Create a new order to start planning.</p>
                    </div>
                )}
            </div>

            {/* Create Order Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Future Order"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Order Name</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={formData.order_name}
                                onChange={(e) => setFormData({ ...formData, order_name: e.target.value })}
                                placeholder="e.g. Client X May Batch"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">PCB Type</label>
                            <select
                                className="input w-full"
                                value={formData.pcb_type_id}
                                onChange={(e) => setFormData({ ...formData, pcb_type_id: e.target.value })}
                            >
                                <option value="">Select PCB</option>
                                {pcbTypes.map(pcb => <option key={pcb.id} value={pcb.id}>{pcb.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Quantity</label>
                            <input
                                type="number"
                                className="input w-full"
                                value={formData.quantity_required}
                                onChange={(e) => setFormData({ ...formData, quantity_required: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Scheduled Production</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={formData.scheduled_production_date}
                                onChange={(e) => setFormData({ ...formData, scheduled_production_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Delivery Date</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={formData.delivery_date}
                                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="border-t border-default pt-4">
                        <Button
                            variant="secondary"
                            onClick={handleCheckAvailability}
                            disabled={checking}
                            className="w-full justify-center mb-4"
                        >
                            {checking ? (
                                <div className="flex items-center gap-2">
                                    <Loader size="sm" />
                                    <span>Analyzing...</span>
                                </div>
                            ) : 'Check Stock Availability'}
                        </Button>

                        {availability && (
                            <div className={`mb-4 p-4 rounded-lg border ${availability.can_fulfill ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900' : 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900'}`}>
                                <div className="flex items-center mb-3">
                                    {availability.can_fulfill ?
                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" /> :
                                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                                    }
                                    <h4 className={`font-bold ${availability.can_fulfill ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                        {availability.can_fulfill ? 'Feasible' : 'Stock Shortage Detected'}
                                    </h4>
                                </div>

                                <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    <table className="w-full text-xs text-left">
                                        <thead>
                                            <tr>
                                                <th className="pb-1 text-secondary">Component</th>
                                                <th className="pb-1 text-right text-secondary">Required</th>
                                                <th className="pb-1 text-right text-secondary">Avail</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {availability.components.map(comp => (
                                                <tr key={comp.component_id} className="border-b border-black/5 last:border-0 border-default">
                                                    <td className="py-1.5 text-primary">{comp.name}</td>
                                                    <td className="py-1.5 text-right font-mono text-primary">{comp.required_quantity}</td>
                                                    <td className={`py-1.5 text-right font-mono font-bold ${comp.status === 'shortage' ? 'text-red-600' : 'text-green-600'}`}>
                                                        {comp.projected_available}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {!availability.can_fulfill && (
                                    <p className="mt-2 text-xs text-red-600 dark:text-red-400 italic">
                                        * Procurement needed for shortage items.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className={availability && !availability.can_fulfill ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
                            >
                                {availability && !availability.can_fulfill ? 'Create (At Risk)' : 'Confirm Order'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FutureOrders;
