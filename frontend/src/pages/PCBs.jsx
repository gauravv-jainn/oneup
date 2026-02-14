import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2, Cpu, Layers, ArrowRight, Settings } from 'lucide-react';
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
        // Optimistic UI update or loading state could go here
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
            handleSelectPCB(res.data); // Select the new PCB
            toast.success('PCB Type created successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create PCB');
        }
    };

    const handleAddComponent = async (componentId) => {
        if (!selectedPCB) return;
        const qty = qtyInputs[componentId] || 1;
        try {
            await api.post(`/pcbs/${selectedPCB.id}/components`, {
                component_id: componentId,
                quantity_per_pcb: qty
            });
            // Refresh detailed view
            const res = await api.get(`/pcbs/${selectedPCB.id}`);
            setSelectedPCB(res.data);
            // Reset qty input
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
            // Refresh detailed view
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
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">BOM Mapping</h1>
                    <p className="text-secondary text-sm">Manage PCB designs and their components</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus size={18} className="mr-2" /> Create PCB Type
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
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
                                    <h4 className={`font-medium ${selectedPCB?.id === pcb.id ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>
                                        {pcb.name}
                                    </h4>
                                    {selectedPCB?.id === pcb.id && <ArrowRight size={16} className="text-blue-500" />}
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
                                            <p className="text-xs text-secondary font-mono">ID: {selectedPCB.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-secondary mt-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-default inline-block">
                                        {selectedPCB.description || "No description provided."}
                                    </p>
                                </div>
                                <Button variant="ghost" className="text-secondary hover:text-primary">
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
                            <div key={comp.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-default shadow-sm hover:shadow-md transition-shadow">
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

            {/* Create Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Create New PCB Type"
            >
                <form onSubmit={handleCreatePCB} className="space-y-4">
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
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create PCB
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PCBs;
