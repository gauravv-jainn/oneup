import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, ChevronDown, ChevronUp, Trash2, Save } from 'lucide-react';

const PCBs = () => {
    const [pcbs, setPCBs] = useState([]);
    const [components, setComponents] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newPCB, setNewPCB] = useState({ name: '', description: '' });

    // Add Component State
    const [addComponentData, setAddComponentData] = useState({ component_id: '', quantity_per_pcb: 1 });

    useEffect(() => {
        fetchPCBs();
        fetchComponents();
    }, []);

    const fetchPCBs = async () => {
        const res = await api.get('/pcbs');
        setPCBs(res.data);
    };

    const fetchComponents = async () => {
        const res = await api.get('/components');
        setComponents(res.data);
    };

    const fetchPCBDetails = async (id) => {
        const res = await api.get(`/pcbs/${id}`);
        // Update the specific PCB in the list with full details (components)
        setPCBs(pcbs.map(p => p.id === id ? res.data : p));
    };

    const toggleExpand = async (id) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            await fetchPCBDetails(id);
        }
    };

    const handleCreatePCB = async (e) => {
        e.preventDefault();
        try {
            await api.post('/pcbs', newPCB);
            setShowModal(false);
            setNewPCB({ name: '', description: '' });
            fetchPCBs();
        } catch (error) {
            alert('Failed to create PCB');
        }
    };

    const handleAddComponent = async (pcbId) => {
        try {
            await api.post(`/pcbs/${pcbId}/components`, addComponentData);
            fetchPCBDetails(pcbId);
            setAddComponentData({ component_id: '', quantity_per_pcb: 1 });
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to add component');
        }
    };

    const handleRemoveComponent = async (pcbId, componentId) => {
        if (window.confirm('Remove component from BOM?')) {
            try {
                await api.delete(`/pcbs/${pcbId}/components/${componentId}`);
                fetchPCBDetails(pcbId);
            } catch (error) {
                alert('Failed to remove component');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">PCB Types & BOM</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" /> Create PCB Type
                </button>
            </div>

            <div className="space-y-4">
                {pcbs.map((pcb) => (
                    <div key={pcb.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleExpand(pcb.id)}
                        >
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{pcb.name}</h3>
                                <p className="text-slate-500 text-sm">{pcb.description}</p>
                            </div>
                            {expandedId === pcb.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                        </div>

                        {expandedId === pcb.id && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                                <div className="mb-4">
                                    <h4 className="font-semibold text-sm uppercase text-slate-500 mb-2">Bill of Materials (BOM)</h4>
                                    <table className="w-full text-sm bg-white rounded-lg border border-slate-200 overflow-hidden">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Component</th>
                                                <th className="px-4 py-2 text-left">Qty per PCB</th>
                                                <th className="px-4 py-2 text-left">Current Stock</th>
                                                <th className="px-4 py-2 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pcb.components?.map(c => (
                                                <tr key={c.id} className="border-t border-slate-100">
                                                    <td className="px-4 py-2">{c.name}</td>
                                                    <td className="px-4 py-2 font-mono">{c.quantity_per_pcb}</td>
                                                    <td className="px-4 py-2 font-mono text-slate-500">{c.current_stock}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveComponent(pcb.id, c.id); }}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!pcb.components || pcb.components.length === 0) && (
                                                <tr><td colSpan="4" className="px-4 py-2 text-center text-slate-400 italic">No components in BOM</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex gap-2 items-end bg-white p-3 rounded-lg border border-slate-200 inline-flex">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Add Component</label>
                                        <select
                                            className="border p-2 rounded w-48 text-sm"
                                            value={addComponentData.component_id}
                                            onChange={(e) => setAddComponentData({ ...addComponentData, component_id: e.target.value })}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="">Select Component</option>
                                            {components.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.part_number})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Quantity</label>
                                        <input
                                            type="number" min="1"
                                            className="border p-2 rounded w-20 text-sm"
                                            value={addComponentData.quantity_per_pcb}
                                            onChange={(e) => setAddComponentData({ ...addComponentData, quantity_per_pcb: parseInt(e.target.value) })}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAddComponent(pcb.id); }}
                                        disabled={!addComponentData.component_id}
                                        className="bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Create PCB Type</h2>
                        <form onSubmit={handleCreatePCB} className="space-y-4">
                            <input
                                type="text" placeholder="PCB Name" required
                                className="w-full border p-2 rounded"
                                value={newPCB.name} onChange={e => setNewPCB({ ...newPCB, name: e.target.value })}
                            />
                            <textarea
                                placeholder="Description"
                                className="w-full border p-2 rounded"
                                value={newPCB.description} onChange={e => setNewPCB({ ...newPCB, description: e.target.value })}
                            />
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

export default PCBs;
