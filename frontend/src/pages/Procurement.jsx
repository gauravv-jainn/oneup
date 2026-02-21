import { useState, useEffect } from 'react';
import api from '../services/api';
import { Truck, CheckCircle, Clock, AlertTriangle, Calendar, ShoppingCart, ArrowRight, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';

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
            // Auto-create triggers for any newly critical components
            await api.get('/procurement/sync-triggers');
            const res = await api.get('/procurement/triggers');
            setTriggers(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load procurement triggers");
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
        } else if (status === 'received') {
            // Send existing order details so backend can update stock
            const trigger = triggers.find(t => t.id === id);
            try {
                await api.put(`/procurement/triggers/${id}`, {
                    status: 'received',
                    quantity_ordered: trigger.quantity_ordered,
                    expected_delivery_date: trigger.expected_delivery_date,
                    supplier_name: trigger.supplier_name
                });
                fetchTriggers();
                toast.success(`Stock updated: +${trigger.quantity_ordered} units received`);
            } catch (error) {
                console.error(error);
                toast.error("Failed to update status");
            }
        } else {
            try {
                await api.put(`/procurement/triggers/${id}`, { status });
                fetchTriggers();
                toast.success(`Action successful: Marked as ${status}`);
            } catch (error) {
                console.error(error);
                toast.error("Failed to update status");
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
            toast.success("Order confirmed successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to confirm order");
        }
    };

    // Calculate Stats
    const pendingCount = triggers.filter(t => t.status === 'pending').length;
    const orderedCount = triggers.filter(t => t.status === 'ordered').length;
    const incomingItems = triggers
        .filter(t => t.status === 'ordered')
        .reduce((acc, t) => acc + (t.quantity_ordered || 0), 0);

    if (loading) return <Loader fullScreen />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Procurement</h1>
                    <p className="text-secondary mt-1">Manage stock replenishment and supplier orders</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-secondary text-sm font-medium">Critical Pending</p>
                        <p className="text-2xl font-bold text-primary">{pendingCount}</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <p className="text-secondary text-sm font-medium">Active Orders</p>
                        <p className="text-2xl font-bold text-primary">{orderedCount}</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-secondary text-sm font-medium">Incoming Units</p>
                        <p className="text-2xl font-bold text-primary">{incomingItems}</p>
                    </div>
                </Card>
            </div>

            {/* Main Table */}
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-secondary">
                            <tr>
                                <th className="px-6 py-4">Component</th>
                                <th className="px-6 py-4">Stock Level</th>
                                <th className="px-6 py-4">Trigger Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Delivery Info</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-default">
                            {triggers.map((trigger) => (
                                <tr key={trigger.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-primary">{trigger.component_name}</div>
                                        <div className="text-xs text-secondary font-mono">{trigger.part_number}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono font-bold ${trigger.current_stock < trigger.required_threshold ? 'text-red-500' : 'text-primary'}`}>
                                                {trigger.current_stock}
                                            </span>
                                            <span className="text-secondary text-xs">/ {trigger.required_threshold}</span>
                                        </div>
                                        {trigger.current_stock < trigger.required_threshold && (
                                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500"
                                                    style={{ width: `${Math.min((trigger.current_stock / trigger.required_threshold) * 100, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-secondary">
                                        {new Date(trigger.trigger_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={
                                            trigger.status === 'pending' ? 'red' :
                                                trigger.status === 'ordered' ? 'blue' : 'green'
                                        }>
                                            {trigger.status === 'pending' && <AlertTriangle size={12} className="mr-1" />}
                                            {trigger.status === 'ordered' && <Clock size={12} className="mr-1" />}
                                            {trigger.status === 'received' && <CheckCircle size={12} className="mr-1" />}
                                            {trigger.status.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {trigger.status === 'ordered' ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center text-primary font-medium">
                                                    <Calendar size={14} className="mr-1.5 text-blue-500" />
                                                    {new Date(trigger.expected_delivery_date).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-secondary">
                                                    {trigger.quantity_ordered} units via <span className="font-semibold">{trigger.supplier_name}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-secondary opacity-50 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {trigger.status === 'pending' && (
                                            <Button size="sm" onClick={() => handleUpdateStatus(trigger.id, 'ordered')} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                Order Now <ArrowRight size={14} className="ml-1" />
                                            </Button>
                                        )}
                                        {trigger.status === 'ordered' && (
                                            <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(trigger.id, 'received')} className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20">
                                                <Package size={14} className="mr-1" /> Receive
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {triggers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-secondary">
                                        <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-20" />
                                        <p>No active procurement triggers.</p>
                                        <p className="text-sm">Stock levels are healthy.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Order Details Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Confirm Procurement Order"
            >
                <form onSubmit={submitOrderDetails} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Quantity to Order</label>
                        <input
                            type="number"
                            required
                            className="input w-full"
                            value={deliveryForm.quantity_ordered}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, quantity_ordered: e.target.value })}
                        />
                        <p className="text-xs text-secondary">Recommended: {selectedTrigger?.required_threshold * 2} units</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Supplier Name</label>
                        <input
                            type="text"
                            required
                            className="input w-full"
                            value={deliveryForm.supplier_name}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, supplier_name: e.target.value })}
                            placeholder="e.g. DigiKey, Mouser"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Expected Delivery Date</label>
                        <input
                            type="date"
                            required
                            className="input w-full"
                            value={deliveryForm.expected_delivery_date}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, expected_delivery_date: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-default mt-6">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Confirm Order
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Procurement;
