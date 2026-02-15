import { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, CheckCircle, AlertTriangle, Plus, TrendingUp, Tag, Clock, Edit, XCircle, Trash2, Cpu } from 'lucide-react';
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
    const [editingOrder, setEditingOrder] = useState(null);
    const [formData, setFormData] = useState({
        order_name: '',
        delivery_date: '',
        items: [{ pcb_type_id: '', quantity_required: '' }]
    });

    // Estimation & Availability
    const [availability, setAvailability] = useState(null);
    const [estimation, setEstimation] = useState(null);
    const [checking, setChecking] = useState(false);
    const [estimating, setEstimating] = useState(false);

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

    // Add PCB row
    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { pcb_type_id: '', quantity_required: '' }]
        }));
    };

    // Remove PCB row
    const removeItem = (idx) => {
        if (formData.items.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }));
    };

    // Update item
    const updateItem = (idx, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
        }));
    };

    // Estimate delivery date
    const handleEstimate = async () => {
        const validItems = formData.items.filter(i => i.pcb_type_id && i.quantity_required);
        if (validItems.length === 0) {
            toast.warn("Add at least one PCB with quantity to estimate.");
            return;
        }
        setEstimating(true);
        try {
            const res = await api.post('/future-orders/estimate_date', {
                items: validItems.map(i => ({ pcb_type_id: parseInt(i.pcb_type_id), quantity_required: parseInt(i.quantity_required) }))
            });
            setEstimation(res.data);
            toast.info(`Estimated production date: ${res.data.estimated_production_date}`);
        } catch (err) {
            toast.error("Estimation failed");
        } finally {
            setEstimating(false);
        }
    };

    // Check stock availability
    const handleCheckAvailability = async () => {
        const validItems = formData.items.filter(i => i.pcb_type_id && i.quantity_required);
        if (validItems.length === 0 || !estimation?.estimated_production_date) {
            toast.warn("Estimate date first, then check availability.");
            return;
        }
        setChecking(true);
        try {
            const res = await api.post('/future-orders/check-availability', {
                items: validItems.map(i => ({ pcb_type_id: parseInt(i.pcb_type_id), quantity_required: parseInt(i.quantity_required) })),
                scheduled_production_date: estimation.estimated_production_date
            });
            setAvailability(res.data);
            toast.info("Availability check complete");
        } catch (err) {
            toast.error("Failed to check availability");
        } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validItems = formData.items.filter(i => i.pcb_type_id && i.quantity_required);
        if (!formData.order_name || validItems.length === 0 || !formData.delivery_date) {
            toast.warn("Please fill order name, at least one PCB+quantity, and delivery date.");
            return;
        }

        const scheduledDate = estimation?.estimated_production_date || new Date().toISOString().split('T')[0];

        try {
            if (editingOrder) {
                await api.put(`/future-orders/${editingOrder.id}`, {
                    order_name: formData.order_name,
                    scheduled_production_date: scheduledDate,
                    delivery_date: formData.delivery_date,
                    items: validItems.map(i => ({ pcb_type_id: parseInt(i.pcb_type_id), quantity_required: parseInt(i.quantity_required) }))
                });
                toast.success("Order updated successfully");
            } else {
                let status = 'pending';
                if (availability) {
                    status = availability.can_fulfill ? 'confirmed' : 'at_risk';
                }
                const payload = {
                    order_name: formData.order_name,
                    scheduled_production_date: scheduledDate,
                    delivery_date: formData.delivery_date,
                    status,
                    items: validItems.map(i => ({ pcb_type_id: parseInt(i.pcb_type_id), quantity_required: parseInt(i.quantity_required) }))
                };
                console.log("Submitting Order Payload:", payload);

                await api.post('/future-orders', payload);
                toast.success("Future order created successfully");
            }
            closeModal();
            fetchData();
        } catch (error) {
            toast.error("Failed to save order: " + (error.response?.data?.error || error.message));
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingOrder(null);
        setAvailability(null);
        setEstimation(null);
        setFormData({
            order_name: '',
            delivery_date: '',
            items: [{ pcb_type_id: '', quantity_required: '' }]
        });
    };

    const openCreateModal = () => {
        closeModal();
        setIsModalOpen(true);
    };

    const openEditModal = (order) => {
        setEditingOrder(order);
        const items = order.items && order.items.length > 0
            ? order.items.map(i => ({ pcb_type_id: String(i.pcb_type_id), quantity_required: String(i.quantity_required) }))
            : [{ pcb_type_id: String(order.pcb_type_id || ''), quantity_required: String(order.quantity_required || '') }];
        setFormData({
            order_name: order.order_name,
            delivery_date: order.delivery_date?.split('T')[0] || '',
            items
        });
        setIsModalOpen(true);
    };

    const handleExecute = async (id) => {
        try {
            await api.post(`/future-orders/${id}/execute`);
            toast.success("Order executed — production recorded!");
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || "Execution failed");
        }
    };

    const handleCancel = async (id) => {
        try {
            await api.delete(`/future-orders/${id}/cancel`);
            toast.info("Order cancelled");
            fetchData();
        } catch (err) {
            toast.error("Failed to cancel");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this order?")) return;
        try {
            await api.delete(`/future-orders/${id}`);
            toast.success("Order deleted");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: { variant: 'warning', label: 'Pending' },
            confirmed: { variant: 'success', label: 'Confirmed' },
            at_risk: { variant: 'danger', label: 'At Risk' },
            completed: { variant: 'info', label: 'Completed' },
            cancelled: { variant: 'default', label: 'Cancelled' }
        };
        const s = map[status] || map.pending;
        return <Badge variant={s.variant}>{s.label}</Badge>;
    };

    if (loading) return <Loader fullScreen />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Order Planning</h1>
                    <p className="text-secondary mt-1">Manage future production schedules, multi-PCB orders, and reservations</p>
                </div>
                <Button onClick={openCreateModal}>
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
                                {/* Show PCB items */}
                                {order.items && order.items.length > 0 ? (
                                    <div className="mt-1 space-y-0.5">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center text-sm text-secondary">
                                                <Cpu size={12} className="mr-1 text-blue-400" />
                                                {item.pcb_name} × {item.quantity_required}
                                            </div>
                                        ))}
                                    </div>
                                ) : order.pcb_name ? (
                                    <div className="flex items-center text-sm text-secondary mt-1">
                                        <Tag size={14} className="mr-1" />
                                        {order.pcb_name} × {order.quantity_required}
                                    </div>
                                ) : null}
                            </div>
                            {getStatusBadge(order.status)}
                        </div>

                        <div className="flex-1 space-y-2 mb-4 text-sm">
                            <div className="flex items-center text-secondary">
                                <Calendar size={14} className="mr-2 text-blue-500" />
                                <span className="w-20">Production:</span>
                                <span className="text-primary font-medium">{order.scheduled_production_date ? new Date(order.scheduled_production_date).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex items-center text-secondary">
                                <Clock size={14} className="mr-2 text-green-500" />
                                <span className="w-20">Delivery:</span>
                                <span className="text-primary font-medium">{new Date(order.delivery_date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-default flex justify-end gap-2">
                            {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <>
                                    <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEditModal(order)}>
                                        <Edit size={14} className="mr-1" /> Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleCancel(order.id)}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => handleExecute(order.id)} className="bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20">
                                        Execute
                                    </Button>
                                </>
                            )}
                            {(order.status === 'completed' || order.status === 'cancelled') && (
                                <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(order.id)}>
                                    <Trash2 size={14} className="mr-1" /> Delete
                                </Button>
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

            {/* Create/Edit Order Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingOrder ? 'Edit Order' : 'Create Multi-PCB Order'}
            >
                <div className="space-y-5">
                    {/* Order Name */}
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

                    {/* PCB Items */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-secondary">PCB Items</label>
                            <button onClick={addItem} className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
                                <Plus size={14} /> Add PCB
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-8">
                                        <select
                                            className="input w-full"
                                            value={item.pcb_type_id}
                                            onChange={(e) => updateItem(idx, 'pcb_type_id', e.target.value)}
                                        >
                                            <option value="">Select PCB</option>
                                            {pcbTypes.map(pcb => <option key={pcb.id} value={pcb.id}>{pcb.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            className="input w-full"
                                            value={item.quantity_required}
                                            onChange={(e) => updateItem(idx, 'quantity_required', e.target.value)}
                                            placeholder="Qty"
                                            min="1"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        {formData.items.length > 1 && (
                                            <button onClick={() => removeItem(idx)} className="text-secondary hover:text-red-500 transition-colors p-1">
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delivery Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Delivery Date</label>
                        <input
                            type="date"
                            className="input w-full"
                            value={formData.delivery_date}
                            onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                        />
                    </div>

                    {/* Estimate & Check Actions */}
                    <div className="border-t border-default pt-4 space-y-3">
                        {!editingOrder && (
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={handleEstimate}
                                    disabled={estimating}
                                    className="justify-center"
                                >
                                    {estimating ? 'Estimating...' : '📅 Estimate Date'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleCheckAvailability}
                                    disabled={checking || !estimation}
                                    className="justify-center"
                                >
                                    {checking ? 'Checking...' : '📦 Check Stock'}
                                </Button>
                            </div>
                        )}

                        {/* Estimation Result */}
                        {estimation && (
                            <div className={`p-3 rounded-lg border ${estimation.feasible ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10' : 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar size={16} className={estimation.feasible ? 'text-green-600' : 'text-amber-600'} />
                                    <span className="text-sm font-bold text-primary">
                                        Est. Production: {estimation.estimated_production_date}
                                    </span>
                                    {estimation.feasible ? (
                                        <Badge variant="success">Ready Now</Badge>
                                    ) : (
                                        <Badge variant="warning">Wait {estimation.max_wait_days}d</Badge>
                                    )}
                                </div>
                                {estimation.details?.filter(d => d.shortage > 0).length > 0 && (
                                    <div className="text-xs text-secondary space-y-1">
                                        {estimation.details.filter(d => d.shortage > 0).map((d, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{d.name}</span>
                                                <span className="text-red-500">short {d.shortage} (≈{d.estimated_days}d wait)</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Availability Result */}
                        {availability && (
                            <div className={`p-3 rounded-lg border ${availability.can_fulfill ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10' : 'bg-red-50/50 border-red-200 dark:bg-red-900/10'}`}>
                                <div className="flex items-center mb-2">
                                    {availability.can_fulfill ?
                                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> :
                                        <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                                    }
                                    <span className={`font-bold text-sm ${availability.can_fulfill ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                        {availability.can_fulfill ? 'All Stock Available' : 'Shortage Detected'}
                                    </span>
                                </div>
                                <div className="max-h-32 overflow-y-auto text-xs">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-left pb-1 text-secondary">Component</th>
                                                <th className="text-right pb-1 text-secondary">Need</th>
                                                <th className="text-right pb-1 text-secondary">Avail</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {availability.components.map(comp => (
                                                <tr key={comp.component_id} className="border-t border-default/50">
                                                    <td className="py-1 text-primary">{comp.name}</td>
                                                    <td className="py-1 text-right font-mono">{comp.required_quantity}</td>
                                                    <td className={`py-1 text-right font-mono font-bold ${comp.status === 'shortage' ? 'text-red-600' : 'text-green-600'}`}>
                                                        {comp.projected_available}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                            <Button
                                onClick={handleSubmit}
                                className={!editingOrder && availability && !availability.can_fulfill ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
                            >
                                {editingOrder
                                    ? 'Save Changes'
                                    : (availability && !availability.can_fulfill ? 'Create (At Risk)' : 'Confirm Order')
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FutureOrders;
