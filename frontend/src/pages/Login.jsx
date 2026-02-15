import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Always force light theme on login page
    useEffect(() => {
        const savedTheme = localStorage.getItem('pcb-theme');
        document.documentElement.setAttribute('data-theme', 'light'); // Force Light
        return () => {
            // Restore user's preference when leaving login
            if (savedTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulated delay for effect
        setTimeout(async () => {
            const result = await login(username, password);
            if (result.success) {
                toast.success(`Welcome back, ${username}!`);
                navigate('/');
            } else {
                toast.error(result.message || 'Invalid credentials');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="login-container min-h-screen flex items-center justify-center p-4">
            {/* Background Pattern (CSS handled) */}

            {/* Animated Circuit Lines SVG */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <svg className="w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="1" fill="#cbd5e1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Animated Traces */}
                    <path className="circuit-trace-1" d="M0 100 Q 250 50 500 100 T 1000 100" fill="none" stroke="#3b82f6" strokeWidth="2" />
                    <path className="circuit-trace-2" d="M1000 300 Q 750 350 500 300 T 0 300" fill="none" stroke="#10b981" strokeWidth="2" />
                    <path className="circuit-trace-3" d="M0 600 Q 400 550 800 600 T 1600 600" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                    <path className="circuit-trace-4" d="M1200 800 Q 800 850 400 800 T 0 800" fill="none" stroke="#f59e0b" strokeWidth="2" />
                </svg>
            </div>

            <div className="login-card w-full max-w-[420px] rounded-2xl p-10 relative z-10 animate-fade-up">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg glow-blue transform rotate-3 hover:rotate-6 transition-transform">
                        <Zap size={32} className="text-white" fill="currentColor" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">OneUp Solutions</h1>
                    <p className="text-secondary text-sm">Secure Manufacturing Portal</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary ml-1">Username / Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-muted group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input pl-10"
                                placeholder="admin"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-muted group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input pl-10 pr-11"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-primary transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-secondary cursor-pointer hover:text-primary transition-colors">
                            <input type="checkbox" className="w-4 h-4 rounded border-default text-blue-600 focus:ring-blue-500 mr-2 accent-blue-600" />
                            Remember me
                        </label>
                        <a href="#" className="text-blue-500 hover:text-blue-600 font-medium hover:underline">
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn btn-primary py-3 text-base flex justify-center items-center gap-2 group overflow-hidden relative shadow-lg shadow-blue-500/20"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <span className="relative z-10">Sign In to Platform</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-muted flex items-center justify-center gap-2">
                        <Lock size={12} />
                        Protected by JWT Authentication • AES-256 Encrypted
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
