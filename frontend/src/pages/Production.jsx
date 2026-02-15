import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Factory, AlertTriangle, CheckCircle, Info, Package, Zap, Upload, FileSpreadsheet, FileUp } from 'lucide-react';
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

    // Bulk upload state
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const bulkFileRef = useRef(null);
    const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

    // Derived state for detailed PCB info
    const selectedPCBDetails = pcbs.find(p => String(p.id) === selectedPCB);

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
            // Refresh BOM stock and history
            fetchBOM(selectedPCB);
            setHistoryRefreshKey(k => k + 1);
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
                                        className="input w-full pl-14 pr-4"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        required
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary font-medium">
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
                                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs uppercase font-semibold text-secondary sticky top-0 backdrop-blur-md z-10">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg font-bold text-slate-500 dark:text-slate-400">Component</th>
                                            <th className="px-4 py-3 text-right font-bold text-slate-500 dark:text-slate-400">Required</th>
                                            <th className="px-4 py-3 text-right font-bold text-slate-500 dark:text-slate-400">Available</th>
                                            <th className="px-4 py-3 text-center rounded-tr-lg font-bold text-slate-500 dark:text-slate-400">Status</th>
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
                                                        <td className={`px-4 py-3 text-right font-mono font-bold text-lg ${isEnough ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {c.current_stock.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {isEnough ? (
                                                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                                                                    <CheckCircle size={22} strokeWidth={2.5} />
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                                                                    <AlertTriangle size={20} strokeWidth={2.5} />
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

            {/* Bulk Upload Section */}
            <Card className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-primary">Bulk Production Upload</h2>
                        <p className="text-sm text-secondary">Upload a CSV/Excel file with columns: PCB Name, Quantity</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${bulkFile ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10' : 'border-default hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        onClick={() => bulkFileRef.current?.click()}
                    >
                        <input
                            ref={bulkFileRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files[0];
                                if (f) {
                                    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
                                    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
                                        setBulkFile(f);
                                        setBulkResult(null);
                                    } else {
                                        toast.error('Invalid file. Use .xlsx, .xls, or .csv');
                                    }
                                }
                            }}
                        />

                        {bulkFile ? (
                            <div className="text-center">
                                <FileSpreadsheet size={40} className="mx-auto text-green-500 mb-2" />
                                <p className="font-bold text-primary">{bulkFile.name}</p>
                                <p className="text-xs text-secondary">{(bulkFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div className="text-center text-secondary">
                                <FileUp size={40} className="mx-auto mb-2 opacity-30" />
                                <p className="font-medium">Click to upload</p>
                                <p className="text-xs mt-1">CSV or Excel file</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-lg text-sm">
                            <p className="font-semibold text-purple-800 dark:text-purple-300 mb-2">File Format:</p>
                            <table className="w-full text-xs text-purple-700 dark:text-purple-400">
                                <thead><tr><th className="text-left pb-1">PCB Name</th><th className="text-left pb-1">Quantity</th></tr></thead>
                                <tbody>
                                    <tr><td>Arduino Mega</td><td>50</td></tr>
                                    <tr><td>Raspberry Pi HAT</td><td>25</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={!bulkFile || bulkUploading}
                            onClick={async () => {
                                if (!bulkFile) return;
                                setBulkUploading(true);
                                const formData = new FormData();
                                formData.append('file', bulkFile);
                                try {
                                    const res = await api.post('/excel/import/production', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                    setBulkResult(res.data);
                                    toast.success(`Processed ${res.data.successCount} production runs`);
                                    fetchPCBs();
                                    setHistoryRefreshKey(k => k + 1);
                                } catch (error) {
                                    setBulkResult({ errors: [error.response?.data?.error || 'Upload failed'] });
                                    toast.error('Bulk upload failed');
                                } finally {
                                    setBulkUploading(false);
                                }
                            }}
                        >
                            {bulkUploading ? 'Processing...' : 'Start Bulk Production'}
                        </Button>

                        {bulkResult && (
                            <div className={`p-3 rounded-lg text-sm ${bulkResult.successCount > 0 ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'}`}>
                                {bulkResult.successCount !== undefined && (
                                    <p className="text-green-700 dark:text-green-400 font-bold">
                                        <CheckCircle size={14} className="inline mr-1" />
                                        {bulkResult.successCount} of {bulkResult.totalProcessed} runs completed
                                    </p>
                                )}
                                {bulkResult.errors?.length > 0 && (
                                    <ul className="mt-2 text-xs text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                                        {bulkResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
            {/* Production History Section */}
            <Card className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-primary">Production History</h2>
                        <p className="text-sm text-secondary">Recent manufacturing runs</p>
                    </div>
                </div>
                <ProductionHistoryTable refreshKey={historyRefreshKey} />
            </Card>
        </div>
    );
};

// Sub-component for history (defined in same file for simplicity)
const ProductionHistoryTable = ({ refreshKey }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await api.get('/production/history');
                setHistory(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [refreshKey]);

    if (loading) return <div className="text-center py-4 text-xs text-secondary">Loading history...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-secondary border-b border-default">
                    <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">PCB Name</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right">Components Used</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-default">
                    {history.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-4 text-sm text-secondary">No history found.</td></tr>
                    ) : (
                        history.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                <td className="px-4 py-3 text-sm text-secondary">{new Date(row.produced_at).toLocaleString()}</td>
                                <td className="px-4 py-3 font-medium text-primary">{row.pcb_name}</td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-primary">{row.quantity_produced}</td>
                                <td className="px-4 py-3 text-right font-mono text-secondary">{row.components_consumed}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );


};

export default Production;
