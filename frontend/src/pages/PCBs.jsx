import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2, Cpu, Layers, ArrowRight, Settings, Edit, MoreVertical, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';

const PCBs = () => {
    const [pcbs, setPCBs] = useState([]);
    const [components, setComponents] = useState([]);
    const [selectedPCB, setSelectedPCB] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingPCB, setEditingPCB] = useState(null);
    const [newPCB, setNewPCB] = useState({ name: '', description: '' });

    // Add Component State (for Right Panel)
    const [qtyInputs, setQtyInputs] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pcbRes, compRes] = await Promise.all([
                api.get('/pcbs'),
                api.get('/components')
            ]);
            setPCBs(pcbRes.data);
            setComponents(compRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load PCB data');
            setLoading(false);
        }
    };

    const handleSelectPCB = async (pcb) => {
        try {
            const res = await api.get(`/pcbs/${pcb.id}`);
            setSelectedPCB(res.data);
        } catch (error) {
            console.error("Error fetching PCB details", error);
            toast.error('Failed to load PCB details');
        }
    };

    const handleCreatePCB = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/pcbs', newPCB);
            setPCBs([...pcbs, res.data]);
            setShowModal(false);
            setNewPCB({ name: '', description: '' });
            setEditingPCB(null);
            handleSelectPCB(res.data);
            toast.success('PCB Type created successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create PCB');
        }
    };

    const handleUpdatePCB = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/pcbs/${editingPCB.id}`, newPCB);
            setPCBs(pcbs.map(p => p.id === editingPCB.id ? res.data : p));
            if (selectedPCB?.id === editingPCB.id) {
                setSelectedPCB({ ...selectedPCB, name: res.data.name, description: res.data.description });
            }
            setShowModal(false);
            setNewPCB({ name: '', description: '' });
            setEditingPCB(null);
            toast.success('PCB Type updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update PCB');
        }
    };

    const handleDeletePCB = async (pcbId) => {
        if (!window.confirm('Are you sure you want to delete this PCB type and its BOM? This cannot be undone.')) return;
        try {
            await api.delete(`/pcbs/${pcbId}`);
            setPCBs(pcbs.filter(p => p.id !== pcbId));
            if (selectedPCB?.id === pcbId) {
                setSelectedPCB(null);
            }
            toast.success('PCB Type deleted');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete PCB');
        }
    };

    const openEditPCB = (pcb, e) => {
        e.stopPropagation();
        setEditingPCB(pcb);
        setNewPCB({ name: pcb.name, description: pcb.description || '' });
        setShowModal(true);
    };

    const handleAddComponent = async (componentId) => {
        if (!selectedPCB) return;
        const qty = qtyInputs[componentId] || 1;
        try {
            await api.post(`/pcbs/${selectedPCB.id}/components`, {
                component_id: componentId,
                quantity_per_pcb: qty
            });
            const res = await api.get(`/pcbs/${selectedPCB.id}`);
            setSelectedPCB(res.data);
            setQtyInputs({ ...qtyInputs, [componentId]: 1 });
            toast.success('Component added to BOM');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add component');
        }
    };

    const handleRemoveComponent = async (componentId) => {
        if (!selectedPCB) return;
        try {
            await api.delete(`/pcbs/${selectedPCB.id}/components/${componentId}`);
            const res = await api.get(`/pcbs/${selectedPCB.id}`);
            setSelectedPCB(res.data);
            toast.info('Component removed from BOM');
        } catch (error) {
            toast.error('Failed to remove component');
        }
    };

    const filteredComponents = components.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.part_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loader fullScreen />;

    return (
        <div className="flex flex-col space-y-6 pb-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">BOM Mapping</h1>
                    <p className="text-secondary text-sm">Manage PCB designs and their components</p>
                </div>
                <Button onClick={() => { setShowModal(true); setEditingPCB(null); setNewPCB({ name: '', description: '' }); }}>
                    <Plus size={18} className="mr-2" /> Create PCB Type
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
                {/* Left Panel: PCB List */}
                <Card className="lg:col-span-3 flex flex-col p-0 overflow-hidden border-r border-default h-full bg-card/50">
                    <div className="p-4 border-b border-default bg-card">
                        <h3 className="font-semibold text-primary flex items-center gap-2">
                            <Layers size={18} className="text-blue-500" /> PCB Types
                        </h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {pcbs.map(pcb => (
                            <div
                                key={pcb.id}
                                onClick={() => handleSelectPCB(pcb)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedPCB?.id === pcb.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent hover:border-default'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-medium flex-1 ${selectedPCB?.id === pcb.id ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>
                                        {pcb.name}
                                    </h4>
                                    <div className="flex items-center gap-1 ml-2">
                                        <button
                                            onClick={(e) => openEditPCB(pcb, e)}
                                            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-500 transition-colors"
                                            title="Edit PCB"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeletePCB(pcb.id); }}
                                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Delete PCB"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-secondary mt-1 line-clamp-2">{pcb.description}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Center Panel: Workspace / BOM */}
                <Card className="lg:col-span-6 flex flex-col p-0 overflow-hidden border-x border-default h-full shadow-lg relative">
                    {selectedPCB ? (
                        <>
                            <div className="p-6 border-b border-default bg-card/80 backdrop-blur-sm z-10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Cpu className="text-white" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-primary">{selectedPCB.name}</h2>
                                            <p className="text-xs text-secondary font-mono">ID: {String(selectedPCB.id)}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-secondary mt-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-default inline-block">
                                        {selectedPCB.description || "No description provided."}
                                    </p>
                                </div>
                                <Button variant="ghost" className="text-secondary hover:text-primary" onClick={(e) => openEditPCB(selectedPCB, e)}>
                                    <Settings size={18} />
                                </Button>
                            </div>

                            {/* BOM Table */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-3">Bill of Materials</h3>
                                {selectedPCB.components && selectedPCB.components.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedPCB.components.map((comp, idx) => (
                                            <div key={comp.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-default group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-secondary">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-primary">{comp.name}</p>
                                                        <p className="text-xs text-secondary font-mono">{comp.part_number}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-xs text-secondary">Qty</p>
                                                        <p className="font-bold text-primary">{comp.quantity_per_pcb}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveComponent(comp.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-default rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                                        <Layers size={48} className="mb-4 opacity-50" />
                                        <p>No components in BOM yet.</p>
                                        <p className="text-sm">Select components from the right panel to add.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Cpu size={64} className="mb-6 opacity-20" />
                            <h3 className="text-lg font-medium text-secondary">Select a PCB Type</h3>
                            <p className="text-sm">Choose a PCB from the left list to edit/view BOM.</p>
                        </div>
                    )}
                </Card>

                {/* Right Panel: Available Components */}
                <Card className="lg:col-span-3 flex flex-col p-0 overflow-hidden border-l border-default h-full bg-card/50">
                    <div className="p-4 border-b border-default bg-card">
                        <h3 className="font-semibold text-primary mb-3">Add Components</h3>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                placeholder="Search inventory..."
                                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-default bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {filteredComponents.map(comp => (
                            <div
                                key={comp.id}
                                className="theme-card p-3"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-medium text-sm text-primary truncate" title={comp.name}>{comp.name}</p>
                                    <Badge variant={comp.current_stock > 0 ? "green" : "red"} className="text-[10px] px-1.5 py-0.5">
                                        Stock: {comp.current_stock}
                                    </Badge>
                                </div>
                                <p className="text-xs text-secondary font-mono mb-3">{comp.part_number}</p>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-14 px-2 py-1 text-xs border border-default rounded bg-transparent text-center"
                                        placeholder="Qty"
                                        value={qtyInputs[comp.id] || 1}
                                        onChange={(e) => setQtyInputs({ ...qtyInputs, [comp.id]: parseInt(e.target.value) })}
                                    />
                                    <Button
                                        size="sm"
                                        className="flex-1 py-1 text-xs h-auto"
                                        onClick={() => handleAddComponent(comp.id)}
                                        disabled={!selectedPCB}
                                    >
                                        Add to BOM
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingPCB(null); }}
                title={editingPCB ? 'Edit PCB Type' : 'Create New PCB Type'}
            >
                <form onSubmit={editingPCB ? handleUpdatePCB : handleCreatePCB} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">PCB Name</label>
                        <input
                            type="text" required
                            className="input w-full"
                            placeholder="e.g. Main Control Board V2"
                            value={newPCB.name} onChange={e => setNewPCB({ ...newPCB, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Description</label>
                        <textarea
                            className="input w-full min-h-[100px]"
                            placeholder="Describe the function of this PCB..."
                            value={newPCB.description} onChange={e => setNewPCB({ ...newPCB, description: e.target.value })}
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => { setShowModal(false); setEditingPCB(null); }}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingPCB ? 'Save Changes' : 'Create PCB'}
                        </Button>
                    </div>
                </form>
            </Modal>
            {/* BOM Bulk Upload Section */}
            <Card className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-primary">Bulk BOM Import</h2>
                        <p className="text-sm text-secondary">Upload Excel file to create PCBs and map components</p>
                    </div>
                </div>
                <BOMUpload />
            </Card>
        </div>
    );
};

const BOMUpload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/excel/import/bom', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('BOM import successful');
            setFile(null);
            // Ideally trigger refresh of PCBs list if parent passed a callback
            window.location.reload();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 border-2 border-dashed border-default rounded-xl flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
            <input
                type="file"
                accept=".xlsx,.xls,.xlsm,.csv"
                onChange={e => setFile(e.target.files[0])}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
            />
            <p className="text-xs text-secondary">Supports .xlsx, .xls, .xlsm, .csv. Columns: PCB Name, Component Name, Quantity, [Optional: Est Days]</p>
            <Button onClick={handleUpload} disabled={!file || uploading} className="w-full sm:w-auto">
                {uploading ? 'Importing...' : 'Upload BOM'}
            </Button>
        </div>
    );


};

export default PCBs;
