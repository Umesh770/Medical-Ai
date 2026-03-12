import { Link } from 'react-router-dom';
import { HiOutlineUpload, HiOutlineShieldCheck, HiOutlineChat, HiOutlineVideoCamera, HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineCheckCircle } from 'react-icons/hi';

const Landing = () => {
    const features = [
        { icon: <HiOutlineShieldCheck className="w-7 h-7" />, title: 'AI-Powered Analysis', desc: 'Upload medical reports and receive instant AI-assisted insights on potential conditions and recommendations.' },
        { icon: <HiOutlineUserGroup className="w-7 h-7" />, title: 'Connect with Doctors', desc: 'Book appointments with qualified healthcare professionals for personalized consultations.' },
        { icon: <HiOutlineVideoCamera className="w-7 h-7" />, title: 'Video Consultations', desc: 'Have face-to-face consultations with doctors from the comfort of your home.' },
        { icon: <HiOutlineChat className="w-7 h-7" />, title: 'Secure Messaging', desc: 'Chat with your healthcare providers in real-time through our encrypted messaging system.' },
        { icon: <HiOutlineDocumentText className="w-7 h-7" />, title: 'Medical Records', desc: 'Keep all your medical reports, prescriptions, and health records in one secure place.' },
        { icon: <HiOutlineUpload className="w-7 h-7" />, title: 'Easy Report Upload', desc: 'Upload PDFs, images, and DICOM files for instant AI analysis and doctor review.' },
    ];

    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <div className="landing-logo">
                        <div className="landing-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <span className="landing-logo-text">Medi<span>Care</span></span>
                    </div>
                    <div className="landing-nav-links">
                        <a href="#features">Features</a>
                        <a href="#about">About</a>
                        <a href="#contact">Contact</a>
                    </div>
                    <div className="landing-nav-actions">
                        <Link to="/login" className="landing-btn-signin">Sign In</Link>
                        <Link to="/login?register=true" className="landing-btn-getstarted">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <div className="landing-hero-left">
                        <span className="landing-hero-badge">✨ AI-Powered Healthcare Platform</span>
                        <h1 className="landing-hero-title">
                            Smart Health Insights <span className="landing-gradient-text">Powered by AI</span>
                        </h1>
                        <p className="landing-hero-desc">
                            Upload your medical reports and get AI-assisted analysis in minutes. Connect with doctors for professional consultations and personalized care.
                        </p>
                        <div className="landing-hero-actions">
                            <Link to="/login?register=true" className="landing-btn-getstarted landing-btn-lg">Get Started Free ›</Link>
                            <a href="#features" className="landing-btn-learn">Learn More</a>
                        </div>
                        <div className="landing-social-proof">
                            <div className="landing-avatars">
                                {['A', 'B', 'C', 'D'].map((l, i) => (
                                    <div key={i} className="landing-avatar" style={{ background: ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981'][i] }}>{l}</div>
                                ))}
                            </div>
                            <div>
                                <strong>10,000+ Patients</strong>
                                <span>Trust our platform</span>
                            </div>
                        </div>
                    </div>
                    <div className="landing-hero-right">
                        <div className="landing-hero-card">
                            <div className="hero-card-inner">
                                <div className="hero-heartbeat-line">
                                    <svg viewBox="0 0 400 100" className="heartbeat-svg">
                                        <path d="M0 50 L80 50 L100 20 L120 80 L140 30 L160 70 L180 50 L400 50" stroke="#06b6d4" strokeWidth="2" fill="none" className="heartbeat-path" />
                                    </svg>
                                </div>
                                <div className="hero-floating-badge upload-badge">
                                    <HiOutlineUpload className="w-5 h-5" />
                                    <div><strong>Upload Report</strong><span>PDF, Images, X-rays</span></div>
                                </div>
                                <div className="hero-floating-badge analysis-badge">
                                    <HiOutlineCheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                                    <div><strong>Analysis Complete</strong><span>No abnormalities detected</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing-features" id="features">
                <div className="landing-features-inner">
                    <h2 className="landing-section-title">
                        Everything You Need for <span className="landing-gradient-text">Better Health</span>
                    </h2>
                    <p className="landing-section-desc">
                        Our comprehensive platform combines AI technology with professional healthcare services.
                    </p>
                    <div className="landing-features-grid">
                        {features.map((f, i) => (
                            <div key={i} className="landing-feature-card">
                                <div className="landing-feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-logo">
                        <div className="landing-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <span className="landing-logo-text">Medi<span>Care</span></span>
                    </div>
                    <p className="landing-footer-text">© 2026 MediCare. All rights reserved. AI-Powered Healthcare Platform.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
