import { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { Users, Shield, Settings, Activity, Search, Trash2, Save, UserPlus, Clock, RotateCcw, Bell, Database, Gauge } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';

// Default settings
const DEFAULT_SETTINGS = {
    systemName: 'OneUp Solutions',
    lowStockThreshold: 50,
    refreshInterval: 30,
    emailNotifications: false,
    defaultExportFormat: 'xlsx',
    autoRefresh: true,
};

const SettingsTab = () => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('pcb-system-settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });
    const [hasChanges, setHasChanges] = useState(false);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        localStorage.setItem('pcb-system-settings', JSON.stringify(settings));
        setHasChanges(false);
        toast.success('Settings saved successfully');
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem('pcb-system-settings');
        setHasChanges(false);
        toast.info('Settings reset to defaults');
    };

    return (
        <Card className="animate-fade-in max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Settings size={20} className="text-blue-500" />
                    <h2 className="text-lg font-bold text-primary">System Settings</h2>
                </div>
                {hasChanges && <Badge variant="orange">Unsaved Changes</Badge>}
            </div>

            <div className="space-y-6">
                {/* System Name */}
                <div className="flex items-center justify-between pb-4 border-b border-default">
                    <div>
                        <h3 className="font-medium text-primary">System Name</h3>
                        <p className="text-sm text-secondary">Displayed in the sidebar and header.</p>
                    </div>
                    <div className="w-64">
                        <input type="text" className="input w-full" value={settings.systemName} onChange={(e) => updateSetting('systemName', e.target.value)} />
                    </div>
                </div>

                {/* Low Stock Threshold */}
                <div className="flex items-center justify-between pb-4 border-b border-default">
                    <div>
                        <h3 className="font-medium text-primary flex items-center gap-2"><Gauge size={16} className="text-orange-500" /> Low Stock Threshold</h3>
                        <p className="text-sm text-secondary">Components below this level trigger procurement alerts.</p>
                    </div>
                    <div className="w-32">
                        <input type="number" min="1" className="input w-full text-right" value={settings.lowStockThreshold} onChange={(e) => updateSetting('lowStockThreshold', parseInt(e.target.value) || 0)} />
                    </div>
                </div>

                {/* Data Refresh Interval */}
                <div className="flex items-center justify-between pb-4 border-b border-default">
                    <div>
                        <h3 className="font-medium text-primary flex items-center gap-2"><Clock size={16} className="text-blue-500" /> Data Refresh Interval</h3>
                        <p className="text-sm text-secondary">How often dashboards auto-refresh (in seconds).</p>
                    </div>
                    <div className="w-32">
                        <input type="number" min="5" max="300" className="input w-full text-right" value={settings.refreshInterval} onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value) || 30)} />
                    </div>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between pb-4 border-b border-default">
                    <div>
                        <h3 className="font-medium text-primary flex items-center gap-2"><Bell size={16} className="text-purple-500" /> Email Notifications</h3>
                        <p className="text-sm text-secondary">Receive alerts for low stock and order updates.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.emailNotifications} onChange={(e) => updateSetting('emailNotifications', e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Default Export Format */}
                <div className="flex items-center justify-between pb-4 border-b border-default">
                    <div>
                        <h3 className="font-medium text-primary flex items-center gap-2"><Database size={16} className="text-green-500" /> Default Export Format</h3>
                        <p className="text-sm text-secondary">Preferred file format for data exports.</p>
                    </div>
                    <div className="w-40">
                        <select className="input w-full" value={settings.defaultExportFormat} onChange={(e) => updateSetting('defaultExportFormat', e.target.value)}>
                            <option value="xlsx">Excel (.xlsx)</option>
                            <option value="csv">CSV (.csv)</option>
                        </select>
                    </div>
                </div>

                {/* Auto Refresh */}
                <div className="flex items-center justify-between pb-4 border-b border-default">
                    <div>
                        <h3 className="font-medium text-primary">Auto-Refresh Dashboard</h3>
                        <p className="text-sm text-secondary">Automatically refresh data at the set interval.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.autoRefresh} onChange={(e) => updateSetting('autoRefresh', e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={handleReset} className="text-red-500 hover:bg-red-50">
                        <RotateCcw size={16} className="mr-2" /> Reset to Defaults
                    </Button>
                    <Button onClick={handleSave} disabled={!hasChanges}>
                        <Save size={16} className="mr-2" /> Save Changes
                    </Button>
                </div>
            </div>
        </Card>
    );
};

const Admin = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(false);

    // Data State
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);

    // Modal State
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'viewer' });

    // Fetch Data on Tab Change
    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'audit') fetchLogs();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/audit-logs');
            setLogs(res.data);
        } catch (error) {
            toast.error("Failed to fetch audit logs");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', newUser);
            toast.success("User created successfully");
            setShowUserModal(false);
            setNewUser({ username: '', password: '', role: 'viewer' });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to create user");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            toast.success("User deleted");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const tabs = [
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'audit', label: 'Audit Logs', icon: Activity },
        { id: 'settings', label: 'System Settings', icon: Settings },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary">System Administration</h1>
                    <p className="text-secondary mt-1">Manage users, security, and system configurations</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }
                        `}
                    >
                        <tab.icon size={16} className="mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {loading ? <Loader /> : (
                    <>
                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <Card className="animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-primary flex items-center">
                                        <Users size={20} className="mr-2 text-blue-500" />
                                        Users List
                                    </h2>
                                    <Button size="sm" onClick={() => setShowUserModal(true)}>
                                        <UserPlus size={16} className="mr-2" /> Add User
                                    </Button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="text-xs uppercase font-semibold text-secondary bg-slate-50 dark:bg-slate-800/50">
                                            <tr>
                                                <th className="px-6 py-3 rounded-tl-lg">User</th>
                                                <th className="px-6 py-3">Role</th>
                                                <th className="px-6 py-3">Created At</th>
                                                <th className="px-6 py-3 text-right rounded-tr-lg">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-default">
                                            {users.map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs mr-3">
                                                                {user.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="font-medium text-primary">{user.username}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={user.role === 'admin' ? 'purple' : 'blue'}>
                                                            <Shield size={10} className="mr-1" /> {user.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-secondary">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600 transition"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {/* Audit Logs Tab */}
                        {activeTab === 'audit' && (
                            <Card className="animate-fade-in">
                                <div className="flex items-center gap-2 mb-6">
                                    <Activity size={20} className="text-purple-500" />
                                    <h2 className="text-lg font-bold text-primary">System Audit Logs</h2>
                                </div>

                                <div className="space-y-4">
                                    {logs.length === 0 ? (
                                        <p className="text-center text-secondary py-8">No audit logs found.</p>
                                    ) : (
                                        logs.map((log) => (
                                            <div key={log.id} className="flex items-start p-4 border border-default rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <div className="p-2 rounded-lg mr-4 flex-shrink-0 bg-blue-100 text-blue-600">
                                                    <Activity size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-primary text-sm">{log.action}</h4>
                                                        <span className="text-xs text-secondary font-mono flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-secondary mt-1">{log.details || 'No details'}</p>
                                                    <div className="mt-2 text-xs font-medium text-slate-500 flex items-center">
                                                        <Users size={12} className="mr-1" />
                                                        {log.username || 'System/Deleted User'}
                                                        {log.ip_address && <span className="ml-2 text-xs text-slate-400">({log.ip_address})</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Settings Tab (Local Storage Backed) */}
                        {activeTab === 'settings' && (
                            <SettingsTab />
                        )}
                    </>
                )}
            </div>

            {/* Create User Modal */}
            <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="Create New User">
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Username</label>
                        <input
                            type="text" required
                            className="input w-full"
                            value={newUser.username}
                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Password</label>
                        <input
                            type="password" required
                            className="input w-full"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Role</label>
                        <select
                            className="input w-full"
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="viewer">Viewer</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowUserModal(false)}>Cancel</Button>
                        <Button type="submit">Create User</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Admin;
