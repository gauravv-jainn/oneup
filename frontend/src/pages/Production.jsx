import { useState, useEffect } from 'react';
import api from '../services/api';
import { Factory, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const Production = () => {
    const [pcbs, setPCBs] = useState([]);
    const [selectedPCB, setSelectedPCB] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [bom, setBOM] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

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
        }
    };

    const fetchBOM = async (id) => {
        try {
            const res = await api.get(`/pcbs/${id}`);
            setBOM(res.data.components || []);
        } catch (error) {
            console.error(error);
        }
    };

    const checkStock = () => {
        return bom.every(comp => comp.current_stock >= (comp.quantity_per_pcb * quantity));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        setLoading(true);

        try {
            const res = await api.post('/production', {
                pcb_type_id: selectedPCB,
                quantity_produced: parseInt(quantity)
            });
            setSuccessMsg(`Production successful! Entry ID: ${res.data.productionId}`);
            // Refresh BOM stock
            fetchBOM(selectedPCB);
            setLoading(false);
        } catch (error) {
            setErrorMsg(error.response?.data?.error || 'Production failed');
            setLoading(false);
        }
    };

    const isStockSufficient = checkStock();

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                <Factory className="w-8 h-8 mr-3 text-blue-600" />
                Record Production
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select PCB Type</label>
                                <select
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedPCB}
                                    onChange={(e) => setSelectedPCB(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select PCB --</option>
                                    {pcbs.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Quantity to Produce</label>
                                <input
                                    type="number" min="1"
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!selectedPCB || quantity <= 0 || loading || !isStockSufficient}
                                className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${loading ? 'bg-slate-400 cursor-wait' :
                                        !isStockSufficient ? 'bg-red-500 hover:bg-red-600 cursor-not-allowed opacity-75' :
                                            'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
                                    }`}
                            >
                                {loading ? 'Processing...' : 'Record Production'}
                            </button>

                            {errorMsg && (
                                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
                                    <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {successMsg && (
                                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                    <span>{successMsg}</span>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-semibold text-slate-700 mb-4 flex items-center">
                            <Info className="w-5 h-5 mr-2 text-slate-400" />
                            Component Requirements Preview
                        </h3>

                        {!selectedPCB ? (
                            <p className="text-slate-400 italic text-center py-8">Select a PCB type to view requirements</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Component</th>
                                            <th className="px-3 py-2 text-right">Required</th>
                                            <th className="px-3 py-2 text-right">Available</th>
                                            <th className="px-3 py-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {bom.map(c => {
                                            const requiredTotal = c.quantity_per_pcb * quantity;
                                            const isEnough = c.current_stock >= requiredTotal;
                                            return (
                                                <tr key={c.id}>
                                                    <td className="px-3 py-2 font-medium">{c.name}</td>
                                                    <td className="px-3 py-2 text-right font-mono">{requiredTotal}</td>
                                                    <td className="px-3 py-2 text-right font-mono text-slate-600">{c.current_stock}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        {isEnough ? (
                                                            <span className="text-green-600">
                                                                <CheckCircle className="w-4 h-4 mx-auto" />
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-500" title="Insufficient Stock">
                                                                <AlertTriangle className="w-4 h-4 mx-auto" />
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {bom.length === 0 && (
                                            <tr><td colSpan="4" className="text-center py-4 text-slate-400">No components defined for this PCB</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Production;
