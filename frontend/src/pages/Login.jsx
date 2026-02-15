import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import AnimatedNetworkBackground from '../components/common/AnimatedNetworkBackground';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Clear theme enforcement to allow custom page styling
    useEffect(() => {
        // Optional: Any specific cleanup if needed
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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
            {/* Dark Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-0"></div>

            {/* Animated Canvas Background */}
            <AnimatedNetworkBackground />

            <div className="w-full max-w-[420px] rounded-2xl p-10 relative z-10 animate-fade-up bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/20 transform rotate-3 hover:rotate-6 transition-transform">
                        <Zap size={32} className="text-white" fill="currentColor" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-50 mb-2">OneUp Solutions</h1>
                    <p className="text-slate-300 text-sm">Secure Manufacturing Portal</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200 ml-1">Username / Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-slate-400 group-focus-within:text-sky-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-white/10 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
                                placeholder="Enter your username or email"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-slate-400 group-focus-within:text-sky-400 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-11 py-2.5 bg-slate-900/40 border border-white/10 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-slate-300 cursor-pointer hover:text-slate-100 transition-colors">
                            <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-slate-800 text-sky-600 focus:ring-sky-500 mr-2 accent-sky-600" />
                            Remember me
                        </label>
                        <a href="#" className="text-sky-400 hover:text-sky-300 font-medium hover:underline">
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-base flex justify-center items-center gap-2 group overflow-hidden relative shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98]"
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
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                        <Lock size={12} />
                        Protected by JWT Authentication • AES-256 Encrypted
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
