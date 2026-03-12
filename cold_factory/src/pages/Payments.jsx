import { useState, useEffect } from 'react';
import { HiOutlineCurrencyRupee, HiOutlineCalendar, HiOutlineCreditCard } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_ICON = { completed: '✅', pending: '⏳', failed: '❌', refunded: '↩️' };
const STATUS_COLOR = { completed: '#10b981', pending: '#f59e0b', failed: '#ef4444', refunded: '#8b5cf6' };
const TYPE_ICON = { appointment: '🏥', labtest: '🧪', pharmacy: '💊', subscription: '⭐' };

const Payments = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const histRes = await paymentAPI.getHistory();
            setPayments(histRes.data?.data || []);
        } catch {
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const payNow = async (item) => {
        setPaying(item._id);
        try {
            // Create payment intent
            const res = await paymentAPI.createIntent({
                amount: item.amount,
                type: item.type,
                referenceId: item.appointmentId || item._id, // appointmentId mapped in backend for both
                description: item.description,
            });
            // Complete payment Verification immediately for mockup
            await paymentAPI.verify({
                paymentId: res.data?.data?.id || item._id,
                referenceId: item.appointmentId || item._id,
                type: item.type,
                status: 'completed'
            });
            toast.success('Payment completed successfully!');
            fetchData();
        } catch {
            toast.error('Failed to process payment');
        } finally {
            setPaying(null);
        }
    };

    const isPatient = user?.role === 'patient';
    const totalAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingItems = payments.filter(p => p.status === 'pending');

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div className="payments-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">💳 Payments & Earnings</h1>
                    <p className="page-subtitle">{isPatient ? 'Track your healthcare expenses and pay dues' : 'Track your consultation earnings'}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="payment-stats">
                <div className="payment-stat-card">
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(16,185,129,0.1)' }}>
                        <HiOutlineCurrencyRupee className="w-6 h-6" style={{ color: '#10b981' }} />
                    </div>
                    <div>
                        <p className="stat-label">Total {isPatient ? 'Spent' : 'Earnings'}</p>
                        <h3 className="stat-value" style={{ color: '#10b981' }}>₹{totalAmount.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="payment-stat-card">
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(245,158,11,0.1)' }}>
                        <HiOutlineCreditCard className="w-6 h-6" style={{ color: '#f59e0b' }} />
                    </div>
                    <div>
                        <p className="stat-label">Pending {isPatient ? 'Dues' : 'Earnings'}</p>
                        <h3 className="stat-value" style={{ color: '#f59e0b' }}>₹{pendingAmount.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="payment-stat-card">
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(139,92,246,0.1)' }}>
                        <HiOutlineCalendar className="w-6 h-6" style={{ color: '#8b5cf6' }} />
                    </div>
                    <div>
                        <p className="stat-label">Transactions</p>
                        <h3 className="stat-value" style={{ color: '#8b5cf6' }}>{payments.length}</h3>
                    </div>
                </div>
            </div>

            {/* Pending Payments / Dues */}
            {pendingItems.length > 0 && (
                <div className="dashboard-section-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header"><h2>⏳ {isPatient ? 'Due Payments' : 'Pending Earnings'}</h2></div>
                    <div className="pending-payments">
                        {pendingItems.map(item => (
                            <div key={item._id} className="pending-payment-card">
                                <div className="pending-info">
                                    <span className="text-2xl">{TYPE_ICON[item.type] || '📋'}</span>
                                    <div>
                                        <h4>{item.description}</h4>
                                        <p>{new Date(item.date).toLocaleDateString('en', { dateStyle: 'medium' })}</p>
                                    </div>
                                </div>
                                <div className="pending-action">
                                    <span className="pending-amount">₹{item.amount}</span>
                                    {isPatient && (
                                        <button className="btn-primary btn-sm"
                                            disabled={paying === item._id}
                                            onClick={() => payNow(item)}>
                                            {paying === item._id ? <span className="spinner-sm" /> : 'Pay Now'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Transaction History */}
            <div className="dashboard-section-card">
                <div className="section-header"><h2>Transaction History</h2></div>
                {payments.length === 0 ? (
                    <div className="empty-state">
                        <span style={{ fontSize: '2.5rem' }}>💳</span>
                        <h3>No transactions yet</h3>
                        <p>Your payment history will appear here</p>
                    </div>
                ) : (
                    <div className="payments-table-wrapper">
                        <table className="payments-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(payment => (
                                    <tr key={payment._id}>
                                        <td>{new Date(payment.date || payment.createdAt).toLocaleDateString('en', { dateStyle: 'medium' })}</td>
                                        <td>
                                            <div className="payment-description">
                                                <span className="payment-type-icon">{TYPE_ICON[payment.type] || '📋'}</span>
                                                {payment.description}
                                            </div>
                                        </td>
                                        <td><span className="payment-type-badge">{payment.type}</span></td>
                                        <td className="payment-amount">₹{payment.amount}</td>
                                        <td>
                                            <span className="status-badge" style={{ '--badge-color': STATUS_COLOR[payment.status] }}>
                                                {STATUS_ICON[payment.status]} {payment.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {payment.receipt || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payments;
