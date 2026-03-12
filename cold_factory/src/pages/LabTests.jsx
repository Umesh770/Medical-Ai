import { useState, useEffect } from 'react';
import { HiOutlineDocumentReport, HiOutlineClipboardCheck, HiOutlineCalendar, HiOutlineDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { labTestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_TESTS = [
    { name: 'Complete Blood Count (CBC)', price: 350, category: 'Hematology', turnaround: '24 hours', testCode: 'CBC001' },
    { name: 'Lipid Profile', price: 500, category: 'Biochemistry', turnaround: '24 hours', testCode: 'LPD001' },
    { name: 'Thyroid Profile (T3, T4, TSH)', price: 600, category: 'Endocrinology', turnaround: '48 hours', testCode: 'THY001' },
    { name: 'Liver Function Test', price: 550, category: 'Hepatology', turnaround: '24 hours', testCode: 'LFT001' },
    { name: 'Kidney Function Test', price: 500, category: 'Nephrology', turnaround: '24 hours', testCode: 'KFT001' },
    { name: 'HbA1c', price: 450, category: 'Diabetes', turnaround: '6 hours', testCode: 'HBA001' },
    { name: 'Vitamin D', price: 700, category: 'Nutrition', turnaround: '48 hours', testCode: 'VD001' },
    { name: 'Vitamin B12', price: 650, category: 'Nutrition', turnaround: '48 hours', testCode: 'VB12001' },
];

const STATUS_COLOR = { booked: '#f59e0b', 'sample-collected': '#8b5cf6', processing: '#06b6d4', completed: '#10b981', cancelled: '#ef4444' };
const STATUS_ICON = { booked: '📅', 'sample-collected': '🧪', processing: '⚙️', completed: '✅', cancelled: '❌' };
const STATUS_ORDER = { booked: 0, 'sample-collected': 1, processing: 2, completed: 3 };

const LabTests = () => {
    const { user } = useAuth();
    const [tests, setTests] = useState([]);
    const [activeTab, setActiveTab] = useState('booked');
    const [showBooking, setShowBooking] = useState(false);
    const [booking, setBooking] = useState({ testName: '', testCode: '', category: '', price: 0, turnaround: '', lab: '', appointmentDate: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchTests(); }, []);

    const fetchTests = async () => {
        setLoading(true);
        try {
            const res = await labTestAPI.getAll();
            setTests(res.data.data || []);
        } catch {
            setTests([]);
        }
        setLoading(false);
    };

    const selectTest = (test) => {
        setBooking({ testName: test.name, testCode: test.testCode, category: test.category, price: test.price, turnaround: test.turnaround, lab: '', appointmentDate: '' });
    };

    const bookTest = async () => {
        if (!booking.testName) return toast.error('Select a test first');
        if (!booking.lab.trim()) return toast.error('Enter lab / collection center name');
        if (!booking.appointmentDate) return toast.error('Select appointment date');
        setSaving(true);
        try {
            await labTestAPI.book({
                testName: booking.testName,
                testCode: booking.testCode,
                category: booking.category,
                price: booking.price,
                lab: booking.lab,
                appointmentDate: booking.appointmentDate,
            });
            toast.success(`${booking.testName} booked successfully!`);
            setShowBooking(false);
            setBooking({ testName: '', testCode: '', category: '', price: 0, turnaround: '', lab: '', appointmentDate: '' });
            fetchTests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to book test');
        }
        setSaving(false);
    };

    const filteredTests = activeTab === 'booked'
        ? tests.filter(t => ['booked', 'sample-collected', 'processing'].includes(t.status))
        : tests.filter(t => t.status === 'completed');

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div className="labtests-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🧪 Lab Tests</h1>
                    <p className="page-subtitle">Book tests, track samples, and view reports</p>
                </div>
                <button className="btn-primary" onClick={() => setShowBooking(true)}>
                    <HiOutlineClipboardCheck className="w-5 h-5" />
                    Book Test
                </button>
            </div>

            <div className="lab-tabs">
                <button className={`lab-tab ${activeTab === 'booked' ? 'active' : ''}`} onClick={() => setActiveTab('booked')}>
                    📋 Booked Tests ({tests.filter(t => ['booked', 'sample-collected', 'processing'].includes(t.status)).length})
                </button>
                <button className={`lab-tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                    📊 Reports ({tests.filter(t => t.status === 'completed').length})
                </button>
            </div>

            <div className="lab-tests-list">
                {filteredTests.length === 0 ? (
                    <div className="empty-state">
                        <span className="text-5xl">🧪</span>
                        <h3>No {activeTab === 'booked' ? 'booked tests' : 'reports'} yet</h3>
                        <p>{activeTab === 'booked' ? 'Book a lab test to get started' : 'Completed tests will appear here'}</p>
                    </div>
                ) : filteredTests.map(test => (
                    <div key={test._id} className="lab-test-card">
                        <div className="lab-test-header">
                            <div>
                                <h3>{test.testName}</h3>
                                {test.testCode && <span className="lab-test-code">{test.testCode}</span>}
                            </div>
                            <span className="status-badge" style={{ '--badge-color': STATUS_COLOR[test.status] }}>
                                {STATUS_ICON[test.status]} {test.status}
                            </span>
                        </div>
                        <div className="lab-test-meta">
                            <span><HiOutlineCalendar className="inline w-4 h-4" /> Booked: {new Date(test.bookedDate || test.createdAt).toLocaleDateString('en', { dateStyle: 'medium' })}</span>
                            {test.lab && <span>🏥 {test.lab}</span>}
                            {test.price && <span className="lab-test-price">₹{test.price}</span>}
                        </div>

                        <div className="lab-progress">
                            {['booked', 'sample-collected', 'processing', 'completed'].map((step, i) => {
                                const current = STATUS_ORDER[test.status] ?? 0;
                                return (
                                    <div key={step} className={`progress-step ${i <= current ? 'done' : ''} ${i === current ? 'current' : ''}`}>
                                        <div className="progress-dot">{i < current ? '✓' : i + 1}</div>
                                        <span>{step.replace('-', ' ')}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {test.status === 'completed' && test.results && (
                            <div className="lab-test-results">
                                <h4>📊 Results</h4>
                                <div className="results-grid">
                                    {Object.entries(test.results).map(([key, val]) => (
                                        <div key={key} className="result-item">
                                            <span className="result-param">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            <span className="result-value">{val}</span>
                                        </div>
                                    ))}
                                </div>
                                {test.reviewedBy && (
                                    <div className="doctor-review">
                                        <span>👨‍⚕️ Reviewed by: <strong>{test.reviewedBy}</strong></span>
                                        <p>"{test.doctorRemarks}"</p>
                                    </div>
                                )}
                                <div className="lab-test-actions">
                                    <button className="btn-sm btn-primary-sm" onClick={() => toast.success('Report download ready')}>
                                        <HiOutlineDownload className="w-4 h-4" /> Download Report
                                    </button>
                                    <button className="btn-sm btn-secondary-sm" onClick={() => window.location.href = '/ai-analysis'}>
                                        🤖 AI Analysis
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Book Test Modal */}
            {showBooking && (
                <div className="modal-overlay" onClick={() => setShowBooking(false)}>
                    <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🧪 Book Lab Test</h2>
                            <button className="modal-close" onClick={() => setShowBooking(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {/* Step 1: select test */}
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Select a test:</p>
                            <div className="available-tests-grid">
                                {AVAILABLE_TESTS.map((test, i) => (
                                    <div key={i}
                                        className={`available-test-card ${booking.testName === test.name ? 'selected' : ''}`}
                                        style={{ cursor: 'pointer', border: booking.testName === test.name ? '2px solid #06b6d4' : undefined }}
                                        onClick={() => selectTest(test)}>
                                        <h4>{test.name}</h4>
                                        <div className="available-test-meta">
                                            <span className="tag">{test.category}</span>
                                            <span>⏱️ {test.turnaround}</span>
                                        </div>
                                        <div className="available-test-footer">
                                            <span className="available-test-price">₹{test.price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Step 2: fill details */}
                            {booking.testName && (
                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(71,85,105,0.3)', paddingTop: '1rem' }}>
                                    <p style={{ color: '#06b6d4', fontWeight: 600, marginBottom: '0.75rem' }}>Selected: {booking.testName} — ₹{booking.price}</p>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Lab / Collection Center</label>
                                            <input type="text" className="form-input" placeholder="e.g. SRL Diagnostics, City Labs"
                                                value={booking.lab} onChange={e => setBooking(b => ({ ...b, lab: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Appointment Date</label>
                                            <input type="date" className="form-input"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={booking.appointmentDate} onChange={e => setBooking(b => ({ ...b, appointmentDate: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setShowBooking(false)}>Cancel</button>
                                <button className="btn-primary" onClick={bookTest} disabled={saving || !booking.testName}>
                                    {saving ? <><span className="spinner-sm" /> Booking…</> : '✓ Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTests;
