import { useState } from 'react';
import api from '../services/api';
import { FileSpreadsheet, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const ImportExport = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setResult(null);

        try {
            const res = await api.post('/excel/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult({ success: true, data: res.data });
        } catch (error) {
            setResult({ success: false, error: error.response?.data?.error || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (type) => {
        try {
            const res = await api.get(`/excel/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_report.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
            alert('Download failed');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Data Management</h1>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
                    <Upload className="w-6 h-6 mr-2 text-blue-600" />
                    Import Components
                </h2>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
                    <p className="text-sm text-blue-800 mb-2 font-semibold">Instructions:</p>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                        <li>Upload an Excel file (.xlsx)</li>
                        <li>Required Columns: <strong>Component Name, Part Number, Current Stock, Monthly Required Quantity</strong></li>
                        <li>Existing components with same Part Number will be updated.</li>
                    </ul>
                </div>

                <form onSubmit={handleUpload} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Excel File</label>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>

                {result && result.success && (
                    <div className="mt-6 bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center text-green-800 font-semibold mb-2">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Import Successful
                        </div>
                        <p className="text-sm text-green-700">Processed: {result.data.totalProcessed}</p>
                        <p className="text-sm text-green-700">Success: {result.data.successCount}</p>
                        {result.data.errors.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm font-semibold text-red-600">Errors:</p>
                                <ul className="list-disc list-inside text-xs text-red-500 max-h-32 overflow-y-auto">
                                    {result.data.errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                {result && !result.success && (
                    <div className="mt-6 bg-red-50 p-4 rounded-lg flex items-center text-red-700">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {result.error}
                    </div>
                )}
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
                    <Download className="w-6 h-6 mr-2 text-green-600" />
                    Export Data
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-slate-800 mb-2">Inventory Report</h3>
                        <p className="text-sm text-slate-500 mb-4">Download full list of components with current stock levels.</p>
                        <button
                            onClick={() => handleDownload('inventory')}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Download Inventory .xlsx
                        </button>
                    </div>

                    <div className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-slate-800 mb-2">Consumption Report</h3>
                        <p className="text-sm text-slate-500 mb-4">Download component consumption history and last used dates.</p>
                        <button
                            onClick={() => handleDownload('consumption')}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Download Consumption .xlsx
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportExport;
