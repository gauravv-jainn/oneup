import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const Components = () => {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', part_number: '', current_stock: 0, monthly_required_quantity: 0
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            const res = await api.get('/components');
            setComponents(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/components/${editingId}`, formData);
            } else {
                await api.post('/components', formData);
            }
            setShowModal(false);
            setFormData({ name: '', part_number: '', current_stock: 0, monthly_required_quantity: 0 });
            setEditingId(null);
            fetchComponents();
        } catch (error) {
            alert(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this component?')) {
            try {
                await api.delete(`/components/${id}`);
                fetchComponents();
            } catch (error) {
                alert(error.response?.data?.error || 'Delete failed');
            }
        }
    };

    const openEdit = (comp) => {
        setFormData(comp);
        setEditingId(comp.id);
        setShowModal(true);
    };

    const getStockStatus = (stock, required) => {
        const ratio = stock / required;
        if (ratio < 0.2) return { label: 'Low Stock', color: 'bg-red-100 text-red-800' };
        if (ratio < 0.5) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
        return { label: 'Adequate', color: 'bg-green-100 text-green-800' };
    };

    const filteredComponents = components.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.part_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Components Inventory</h1>
                <button
                    onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', part_number: '', current_stock: 0, monthly_required_quantity: 0 }); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add Component
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search components..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 text-sm font-semibold uppercase">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Part Number</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Monthly Req</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredComponents.map((comp) => {
                                const status = getStockStatus(comp.current_stock, comp.monthly_required_quantity);
                                return (
                                    <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{comp.name}</td>
                                        <td className="px-6 py-4 text-slate-500">{comp.part_number}</td>
                                        <td className="px-6 py-4 font-mono text-slate-700">{comp.current_stock}</td>
                                        <td className="px-6 py-4 text-slate-500">{comp.monthly_required_quantity}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex space-x-2">
                                            <button onClick={() => openEdit(comp)} className="text-blue-600 hover:text-blue-800">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(comp.id)} className="text-red-600 hover:text-red-800">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Component' : 'Add Component'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text" placeholder="Component Name" required
                                className="w-full border p-2 rounded"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <input
                                type="text" placeholder="Part Number" required
                                className="w-full border p-2 rounded"
                                value={formData.part_number} onChange={e => setFormData({ ...formData, part_number: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500">Current Stock</label>
                                    <input
                                        type="number" required min="0"
                                        className="w-full border p-2 rounded"
                                        value={formData.current_stock} onChange={e => setFormData({ ...formData, current_stock: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500">Monthly Req</label>
                                    <input
                                        type="number" required min="1"
                                        className="w-full border p-2 rounded"
                                        value={formData.monthly_required_quantity} onChange={e => setFormData({ ...formData, monthly_required_quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Components;
