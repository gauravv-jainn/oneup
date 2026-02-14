import { useState } from 'react';
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
            {/* Animated Background SVG */}
            <svg className="circuit-overlay w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path className="circuit-path" d="M10,10 L30,10 L30,30 L50,30" style={{ animationDelay: '0s' }} />
                <path className="circuit-path" d="M90,90 L70,90 L70,70 L50,70" style={{ animationDelay: '0.5s' }} />
                <path className="circuit-path" d="M10,90 L10,70 L30,70 L30,50" style={{ animationDelay: '1s' }} />
                <path className="circuit-path" d="M90,10 L90,30 L70,30 L70,50" style={{ animationDelay: '1.5s' }} />

                <circle cx="50" cy="30" r="0.5" className="circuit-node" style={{ animationDelay: '0s' }} />
                <circle cx="50" cy="70" r="0.5" className="circuit-node" style={{ animationDelay: '1s' }} />
                <circle cx="30" cy="50" r="0.5" className="circuit-node" style={{ animationDelay: '0.5s' }} />
                <circle cx="70" cy="50" r="0.5" className="circuit-node" style={{ animationDelay: '1.5s' }} />
            </svg>

            <div className="login-card w-full max-w-[420px] rounded-2xl p-10 relative z-10 animate-fade-up">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg glow-blue transform rotate-3 hover:rotate-6 transition-transform">
                        <Zap size={32} className="text-white" fill="currentColor" />
                    </div>
                    <h1 className="text-2xl font-bold text-primary mb-2">PCB Inventory Control</h1>
                    <p className="text-secondary text-sm">Secure Manufacturing Portal</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary ml-1">Username / Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail size={18} className="text-muted group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input pl-11"
                                placeholder="admin"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={18} className="text-muted group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input pl-11 pr-11"
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
