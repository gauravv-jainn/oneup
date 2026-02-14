import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, Filter, Download, Edit, Trash2, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';

const Components = () => {
    const [searchParams] = useSearchParams();
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState('all'); // all, low, safe
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', part_number: '', current_stock: 0, monthly_required_quantity: 0
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchComponents();
    }, []);

    // Sync search term from URL params (when navigating from Header search)
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch) setSearchTerm(urlSearch);
    }, [searchParams]);

    const fetchComponents = async () => {
        try {
            const res = await api.get('/components');
            setComponents(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load inventory data');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/components/${editingId}`, formData);
                toast.success('Component updated successfully');
            } else {
                await api.post('/components', formData);
                toast.success('New component added to inventory');
            }
            setShowModal(false);
            setFormData({ name: '', part_number: '', current_stock: 0, monthly_required_quantity: 0 });
            setEditingId(null);
            fetchComponents();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this component?')) {
            try {
                await api.delete(`/components/${id}`);
                toast.success('Component deleted successfully');
                fetchComponents();
            } catch (error) {
                toast.error(error.response?.data?.error || 'Delete failed');
            }
        }
    };

    const openEdit = (comp) => {
        setFormData(comp);
        setEditingId(comp.id);
        setShowModal(true);
    };

    const getStockStatus = (stock, required) => {
        if (required === 0) return { label: 'Unknown', variant: 'gray' };
        const ratio = stock / required;
        if (ratio < 0.2) return { label: 'Low Stock', variant: 'red', icon: AlertTriangle };
        if (ratio < 0.5) return { label: 'Medium', variant: 'orange', icon: AlertTriangle };
        return { label: 'In Stock', variant: 'green', icon: CheckCircle };
    };

    const filteredComponents = components.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.part_number.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === 'all') return true;
        const status = getStockStatus(c.current_stock, c.monthly_required_quantity);
        if (statusFilter === 'low') return status.variant === 'red';
        if (statusFilter === 'safe') return status.variant === 'green';

        return true;
    });

    if (loading) return <Loader fullScreen />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Inventory Management</h1>
                    <p className="text-secondary mt-1">Track and manage your electronic components</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2" onClick={async () => {
                        try {
                            const res = await api.get('/excel/export/inventory', { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([res.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', 'inventory_export.xlsx');
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                            toast.success('Inventory exported successfully!');
                        } catch (error) {
                            toast.error('Failed to export inventory');
                        }
                    }}>
                        <Download size={18} /> Export
                    </Button>
                    <Button onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', part_number: '', current_stock: 0, monthly_required_quantity: 0 }); }} className="gap-2">
                        <Plus size={18} /> Add Component
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <Card className="flex flex-col md:flex-row gap-4 justify-between items-center p-4">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or part number..."
                        className="input pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-default">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter('low')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'low' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-500' : 'text-secondary hover:text-primary'}`}
                        >
                            Low Stock
                        </button>
                        <button
                            onClick={() => setStatusFilter('safe')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === 'safe' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-500' : 'text-secondary hover:text-primary'}`}
                        >
                            In Stock
                        </button>
                    </div>
                </div>
            </Card>

            {/* Data Table */}
            <Card className="overflow-hidden border-0 p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-secondary text-xs uppercase font-semibold tracking-wider border-b border-default">
                            <tr>
                                <th className="px-6 py-4">Component Details</th>
                                <th className="px-6 py-4">Part Number</th>
                                <th className="px-6 py-4">Stock Level</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-default">
                            {filteredComponents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-secondary">
                                        <div className="flex flex-col items-center justify-center">
                                            <Package size={48} className="opacity-20 mb-4" />
                                            <p className="text-lg font-medium">No components found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredComponents.map((comp) => {
                                    const status = getStockStatus(comp.current_stock, comp.monthly_required_quantity);
                                    const StatusIcon = status.icon;

                                    return (
                                        <tr key={comp.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                                        <Package size={20} />
                                                    </div>
                                                    <span className="font-medium text-primary">{comp.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-secondary border border-default">
                                                    {comp.part_number}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-primary">{comp.current_stock}</span>
                                                    <span className="text-xs text-secondary">/ {comp.monthly_required_quantity} req.</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={status.variant} className="gap-1.5 pl-1.5 pr-2.5">
                                                    {StatusIcon && <StatusIcon size={12} />}
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="p-2 h-8 w-8 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(comp)}>
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-2 h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(comp.id)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'Edit Component' : 'Add New Component'}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Component Name</label>
                        <input
                            type="text" required
                            className="input w-full"
                            placeholder="e.g. 10k Resistor"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Part Number</label>
                        <input
                            type="text" required
                            className="input w-full font-mono"
                            placeholder="e.g. RES-10K-0805"
                            value={formData.part_number} onChange={e => setFormData({ ...formData, part_number: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Current Stock</label>
                            <input
                                type="number" required min="0"
                                className="input w-full"
                                value={formData.current_stock} onChange={e => setFormData({ ...formData, current_stock: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Monthly Req.</label>
                            <input
                                type="number" required min="1"
                                className="input w-full"
                                value={formData.monthly_required_quantity} onChange={e => setFormData({ ...formData, monthly_required_quantity: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingId ? 'Save Changes' : 'Create Component'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Components;
