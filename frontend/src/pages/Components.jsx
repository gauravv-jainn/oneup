import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, Filter, Download, Edit, Trash2, Package, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';

const Components = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState('all'); // all, low, safe
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', part_number: '', current_stock: 0, monthly_required_quantity: 0, estimated_arrival_days: '',
        description: '', spare_part_status: '', status_description: '', status_count: '', total_entries: '', dc_no: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [highlightId, setHighlightId] = useState(null);
    const rowRefs = useRef({});

    useEffect(() => {
        fetchComponents();
    }, []);

    // Sync search term from URL params (when navigating from Header search)
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch) setSearchTerm(urlSearch);
    }, [searchParams]);

    // Handle highlight param from heatmap navigation
    useEffect(() => {
        const hId = searchParams.get('highlight');
        if (hId && components.length > 0) {
            const numericId = parseInt(hId, 10);
            const exists = components.find(c => c.id === numericId);
            if (!exists) {
                toast.error('Component not found');
                setSearchParams({}, { replace: true });
                return;
            }

            // Clear filters so the component is visible
            setSearchTerm('');
            setStatusFilter('all');
            setHighlightId(numericId);

            // Scroll to row after a brief render delay
            setTimeout(() => {
                const el = rowRefs.current[numericId];
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150);

            // Remove highlight after 2 seconds
            const timer = setTimeout(() => {
                setHighlightId(null);
                // Clean URL param
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('highlight');
                setSearchParams(newParams, { replace: true });
            }, 2200);

            return () => clearTimeout(timer);
        }
    }, [searchParams, components]);

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
            setFormData({
                name: '', part_number: '', current_stock: 0, monthly_required_quantity: 0, estimated_arrival_days: '',
                description: '', spare_part_status: '', status_description: '', status_count: '', total_entries: '', dc_no: ''
            });
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
        setFormData({
            ...comp,
            estimated_arrival_days: comp.estimated_arrival_days || '',
            description: comp.description || '',
            spare_part_status: comp.spare_part_status || '',
            status_description: comp.status_description || '',
            status_count: comp.status_count || '',
            total_entries: comp.total_entries || '',
            dc_no: comp.dc_no || ''
        });
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

    const getSpStatusVariant = (status) => {
        if (!status) return 'gray';
        const s = status.toUpperCase();
        if (s === 'NFF') return 'gray';
        if (s === 'SP' || s === 'SPARE PART') return 'blue';
        if (s === 'OK' || s === 'GOOD') return 'green';
        if (s === 'FAIL' || s === 'DEFECTIVE') return 'red';
        return 'orange';
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
                    <Button variant="secondary" className="gap-2" onClick={() => window.location.href = '/import-export'}>
                        <Upload size={18} /> Bulk Upload
                    </Button>
                    <Button onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', part_number: '', current_stock: 0, monthly_required_quantity: 0, estimated_arrival_days: '', description: '', spare_part_status: '', status_description: '', status_count: '', total_entries: '', dc_no: '' }); }} className="gap-2">
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
                        className="input pl-11 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="seg-container">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`seg-btn px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === 'all' ? 'active shadow-sm text-primary' : ''}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter('low')}
                            className={`seg-btn px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === 'low' ? 'active shadow-sm text-red-500' : ''}`}
                        >
                            Low Stock
                        </button>
                        <button
                            onClick={() => setStatusFilter('safe')}
                            className={`seg-btn px-3 py-1.5 rounded-md text-sm font-medium ${statusFilter === 'safe' ? 'active shadow-sm text-green-500' : ''}`}
                        >
                            In Stock
                        </button>
                    </div>
                </div>
            </Card>

            {/* Data Table */}
            <Card className="overflow-hidden border-0 p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead className="theme-table-header">
                            <tr>
                                <th className="px-4 py-4">Component</th>
                                <th className="px-4 py-4">Part No.</th>
                                <th className="px-4 py-4">Description</th>
                                <th className="px-4 py-4 text-right">Stock</th>
                                <th className="px-4 py-4 text-right">ETA</th>
                                <th className="px-4 py-4">Inv. Status</th>
                                <th className="px-4 py-4">SP Status</th>
                                <th className="px-4 py-4 text-right">Status Count</th>
                                <th className="px-4 py-4">DC No</th>
                                <th className="px-4 py-4 text-right">Total Entries</th>
                                <th className="px-4 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-default">
                            {filteredComponents.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="px-6 py-12 text-center text-secondary">
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
                                        <tr
                                            key={comp.id}
                                            ref={el => { rowRefs.current[comp.id] = el; }}
                                            className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${highlightId === comp.id ? 'highlight-row' : ''}`}
                                        >
                                            {/* Component Name */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                                                        <Package size={16} />
                                                    </div>
                                                    <span className="font-medium text-primary text-sm">{comp.name}</span>
                                                </div>
                                            </td>
                                            {/* Part Number */}
                                            <td className="px-4 py-3">
                                                <code className="code-tag">
                                                    {comp.part_number}
                                                </code>
                                            </td>
                                            {/* Description */}
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-secondary max-w-[160px] truncate block" title={comp.description || '—'}>
                                                    {comp.description || '—'}
                                                </span>
                                            </td>
                                            {/* Stock Level */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-primary text-sm font-mono">{comp.current_stock}</span>
                                                    <span className="text-[10px] text-secondary">/ {comp.monthly_required_quantity} req</span>
                                                </div>
                                            </td>
                                            {/* ETA */}
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-xs text-primary font-mono">
                                                    {comp.estimated_arrival_days ? `${comp.estimated_arrival_days}d` : '—'}
                                                </span>
                                            </td>
                                            {/* Inventory Status Badge */}
                                            <td className="px-4 py-3">
                                                <Badge variant={status.variant} className="gap-1 pl-1 pr-2 text-[11px]">
                                                    {StatusIcon && <StatusIcon size={10} />}
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            {/* SP Status Badge */}
                                            <td className="px-4 py-3">
                                                {comp.spare_part_status ? (
                                                    <Badge variant={getSpStatusVariant(comp.spare_part_status)} className="text-[11px] px-2" title={comp.status_description || ''}>
                                                        {comp.spare_part_status}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted">—</span>
                                                )}
                                            </td>
                                            {/* Status Count */}
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm font-mono text-primary">
                                                    {comp.status_count != null ? comp.status_count : '—'}
                                                </span>
                                            </td>
                                            {/* DC No */}
                                            <td className="px-4 py-3">
                                                {comp.dc_no ? (
                                                    <code className="code-tag">
                                                        {comp.dc_no}
                                                    </code>
                                                ) : (
                                                    <span className="text-xs text-muted">—</span>
                                                )}
                                            </td>
                                            {/* Total Entries */}
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm font-mono text-primary">
                                                    {comp.total_entries != null ? comp.total_entries : '—'}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" className="p-1.5 h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(comp)}>
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-1.5 h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleDelete(comp.id)}>
                                                        <Trash2 size={14} />
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
                    {/* --- Identity --- */}
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Identity</p>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Description</label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="e.g. SMD ceramic capacitor"
                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* --- Inventory --- */}
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider pt-2">Inventory</p>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Current Stock</label>
                            <input
                                type="number" required min="0"
                                className="input w-full"
                                value={formData.current_stock} onChange={e => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Monthly Req.</label>
                            <input
                                type="number" required min="1"
                                className="input w-full"
                                value={formData.monthly_required_quantity} onChange={e => setFormData({ ...formData, monthly_required_quantity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">ETA (days)</label>
                            <input
                                type="number" min="1"
                                className="input w-full"
                                placeholder="e.g. 7"
                                value={formData.estimated_arrival_days} onChange={e => setFormData({ ...formData, estimated_arrival_days: e.target.value ? parseInt(e.target.value) : '' })}
                            />
                        </div>
                    </div>

                    {/* --- Spare Part Status --- */}
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider pt-2">Spare Part Status</p>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">SP Status</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="e.g. NFF, SP"
                                value={formData.spare_part_status} onChange={e => setFormData({ ...formData, spare_part_status: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Status Desc.</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="e.g. No Fault Found"
                                value={formData.status_description} onChange={e => setFormData({ ...formData, status_description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Status Count</label>
                            <input
                                type="number" min="0"
                                className="input w-full"
                                value={formData.status_count} onChange={e => setFormData({ ...formData, status_count: e.target.value ? parseInt(e.target.value) : '' })}
                            />
                        </div>
                    </div>

                    {/* --- Tracking --- */}
                    <p className="text-xs font-semibold text-secondary uppercase tracking-wider pt-2">Tracking</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">DC No</label>
                            <input
                                type="text"
                                className="input w-full font-mono"
                                placeholder="e.g. RC2527000784"
                                value={formData.dc_no} onChange={e => setFormData({ ...formData, dc_no: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Total Entries</label>
                            <input
                                type="number" min="0"
                                className="input w-full"
                                value={formData.total_entries} onChange={e => setFormData({ ...formData, total_entries: e.target.value ? parseInt(e.target.value) : '' })}
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
