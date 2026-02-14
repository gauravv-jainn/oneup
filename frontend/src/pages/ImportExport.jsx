import { useState, useRef } from 'react';
import api from '../services/api';
import { FileSpreadsheet, Download, Upload, CheckCircle, AlertCircle, FileUp, FileDown, Database } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const ImportExport = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
                setFile(droppedFile);
                setResult(null);
            } else {
                setResult({ success: false, error: 'Invalid file type. Please upload an Excel file.' });
                toast.error('Invalid file type. Please upload an Excel file.');
            }
        }
    };

    const handleUpload = async () => {
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
            toast.success("File imported successfully!");
        } catch (error) {
            setResult({ success: false, error: error.response?.data?.error || 'Upload failed' });
            toast.error(error.response?.data?.error || 'Upload failed');
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
            toast.success(`${type} report downloaded`);
        } catch (error) {
            console.error('Download failed', error);
            toast.error('Download failed');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 text-white">
                    <Database size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-primary">Data Management</h1>
                    <p className="text-secondary mt-1">Bulk import components and export reports</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Import Section */}
                <Card className="h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                            <Upload size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-primary">Import Components</h2>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 mb-6 text-sm">
                        <p className="text-blue-800 dark:text-blue-300 font-semibold mb-2">Instructions:</p>
                        <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1">
                            <li>Upload an Excel file (.xlsx)</li>
                            <li>Required Columns: <strong>Component Name, Part Number, Current Stock, Monthly Required Quantity</strong></li>
                        </ul>
                    </div>

                    <div
                        className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-default hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {file ? (
                            <div className="text-center">
                                <FileSpreadsheet size={48} className="mx-auto text-green-500 mb-3" />
                                <p className="font-bold text-primary">{file.name}</p>
                                <p className="text-sm text-secondary">{(file.size / 1024).toFixed(2)} KB</p>
                                <Button
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white mx-auto"
                                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Processing...' : 'Start Import'}
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-secondary">
                                <FileUp size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium text-lg">Drag & Drop Excel File</p>
                                <p className="text-sm mt-1">or click to browse</p>
                            </div>
                        )}
                    </div>

                    {/* Result Messages */}
                    {result && (
                        <div className={`mt-6 p-4 rounded-lg animate-fade-in ${result.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900'}`}>
                            {result.success ? (
                                <div>
                                    <div className="flex items-center text-green-700 dark:text-green-400 font-bold mb-2">
                                        <CheckCircle size={20} className="mr-2" />
                                        Import Successful
                                    </div>
                                    <div className="space-y-1 text-sm text-green-600 dark:text-green-300">
                                        <p>Processed: {result.data.totalProcessed}</p>
                                        <p>Updated/Added: {result.data.successCount}</p>
                                    </div>
                                    {result.data.errors?.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                                            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Warnings:</p>
                                            <ul className="list-disc list-inside text-xs text-red-500 max-h-32 overflow-y-auto">
                                                {result.data.errors.map((err, i) => <li key={i}>{err}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-start text-red-700 dark:text-red-400">
                                    <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{result.error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Export Section */}
                <Card className="h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                            <Download size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-primary">Export Data</h2>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="group border border-default rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer" onClick={() => handleDownload('inventory')}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <FileSpreadsheet size={20} />
                                    </div>
                                    <h3 className="font-bold text-primary group-hover:text-blue-600 transition-colors">Inventory Report</h3>
                                </div>
                                <FileDown size={18} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-sm text-secondary ml-11">
                                Complete list of all components including current stock levels, values, and location data.
                            </p>
                        </div>

                        <div className="group border border-default rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer" onClick={() => handleDownload('consumption')}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <FileSpreadsheet size={20} />
                                    </div>
                                    <h3 className="font-bold text-primary group-hover:text-blue-600 transition-colors">Consumption Report</h3>
                                </div>
                                <FileDown size={18} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-sm text-secondary ml-11">
                                Historical consumption data analysis including daily usage rates and trend metrics.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-secondary text-center">
                        Exports are generated in .xlsx format compatible with Microsoft Excel and Google Sheets.
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ImportExport;
