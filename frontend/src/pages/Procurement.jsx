import { useState, useEffect } from 'react';
import api from '../services/api';

const Procurement = () => {
    const [triggers, setTriggers] = useState([]);

    useEffect(() => {
        fetchTriggers();
    }, []);

    const fetchTriggers = async () => {
        try {
            const res = await api.get('/procurement/triggers');
            setTriggers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/procurement/triggers/${id}`, { status });
            fetchTriggers();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'ordered': return 'bg-blue-100 text-blue-800';
            case 'received': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Procurement Triggers</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 text-sm font-semibold uppercase">
                        <tr>
                            <th className="px-6 py-4">Component</th>
                            <th className="px-6 py-4">Part Number</th>
                            <th className="px-6 py-4">Trigger Date</th>
                            <th className="px-6 py-4">Stock at Trigger</th>
                            <th className="px-6 py-4">Threshold</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {triggers.map((trigger) => (
                            <tr key={trigger.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium">{trigger.component_name}</td>
                                <td className="px-6 py-4 text-slate-500">{trigger.part_number}</td>
                                <td className="px-6 py-4 text-slate-500">{new Date(trigger.trigger_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-mono text-red-600">{trigger.current_stock}</td>
                                <td className="px-6 py-4 font-mono text-slate-500">{trigger.required_threshold}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(trigger.status)}`}>
                                        {trigger.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {trigger.status === 'pending' && (
                                        <button
                                            onClick={() => updateStatus(trigger.id, 'ordered')}
                                            className="text-blue-600 hover:underline text-sm font-medium"
                                        >
                                            Mark Ordered
                                        </button>
                                    )}
                                    {trigger.status === 'ordered' && (
                                        <button
                                            onClick={() => updateStatus(trigger.id, 'received')}
                                            className="text-green-600 hover:underline text-sm font-medium"
                                        >
                                            Mark Received
                                        </button>
                                    )}
                                    {trigger.status === 'received' && (
                                        <span className="text-slate-400 text-sm">Completed</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {triggers.length === 0 && (
                            <tr><td colSpan="7" className="text-center py-8 text-slate-400">No active procurement triggers</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Procurement;
