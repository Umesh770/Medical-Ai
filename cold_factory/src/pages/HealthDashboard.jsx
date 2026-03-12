import { useState, useEffect } from 'react';
import {
    HiOutlineCalendar, HiOutlineChatAlt2, HiOutlineDocumentReport,
    HiOutlineUsers, HiOutlineCurrencyRupee, HiOutlineBell,
    HiOutlineTrendingUp, HiOutlineClipboardCheck, HiOutlineHeart
} from 'react-icons/hi';
import { appointmentAPI, labTestAPI, messageAPI, prescriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const HealthDashboard = () => {
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor';
    const isPatient = user?.role === 'patient';

    const [appointments, setAppointments] = useState([]);
    const [allUpcoming, setAllUpcoming] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [stats, setStats] = useState({ appts: 0, count2: 0, count3: 0, count4: 0 });
    const [activity, setActivity] = useState([]);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [apptRes] = await Promise.all([appointmentAPI.getAll()]);
            const appts = apptRes.data.data || [];

            // Sort: upcoming first
            const upcoming = appts
                .filter(a => new Date(a.dateTime) >= new Date() && a.status !== 'cancelled')
                .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

            setAppointments(upcoming.slice(0, 3));
            setAllUpcoming(upcoming);

            // Build stats based on role
            if (isPatient) {
                try {
                    const [labRes, msgRes, rxRes] = await Promise.all([
                        labTestAPI.getAll(),
                        messageAPI.getConversations(),
                        prescriptionAPI.getAll(),
                    ]);
                    const labs = labRes.data.data || [];
                    const msgs = msgRes.data.data || [];
                    const rxs = rxRes.data.data || [];
                    setPrescriptions(rxs.slice(0, 3));
                    setStats({
                        appts: appts.filter(a => new Date(a.dateTime) >= new Date() && a.status !== 'cancelled').length,
                        count2: rxs.length,
                        count3: labs.length,
                        count4: msgs.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
                    });
                } catch {
                    setStats({ appts: upcoming.length, count2: 0, count3: 0, count4: 0 });
                }
            } else if (isDoctor) {
                const today = new Date().toDateString();
                const todayAppts = appts.filter(a => new Date(a.dateTime).toDateString() === today);
                const pending = appts.filter(a => a.status === 'scheduled' || a.status === 'pending');
                setStats({
                    appts: todayAppts.length,
                    count2: appts.filter(a => new Date(a.dateTime) >= new Date()).length,
                    count3: pending.length,
                    count4: 0,
                });
            }

            // Build activity from appointments
            const recentAppts = [...appts]
                .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
                .slice(0, 5)
                .map(a => {
                    const isUpcoming = new Date(a.dateTime) >= new Date();
                    const otherName = isDoctor
                        ? (a.patientId?.userId?.name || 'Patient')
                        : (a.doctorId?.userId?.name || 'Doctor');
                    return {
                        id: a._id,
                        icon: a.status === 'completed' ? '✅' : a.type === 'video' ? '📹' : '🏥',
                        text: isUpcoming
                            ? `Upcoming appointment with ${otherName}`
                            : `Appointment with ${otherName} — ${a.status}`,
                        time: formatRelative(a.dateTime),
                    };
                });
            setActivity(recentAppts);
        } catch {
            // Silent — show empty state
        } finally {
            setLoading(false);
        }
    };

    const formatRelative = (date) => {
        const d = new Date(date);
        const diff = Date.now() - d.getTime();
        if (diff < 0) {
            const abs = -diff;
            if (abs < 3600000) return `in ${Math.floor(abs / 60000)}m`;
            if (abs < 86400000) return `Today, ${d.toLocaleTimeString('en', { timeStyle: 'short' })}`;
            return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        }
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    const patientStatCards = [
        { label: 'Upcoming Appointments', value: stats.appts, icon: HiOutlineCalendar, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
        { label: 'Prescriptions', value: stats.count2, icon: HiOutlineClipboardCheck, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        { label: 'Lab Reports', value: stats.count3, icon: HiOutlineDocumentReport, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        { label: 'Unread Messages', value: stats.count4, icon: HiOutlineChatAlt2, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    ];

    const doctorStatCards = [
        { label: "Today's Appointments", value: stats.appts, icon: HiOutlineCalendar, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
        { label: 'Total Upcoming', value: stats.count2, icon: HiOutlineUsers, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        { label: 'Pending Reviews', value: stats.count3, icon: HiOutlineDocumentReport, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        { label: 'Messages', value: stats.count4, icon: HiOutlineChatAlt2, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    ];

    const statCards = isDoctor ? doctorStatCards : patientStatCards;

    return (
        <div className="health-dashboard">
            {/* Welcome */}
            <div className="dashboard-welcome">
                <div>
                    <h1 className="dashboard-welcome-title">
                        Welcome back, <span className="gradient-text">{user?.name || 'User'}</span> 👋
                    </h1>
                    <p className="dashboard-welcome-subtitle">
                        {isDoctor ? "Here's your patient schedule for today" : 'Your health at a glance'}
                    </p>
                </div>
            </div>

            {/* Stats Grid — real counts */}
            <div className="stats-grid">
                {statCards.map((stat, i) => (
                    <div key={i} className="stat-card-health" style={{ '--stat-color': stat.color, position: 'relative' }}
                        onMouseEnter={() => setHoveredCard(i)}
                        onMouseLeave={() => setHoveredCard(null)}>
                        <div className="stat-icon-wrapper" style={{ background: stat.bg }}>
                            <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                        </div>
                        <div className="stat-info">
                            <p className="stat-label">{stat.label}</p>
                            <h3 className="stat-value" style={{ color: stat.color }}>
                                {loading ? '…' : stat.value}
                            </h3>
                        </div>
                        {/* Dropdown for upcoming appointments */}
                        {(stat.label === 'Upcoming Appointments' || stat.label === 'Total Upcoming') && hoveredCard === i && allUpcoming.length > 0 && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, minWidth: '240px', zIndex: 100,
                                background: '#1e293b', padding: '12px', borderRadius: '10px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                border: '1px solid #334155', maxHeight: '300px', overflowY: 'auto', marginTop: '10px'
                            }}>
                                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>All Upcoming</h4>
                                {allUpcoming.map(a => {
                                    const otherName = isDoctor ? (a.patientId?.userId?.name || 'Patient') : (a.doctorId?.userId?.name || 'Doctor');
                                    return (
                                        <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                            <div style={{ color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{otherName}</div>
                                            <div style={{ color: '#0ea5e9', fontWeight: '500' }}>{new Date(a.dateTime).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-content-grid">
                {/* Upcoming Appointments — real data */}
                <div className="dashboard-section-card">
                    <div className="section-header">
                        <h2><HiOutlineCalendar className="inline w-5 h-5 mr-2" />Upcoming Appointments</h2>
                        <Link to="/appointments" className="section-link">View All →</Link>
                    </div>
                    <div className="appointment-list">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                <div className="spinner" style={{ margin: '0 auto' }} />
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="empty-state" style={{ padding: '1.5rem' }}>
                                <span style={{ fontSize: '2rem' }}>📅</span>
                                <h3>No upcoming appointments</h3>
                                <p>
                                    <Link to="/appointments" style={{ color: '#06b6d4' }}>Book an appointment</Link>
                                </p>
                            </div>
                        ) : appointments.map(apt => {
                            const doctorName = apt.doctorId?.userId?.name || 'Doctor';
                            const patientName = apt.patientId?.userId?.name || 'Patient';
                            const specialty = apt.doctorId?.specialization || '';
                            const displayName = isDoctor ? patientName : doctorName;
                            const displaySub = isDoctor ? '' : specialty;
                            return (
                                <div key={apt._id} className="appointment-item">
                                    <div className="appointment-avatar">
                                        {displayName.charAt(isDoctor ? 0 : 4) || displayName.charAt(0)}
                                    </div>
                                    <div className="appointment-details">
                                        <h4>{displayName}</h4>
                                        {displaySub && <p className="text-sm text-slate-400">{displaySub}</p>}
                                        <div className="appointment-meta">
                                            <span className="appointment-date">
                                                {new Date(apt.dateTime).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                            <span className={`appointment-type ${apt.type === 'video' ? 'type-video' : 'type-inperson'}`}>
                                                {apt.type === 'video' ? '📹 Video' : '🏥 In-Person'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`status-badge`} style={{ '--badge-color': apt.status === 'confirmed' ? '#06b6d4' : '#f59e0b' }}>
                                        {apt.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity — from real appointments */}
                <div className="dashboard-section-card">
                    <div className="section-header">
                        <h2><HiOutlineTrendingUp className="inline w-5 h-5 mr-2" />Recent Activity</h2>
                    </div>
                    <div className="activity-list">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                        ) : activity.length === 0 ? (
                            <div className="empty-state" style={{ padding: '1.5rem' }}>
                                <span style={{ fontSize: '2rem' }}>📋</span>
                                <h3>No recent activity</h3>
                            </div>
                        ) : activity.map(a => (
                            <div key={a.id} className="activity-item">
                                <span className="activity-icon">{a.icon}</span>
                                <div className="activity-details">
                                    <p>{a.text}</p>
                                    <span className="activity-time">{a.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                    <Link to="/appointments" className="quick-action-btn">
                        <HiOutlineCalendar className="w-8 h-8" />
                        <span>Book Appointment</span>
                    </Link>
                    <Link to="/upload-report" className="quick-action-btn">
                        <HiOutlineDocumentReport className="w-8 h-8" />
                        <span>Upload Report</span>
                    </Link>
                    <Link to="/ai-analysis" className="quick-action-btn">
                        <span className="text-2xl">🤖</span>
                        <span>AI Analysis</span>
                    </Link>
                    <Link to="/messages" className="quick-action-btn">
                        <HiOutlineChatAlt2 className="w-8 h-8" />
                        <span>Messages</span>
                    </Link>
                    <Link to="/emergency" className="quick-action-btn emergency">
                        <HiOutlineBell className="w-8 h-8" />
                        <span>Emergency</span>
                    </Link>
                    <Link to="/payments" className="quick-action-btn">
                        <HiOutlineCurrencyRupee className="w-8 h-8" />
                        <span>Payments</span>
                    </Link>
                </div>
            </div>

            {/* Recent Prescriptions — patient only */}
            {isPatient && (
                <div className="dashboard-section-card" style={{ marginTop: '1.5rem' }}>
                    <div className="section-header">
                        <h2><HiOutlineClipboardCheck className="inline w-5 h-5 mr-2" />Recent Prescriptions</h2>
                        <Link to="/prescriptions" className="section-link">View All →</Link>
                    </div>
                    <div className="appointment-list">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                                <div className="spinner" style={{ margin: '0 auto' }} />
                            </div>
                        ) : prescriptions.length === 0 ? (
                            <div className="empty-state" style={{ padding: '1.5rem' }}>
                                <span style={{ fontSize: '2rem' }}>📋</span>
                                <h3>No prescriptions yet</h3>
                                <p>Prescriptions from your doctor will appear here</p>
                            </div>
                        ) : prescriptions.map(rx => {
                            const docName = rx.doctorId?.userId?.name || 'Doctor';
                            return (
                                <div key={rx._id} className="appointment-item">
                                    <div className="appointment-avatar" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                                        💊
                                    </div>
                                    <div className="appointment-details">
                                        <h4>{rx.diagnosis || 'Prescription'}</h4>
                                        <p className="text-sm text-slate-400">Dr. {docName}</p>
                                        <div className="appointment-meta">
                                            <span className="appointment-date">
                                                {new Date(rx.createdAt).toLocaleDateString('en', { dateStyle: 'medium' })}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {rx.medicines?.length || 0} medicine{rx.medicines?.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="status-badge" style={{ '--badge-color': '#8b5cf6' }}>Rx</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthDashboard;
