import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineMail, HiOutlineLockClosed, HiOutlineUser,
    HiOutlineEye, HiOutlineEyeOff, HiOutlinePhone, HiOutlineCalendar
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const Login = () => {
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(!searchParams.get('register'));
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        role: 'patient',
    });

    const navigate = useNavigate();
    const { login, register } = useAuth();

    useEffect(() => {
        if (searchParams.get('register') === 'true') setIsLogin(false);
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isLogin && formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setLoading(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
                toast.success('Welcome back!');
            } else {
                await register({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    phone: formData.phone || undefined,
                    dateOfBirth: formData.dateOfBirth || undefined,
                    gender: formData.gender || undefined,
                });
                toast.success('Account created successfully!');
            }
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="auth-page">
            {/* Logo */}
            <div className="auth-logo">
                <div className="landing-logo-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <span className="landing-logo-text">Medi<span>Care</span></span>
            </div>

            {/* Form Card */}
            <div className="auth-card">
                <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="auth-subtitle">{isLogin ? 'Sign in to continue' : 'Join MediCare for smarter healthcare'}</p>

                {/* Role Selector (Register only) */}
                {!isLogin && (
                    <div className="role-selector">
                        <button type="button" className={`role-btn ${formData.role === 'patient' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, role: 'patient' })}>
                            <HiOutlineUser className="w-6 h-6" />
                            <span>I'm a Patient</span>
                        </button>
                        <button type="button" className={`role-btn ${formData.role === 'doctor' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, role: 'doctor' })}>
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                            </svg>
                            <span>I'm a Doctor</span>
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Full Name — register only */}
                    {!isLogin && (
                        <div className="auth-field">
                            <label>Full Name</label>
                            <div className="auth-input-wrap">
                                <HiOutlineUser className="auth-input-icon" />
                                <input
                                    type="text" name="name" value={formData.name} onChange={handleChange}
                                    placeholder={formData.role === 'doctor' ? 'Dr. John Smith' : 'John Doe'}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    {/* Email */}
                    <div className="auth-field">
                        <label>Email Address</label>
                        <div className="auth-input-wrap">
                            <HiOutlineMail className="auth-input-icon" />
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                        </div>
                    </div>

                    {/* Phone — register only */}
                    {!isLogin && (
                        <div className="auth-field">
                            <label>Phone Number <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
                            <div className="auth-input-wrap">
                                <HiOutlinePhone className="auth-input-icon" />
                                <input
                                    type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                    placeholder="e.g. 9876543210"
                                />
                            </div>
                        </div>
                    )}

                    {/* Date of Birth + Gender side by side — register only */}
                    {!isLogin && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="auth-field">
                                <label>Date of Birth <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
                                <div className="auth-input-wrap">
                                    <HiOutlineCalendar className="auth-input-icon" />
                                    <input
                                        type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                            <div className="auth-field">
                                <label>Gender <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></label>
                                <div className="auth-input-wrap" style={{ padding: 0 }}>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        style={{
                                            width: '100%', height: '100%',
                                            background: 'transparent',
                                            border: 'none', outline: 'none',
                                            color: formData.gender ? 'inherit' : '#64748b',
                                            padding: '0 0.875rem',
                                            fontSize: '0.875rem',
                                            fontFamily: 'inherit',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Password */}
                    <div className="auth-field">
                        <label>Password</label>
                        <div className="auth-input-wrap">
                            <HiOutlineLockClosed className="auth-input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'} name="password"
                                value={formData.password} onChange={handleChange}
                                placeholder="Min. 6 characters" required minLength={6}
                            />
                            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password — register only */}
                    {!isLogin && (
                        <div className="auth-field">
                            <label>Confirm Password</label>
                            <div className="auth-input-wrap">
                                <HiOutlineLockClosed className="auth-input-icon" />
                                <input
                                    type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                    placeholder="Confirm your password" required={!isLogin} minLength={6}
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="auth-submit-btn">
                        {loading ? <span className="spinner-sm"></span> : isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-toggle">
                    {isLogin ? (
                        <p>Don't have an account? <button onClick={() => setIsLogin(false)}>Sign up</button></p>
                    ) : (
                        <p>Already have an account? <button onClick={() => setIsLogin(true)}>Sign in</button></p>
                    )}
                </div>
            </div>

            <Link to="/welcome" className="auth-back-link">← Back to Home</Link>
        </div>
    );
};

export default Login;
