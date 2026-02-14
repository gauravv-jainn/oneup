import { useState, useEffect } from 'react';
import api from '../services/api';
import { Factory, AlertTriangle, CheckCircle, Info, Package, Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loader from '../components/common/Loader';

const Production = () => {
    const [pcbs, setPCBs] = useState([]);
    const [selectedPCB, setSelectedPCB] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [bom, setBOM] = useState([]);
    const [loading, setLoading] = useState(false);

    // Derived state for detailed PCB info
    const selectedPCBDetails = pcbs.find(p => p.id === selectedPCB);

    useEffect(() => {
        fetchPCBs();
    }, []);

    useEffect(() => {
        if (selectedPCB) {
            fetchBOM(selectedPCB);
        } else {
            setBOM([]);
        }
    }, [selectedPCB]);

    const fetchPCBs = async () => {
        try {
            const res = await api.get('/pcbs');
            setPCBs(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load PCB types");
        }
    };

    const fetchBOM = async (id) => {
        try {
            const res = await api.get(`/pcbs/${id}`);
            setBOM(res.data.components || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load BOM for selected PCB");
        }
    };

    const checkStock = () => {
        if (!bom.length) return false;
        return bom.every(comp => comp.current_stock >= (comp.quantity_per_pcb * quantity));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/production', {
                pcb_type_id: selectedPCB,
                quantity_produced: parseInt(quantity)
            });
            toast.success(`Production successful! Run ID: ${res.data.productionId || 'New'}`);
            // Refresh BOM stock
            fetchBOM(selectedPCB);
            setLoading(false);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Production failed');
            setLoading(false);
        }
    };

    const isStockSufficient = checkStock();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Production Run</h1>
                    <p className="text-secondary mt-1">Initiate and track manufacturing batches</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Configuration Form */}
                <div className="lg:col-span-5 space-y-6">
                    <Card>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                                <Factory size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-primary">Run Configuration</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary">Select PCB Type</label>
                                <select
                                    className="input w-full"
                                    value={selectedPCB}
                                    onChange={(e) => setSelectedPCB(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose PCB to Produce --</option>
                                    {pcbs.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {selectedPCBDetails && (
                                    <p className="text-xs text-secondary bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-default">
                                        {selectedPCBDetails.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary">Quantity to Produce</label>
                                <div className="relative">
                                    <input
                                        type="number" min="1"
                                        className="input w-full pr-12"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-secondary font-medium">
                                        Units
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={!selectedPCB || quantity <= 0 || loading || !isStockSufficient}
                                    className="w-full justify-center py-3 text-lg"
                                    variant={!isStockSufficient ? 'outline' : 'primary'} // Visual cue
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader size="sm" className="mr-0" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Zap size={20} className="mr-2" />
                                            {isStockSufficient ? 'Start Production' : 'Insufficient Stock'}
                                        </>
                                    )}
                                </Button>
                                {!isStockSufficient && selectedPCB && (
                                    <p className="text-center text-red-500 text-sm mt-3 font-medium">
                                        Cannot proceed: Missing required components.
                                    </p>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Right Column: Availability Check */}
                <div className="lg:col-span-7">
                    <Card className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-primary">Material Validation</h2>
                                    <p className="text-xs text-secondary">Real-time stock reservation check</p>
                                </div>
                            </div>
                            {selectedPCB && bom.length > 0 && (
                                <Badge variant={isStockSufficient ? "green" : "red"}>
                                    {isStockSufficient ? "Ready for Production" : "Stock Shortage"}
                                </Badge>
                            )}
                        </div>

                        {!selectedPCB ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-secondary min-h-[300px] border-2 border-dashed border-default rounded-xl bg-slate-50/50 dark:bg-slate-800/20 m-4">
                                <Info size={48} className="mb-4 opacity-30" />
                                <p className="font-medium">Waiting for Selection</p>
                                <p className="text-sm">Select a PCB type to validate component availability</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-secondary sticky top-0 backdrop-blur-md">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Component</th>
                                            <th className="px-4 py-3 text-right">Required</th>
                                            <th className="px-4 py-3 text-right">Available</th>
                                            <th className="px-4 py-3 text-center rounded-tr-lg">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-default">
                                        {bom.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-8 text-secondary italic">No components defined in BOM for this PCB.</td></tr>
                                        ) : (
                                            bom.map(c => {
                                                const requiredTotal = c.quantity_per_pcb * quantity;
                                                const isEnough = c.current_stock >= requiredTotal;
                                                return (
                                                    <tr key={c.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-primary">{c.name}</div>
                                                            <div className="text-xs text-secondary font-mono">{c.part_number}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-primary font-bold">
                                                            {requiredTotal.toLocaleString()}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-mono font-medium ${isEnough ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                            {c.current_stock.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {isEnough ? (
                                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                                    <CheckCircle size={16} />
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500">
                                                                    <AlertTriangle size={16} />
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Production;
