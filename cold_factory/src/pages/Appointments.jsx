import { useState, useEffect, useRef } from 'react';
import {
    HiOutlineCalendar, HiOutlineClock, HiOutlineVideoCamera, HiOutlinePhone,
    HiOutlineLocationMarker, HiOutlinePlus, HiOutlineX,
    HiOutlineUser, HiOutlineSearch, HiOutlineChevronDown
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { appointmentAPI, doctorAPI, patientAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
    scheduled: '#f59e0b', confirmed: '#06b6d4', 'in-progress': '#8b5cf6',
    completed: '#10b981', cancelled: '#ef4444', 'no-show': '#6b7280', pending: '#f59e0b'
};

const Appointments = () => {
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor';
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [showBooking, setShowBooking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [bookingData, setBookingData] = useState({
        doctorId: '', patientId: '', dateTime: '', type: 'in-person', reason: '', remarks: '', symptoms: ''
    });

    useEffect(() => { fetchData(); }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const promises = [appointmentAPI.getAll()];
            if (isDoctor) promises.push(patientAPI.getAll());
            else promises.push(doctorAPI.getAll());

            const [aptRes, listRes] = await Promise.all(promises);
            setAppointments(aptRes.data.data || []);
            if (isDoctor) setPatients(listRes.data.data || []);
            else setDoctors(listRes.data.data || []);
        } catch {
            setAppointments([]);
            if (isDoctor) setPatients([]);
            else setDoctors([]);
            toast.error('Failed to load appointments');
        }
        setLoading(false);
    };

    const handleBook = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                dateTime: bookingData.dateTime,
                type: bookingData.type,
                reason: bookingData.reason || bookingData.remarks,
                symptoms: bookingData.symptoms ? bookingData.symptoms.split(',').map(s => s.trim()) : [],
            };
            if (isDoctor) payload.patientId = bookingData.patientId;
            else payload.doctorId = bookingData.doctorId;

            await appointmentAPI.create(payload);
            toast.success('Appointment booked successfully!');
            setShowBooking(false);
            setBookingData({ doctorId: '', patientId: '', dateTime: '', type: 'in-person', reason: '', remarks: '', symptoms: '' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to book appointment');
        }
    };

    const handleCancel = async (id) => {
        try {
            await appointmentAPI.cancel(id);
            toast.success('Appointment cancelled');
            fetchData();
        } catch {
            toast.success('Cancelled (Demo)');
            setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
        }
    };

    const generateCalendarDays = () => {
        const today = new Date();
        return Array.from({ length: 14 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i - 2);
            return d;
        });
    };

    const filteredSearch = (list) =>
        list.filter(item => item.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

    return (
        <div className="appointments-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Appointments</h1>
                    <p className="page-subtitle">
                        {isDoctor ? 'Manage your patient appointments' : 'Manage your medical appointments'}
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowBooking(true)}>
                    <HiOutlinePlus className="w-5 h-5" />
                    <span>Book Appointment</span>
                </button>
            </div>

            {/* Calendar Strip */}
            <div className="calendar-strip">
                {generateCalendarDays().map((day, i) => {
                    const isSelected = day.toISOString().split('T')[0] === selectedDate;
                    const isToday = day.toDateString() === new Date().toDateString();
                    const hasAppt = appointments.some(a =>
                        new Date(a.dateTime).toDateString() === day.toDateString()
                    );
                    return (
                        <button
                            key={i}
                            className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                            onClick={() => setSelectedDate(day.toISOString().split('T')[0])}
                        >
                            <span className="calendar-day-name">{day.toLocaleDateString('en', { weekday: 'short' })}</span>
                            <span className="calendar-day-num">{day.getDate()}</span>
                            {hasAppt && <span className="calendar-dot"></span>}
                        </button>
                    );
                })}
            </div>

            {/* Appointment Cards */}
            <div className="appointments-grid">
                {appointments.filter(a => a.dateTime.split('T')[0] === selectedDate).length === 0 ? (
                    <div className="empty-state">
                        <HiOutlineCalendar className="w-16 h-16 text-slate-600 mx-auto" />
                        <h3>No Appointments</h3>
                        <p>No appointments scheduled for this date</p>
                    </div>
                ) : (
                    appointments.filter(a => a.dateTime.split('T')[0] === selectedDate).map(apt => {
                        // For doctor view: show patient name; for patient view: show doctor name
                        const primaryName = isDoctor
                            ? (apt.patientId?.userId?.name || 'Patient')
                            : (apt.doctorId?.userId?.name || 'Doctor');
                        const primarySub = isDoctor
                            ? 'Patient'
                            : (apt.doctorId?.specialization || 'Specialist');

                        return (
                            <div key={apt._id} className="appointment-card">
                                <div className="appointment-card-header">
                                    <div className="appointment-card-avatar">
                                        {primaryName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3>{primaryName}</h3>
                                        <p className="text-sm" style={{ color: '#94a3b8' }}>{primarySub}</p>
                                    </div>
                                    <span className="status-badge" style={{ '--badge-color': STATUS_COLORS[apt.status] }}>
                                        {apt.status}
                                    </span>
                                </div>
                                <div className="appointment-card-body">
                                    <div className="info-row">
                                        <HiOutlineCalendar className="w-4 h-4" />
                                        <span>{new Date(apt.dateTime).toLocaleDateString('en', { dateStyle: 'medium' })}</span>
                                    </div>
                                    <div className="info-row">
                                        <HiOutlineClock className="w-4 h-4" />
                                        <span>{new Date(apt.dateTime).toLocaleTimeString('en', { timeStyle: 'short' })}</span>
                                    </div>
                                    <div className="info-row">
                                        {apt.type === 'video'
                                            ? <HiOutlineVideoCamera className="w-4 h-4" />
                                            : apt.type === 'phone'
                                                ? <HiOutlinePhone className="w-4 h-4" />
                                                : <HiOutlineLocationMarker className="w-4 h-4" />}
                                        <span>{apt.type === 'video' ? 'Video Consultation' : apt.type === 'phone' ? 'Audio Call' : 'In-Person Visit'}</span>
                                    </div>
                                    {/* Show other side's name for context */}
                                    {isDoctor && apt.patientId && (
                                        <div className="info-row">
                                            <HiOutlineUser className="w-4 h-4" />
                                            <span>Patient: {apt.patientId?.userId?.name}</span>
                                        </div>
                                    )}
                                    {!isDoctor && apt.doctorId && (
                                        <div className="info-row">
                                            <HiOutlineUser className="w-4 h-4" />
                                            <span>Doctor: {apt.doctorId?.userId?.name}</span>
                                        </div>
                                    )}
                                    {apt.reason && <p className="appointment-reason">{apt.reason}</p>}
                                </div>
                                <div className="appointment-card-actions">
                                    {(apt.type === 'video' || apt.type === 'phone') && apt.status !== 'cancelled' && apt.status !== 'completed' && new Date(apt.dateTime).toDateString() === new Date().toDateString() && (
                                        <button
                                            onClick={() => navigate(apt.type === 'video' ? '/video-consultation' : '/audio-consultation', {
                                                state: {
                                                    appointmentId: apt._id,
                                                    channelName: `apt_${apt._id}`,
                                                    uid: user._id,
                                                    remoteUserName: primaryName
                                                }
                                            })}
                                            className="btn-primary py-1 px-3 text-sm flex items-center justify-center bg-cyan"
                                        >
                                            {apt.type === 'video' ? <HiOutlineVideoCamera className="w-4 h-4 mr-1" /> : <HiOutlinePhone className="w-4 h-4 mr-1" />}
                                            Join Call
                                        </button>
                                    )}
                                    {(apt.status === 'scheduled' || apt.status === 'pending') && (
                                        <button className="btn-sm btn-danger-sm" onClick={() => handleCancel(apt._id)}>Cancel</button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Booking Modal */}
            {showBooking && (
                <div className="modal-overlay" onClick={() => setShowBooking(false)}>
                    <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Book New Appointment</h2>
                            <button className="modal-close" onClick={() => setShowBooking(false)}>
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleBook} className="modal-body">

                            {/* DOCTOR view: searchable patient dropdown */}
                            {isDoctor && (
                                <div className="form-group" ref={dropdownRef}>
                                    <label>Select Patient</label>
                                    <div style={{ position: 'relative' }}>
                                        <HiOutlineSearch style={{
                                            position: 'absolute', left: 12, top: '50%',
                                            transform: 'translateY(-50%)', color: '#64748b', zIndex: 1
                                        }} />
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={bookingData.patientId
                                                ? patients.find(p => p._id === bookingData.patientId)?.userId?.name
                                                : 'Search patients...'}
                                            value={searchQuery}
                                            onFocus={() => setDropdownOpen(true)}
                                            onChange={e => { setSearchQuery(e.target.value); setDropdownOpen(true); setBookingData({ ...bookingData, patientId: '' }); }}
                                            style={{ paddingLeft: 36, paddingRight: 36 }}
                                            autoComplete="off"
                                        />
                                        <HiOutlineChevronDown style={{
                                            position: 'absolute', right: 12, top: '50%',
                                            transform: `translateY(-50%) rotate(${dropdownOpen ? 180 : 0}deg)`,
                                            color: '#64748b', transition: 'transform 0.2s', cursor: 'pointer'
                                        }} onClick={() => setDropdownOpen(o => !o)} />

                                        {dropdownOpen && (
                                            <div style={{
                                                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                                background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
                                                maxHeight: 220, overflowY: 'auto', zIndex: 999,
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                                            }}>
                                                {filteredSearch(patients).length === 0 ? (
                                                    <div style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.875rem' }}>No patients found</div>
                                                ) : filteredSearch(patients).map(pat => (
                                                    <div
                                                        key={pat._id}
                                                        onMouseDown={() => {
                                                            setBookingData({ ...bookingData, patientId: pat._id });
                                                            setSearchQuery('');
                                                            setDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            padding: '10px 16px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                            background: bookingData.patientId === pat._id ? '#0ea5e920' : 'transparent',
                                                            borderLeft: bookingData.patientId === pat._id ? '3px solid #0ea5e9' : '3px solid transparent',
                                                            transition: 'background 0.15s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#ffffff10'}
                                                        onMouseLeave={e => e.currentTarget.style.background = bookingData.patientId === pat._id ? '#0ea5e920' : 'transparent'}
                                                    >
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: '50%',
                                                            background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                                                        }}>{pat.userId?.name?.charAt(0)}</div>
                                                        <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{pat.userId?.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {bookingData.patientId && (
                                        <p style={{ marginTop: 6, color: '#10b981', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            ✓ Selected: <strong>{patients.find(p => p._id === bookingData.patientId)?.userId?.name}</strong>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* PATIENT view: searchable doctor dropdown */}
                            {!isDoctor && (
                                <div className="form-group" ref={dropdownRef}>
                                    <label>Select Doctor</label>
                                    <div style={{ position: 'relative' }}>
                                        <HiOutlineSearch style={{
                                            position: 'absolute', left: 12, top: '50%',
                                            transform: 'translateY(-50%)', color: '#64748b', zIndex: 1
                                        }} />
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={bookingData.doctorId
                                                ? doctors.find(d => d._id === bookingData.doctorId)?.userId?.name
                                                : 'Search doctors...'}
                                            value={searchQuery}
                                            onFocus={() => setDropdownOpen(true)}
                                            onChange={e => { setSearchQuery(e.target.value); setDropdownOpen(true); setBookingData({ ...bookingData, doctorId: '' }); }}
                                            style={{ paddingLeft: 36, paddingRight: 36 }}
                                            autoComplete="off"
                                        />
                                        <HiOutlineChevronDown style={{
                                            position: 'absolute', right: 12, top: '50%',
                                            transform: `translateY(-50%) rotate(${dropdownOpen ? 180 : 0}deg)`,
                                            color: '#64748b', transition: 'transform 0.2s', cursor: 'pointer'
                                        }} onClick={() => setDropdownOpen(o => !o)} />

                                        {dropdownOpen && (
                                            <div style={{
                                                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                                background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
                                                maxHeight: 220, overflowY: 'auto', zIndex: 999,
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                                            }}>
                                                {filteredSearch(doctors).length === 0 ? (
                                                    <div style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.875rem' }}>No doctors found</div>
                                                ) : filteredSearch(doctors).map(doc => (
                                                    <div
                                                        key={doc._id}
                                                        onMouseDown={() => {
                                                            setBookingData({ ...bookingData, doctorId: doc._id });
                                                            setSearchQuery('');
                                                            setDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            padding: '10px 16px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                            background: bookingData.doctorId === doc._id ? '#0ea5e920' : 'transparent',
                                                            borderLeft: bookingData.doctorId === doc._id ? '3px solid #0ea5e9' : '3px solid transparent',
                                                            transition: 'background 0.15s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#ffffff10'}
                                                        onMouseLeave={e => e.currentTarget.style.background = bookingData.doctorId === doc._id ? '#0ea5e920' : 'transparent'}
                                                    >
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: '50%',
                                                            background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                                                        }}>{doc.userId?.name?.charAt(0)}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500 }}>{doc.userId?.name}</div>
                                                            <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{doc.specialization} · ₹{doc.consultationFee}</div>
                                                        </div>
                                                        {doc.rating?.average && (
                                                            <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>⭐ {doc.rating.average}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {bookingData.doctorId && (
                                        <p style={{ marginTop: 6, color: '#10b981', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            ✓ Selected: <strong>{doctors.find(d => d._id === bookingData.doctorId)?.userId?.name}</strong>
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date &amp; Time</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={bookingData.dateTime}
                                        onChange={e => setBookingData({ ...bookingData, dateTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Consultation Type</label>
                                    <select className="form-select"
                                        value={bookingData.type}
                                        onChange={e => setBookingData({ ...bookingData, type: e.target.value })}>
                                        <option value="in-person">🏥 In-Person</option>
                                        <option value="video">📹 Video Call</option>
                                        <option value="phone">📞 Phone</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{isDoctor ? 'Remarks / Notes' : 'Reason for Visit'}</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={isDoctor ? 'Add any notes for this appointment...' : 'Brief description of your concern...'}
                                    value={isDoctor ? bookingData.remarks : bookingData.reason}
                                    onChange={e => setBookingData(isDoctor
                                        ? { ...bookingData, remarks: e.target.value }
                                        : { ...bookingData, reason: e.target.value }
                                    )}
                                />
                            </div>

                            {!isDoctor && (
                                <div className="form-group">
                                    <label>Symptoms (comma separated)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., headache, fever, fatigue"
                                        value={bookingData.symptoms}
                                        onChange={e => setBookingData({ ...bookingData, symptoms: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowBooking(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">✓ Confirm Booking</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointments;
