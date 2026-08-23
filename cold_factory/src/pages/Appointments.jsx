import { useState, useEffect, useRef } from 'react';

import {
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineVideoCamera,
    HiOutlinePhone,
    HiOutlineLocationMarker,
    HiOutlinePlus,
    HiOutlineX,
    HiOutlineUser,
    HiOutlineSearch,
    HiOutlineChevronDown
} from 'react-icons/hi';

import toast from 'react-hot-toast';

import {
    appointmentAPI,
    doctorAPI,
    patientAPI,
    paymentAPI
} from '../services/api';

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
    scheduled: '#f59e0b',
    confirmed: '#06b6d4',
    'in-progress': '#8b5cf6',
    completed: '#10b981',
    cancelled: '#ef4444',
    'no-show': '#6b7280',
    pending: '#f59e0b'
};

const Appointments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isDoctor = user?.role === 'doctor';

    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);

    const [showBooking, setShowBooking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);

    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);

    const [bookingData, setBookingData] = useState({
        doctorId: '',
        patientId: '',
        dateTime: '',
        type: 'in-person',
        reason: '',
        remarks: '',
        symptoms: ''
    });

    // =========================================================
    // SELECTED DOCTOR + FEE
    // =========================================================

    const selectedDoctor = doctors.find(
        (doctor) => doctor._id === bookingData.doctorId
    );

    const consultationFee = Number(
        selectedDoctor?.consultationFee || 500
    );

    // =========================================================
    // FETCH DATA
    // =========================================================

    useEffect(() => {
        fetchData();
    }, [isDoctor]);

    // =========================================================
    // CLOSE DROPDOWN
    // =========================================================

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener(
            'mousedown',
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
        };
    }, []);

    // =========================================================
    // FETCH APPOINTMENTS + DOCTORS/PATIENTS
    // =========================================================

    const fetchData = async () => {
        setLoading(true);

        try {
            const requests = [
                appointmentAPI.getAll()
            ];

            if (isDoctor) {
                requests.push(patientAPI.getAll());
            } else {
                requests.push(doctorAPI.getAll());
            }

            const [appointmentResponse, listResponse] =
                await Promise.all(requests);

            setAppointments(
                appointmentResponse.data?.data || []
            );

            if (isDoctor) {
                setPatients(
                    listResponse.data?.data || []
                );
            } else {
                setDoctors(
                    listResponse.data?.data || []
                );
            }

        } catch (error) {
            console.error(
                'Failed to load appointment data:',
                error
            );

            setAppointments([]);

            if (isDoctor) {
                setPatients([]);
            } else {
                setDoctors([]);
            }

            toast.error(
                error.response?.data?.message ||
                'Failed to load appointments'
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // RESET BOOKING FORM
    // =========================================================

    const resetBookingForm = () => {
        setBookingData({
            doctorId: '',
            patientId: '',
            dateTime: '',
            type: 'in-person',
            reason: '',
            remarks: '',
            symptoms: ''
        });

        setSearchQuery('');
        setDropdownOpen(false);
    };

    // =========================================================
    // OPEN RAZORPAY
    // =========================================================

    const openRazorpay = async (appointment) => {
        try {
            if (!window.Razorpay) {
                throw new Error(
                    'Razorpay Checkout is not loaded. Please refresh the page.'
                );
            }

            setPaymentLoading(true);

            toast.loading(
                'Creating payment order...',
                {
                    id: 'payment-loading'
                }
            );

            // -------------------------------------------------
            // CREATE RAZORPAY ORDER
            // -------------------------------------------------

            const orderResponse =
                await paymentAPI.createOrder({
                    appointmentId: appointment._id
                });

            toast.dismiss('payment-loading');

            const order =
                orderResponse.data?.data;

            if (!order?.orderId) {
                throw new Error(
                    'Razorpay order was not created'
                );
            }

            console.log(
                'RAZORPAY ORDER:',
                order
            );

            // -------------------------------------------------
            // RAZORPAY OPTIONS
            // -------------------------------------------------

            const options = {
                key: order.keyId,

                amount: order.amount,

                currency:
                    order.currency || 'INR',

                name: 'MediCare',

                description:
                    'Medical Consultation',

                order_id:
                    order.orderId,

                prefill: {
                    name: user?.name || '',
                    email: user?.email || ''
                },

                notes: {
                    appointmentId:
                        appointment._id
                },

                theme: {
                    color: '#0ea5e9'
                },

                handler: async (response) => {
                    try {
                        console.log(
                            'RAZORPAY RESPONSE:',
                            response
                        );

                        toast.loading(
                            'Verifying payment...',
                            {
                                id: 'verify-payment'
                            }
                        );

                        // -----------------------------------------
                        // VERIFY PAYMENT
                        // -----------------------------------------

                        const verifyResponse =
                            await paymentAPI.verify({
                                appointmentId:
                                    appointment._id,

                                razorpay_order_id:
                                    response.razorpay_order_id,

                                razorpay_payment_id:
                                    response.razorpay_payment_id,

                                razorpay_signature:
                                    response.razorpay_signature
                            });

                        toast.dismiss(
                            'verify-payment'
                        );

                        if (
                            !verifyResponse.data?.success
                        ) {
                            throw new Error(
                                verifyResponse.data?.message ||
                                'Payment verification failed'
                            );
                        }

                        toast.success(
                            'Payment successful! Appointment confirmed.'
                        );

                        setShowBooking(false);

                        resetBookingForm();

                        await fetchData();

                    } catch (error) {
                        toast.dismiss(
                            'verify-payment'
                        );

                        console.error(
                            'Payment verification error:',
                            error
                        );

                        toast.error(
                            error.response?.data?.message ||
                            error.message ||
                            'Payment verification failed'
                        );
                    } finally {
                        setPaymentLoading(false);
                    }
                },

                modal: {
                    ondismiss: () => {
                        setPaymentLoading(false);

                        toast.error(
                            'Payment cancelled. Appointment remains unpaid.'
                        );
                    }
                }
            };

            const razorpay =
                new window.Razorpay(options);

            // -------------------------------------------------
            // PAYMENT FAILED
            // -------------------------------------------------

            razorpay.on(
                'payment.failed',
                (response) => {
                    console.error(
                        'RAZORPAY PAYMENT FAILED:',
                        response
                    );

                    setPaymentLoading(false);

                    toast.error(
                        response.error?.description ||
                        'Payment failed'
                    );
                }
            );

            razorpay.open();

        } catch (error) {
            toast.dismiss(
                'payment-loading'
            );

            setPaymentLoading(false);

            console.error(
                'Razorpay error:',
                error
            );

            toast.error(
                error.response?.data?.message ||
                error.message ||
                'Unable to start payment'
            );
        }
    };

    // =========================================================
    // BOOK APPOINTMENT
    // =========================================================

    const handleBook = async (e) => {
        e.preventDefault();

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!isDoctor && !bookingData.doctorId) {
            toast.error(
                'Please select a doctor'
            );
            return;
        }

        if (isDoctor && !bookingData.patientId) {
            toast.error(
                'Please select a patient'
            );
            return;
        }

        if (!bookingData.dateTime) {
            toast.error(
                'Please select date and time'
            );
            return;
        }

        // -------------------------------------------------
        // BUILD PAYLOAD
        // -------------------------------------------------

        const payload = {
            dateTime: bookingData.dateTime,

            type: bookingData.type,

            reason:
                bookingData.reason ||
                bookingData.remarks,

            symptoms: bookingData.symptoms
                ? bookingData.symptoms
                    .split(',')
                    .map((symptom) =>
                        symptom.trim()
                    )
                    .filter(Boolean)
                : []
        };

        if (!isDoctor) {
            payload.doctorId =
                bookingData.doctorId;
        }

        if (isDoctor) {
            payload.patientId =
                bookingData.patientId;
        }

        try {
            setPaymentLoading(true);

            // -------------------------------------------------
            // CREATE APPOINTMENT
            // -------------------------------------------------

            toast.loading(
                'Creating appointment...',
                {
                    id: 'appointment-loading'
                }
            );

            const appointmentResponse =
                await appointmentAPI.create(
                    payload
                );

            toast.dismiss(
                'appointment-loading'
            );

            const appointment =
                appointmentResponse.data?.data;

            if (!appointment?._id) {
                throw new Error(
                    'Appointment was not created'
                );
            }

            console.log(
                'CREATED APPOINTMENT:',
                appointment
            );

            // -------------------------------------------------
            // CLOSE BOOKING MODAL
            // -------------------------------------------------

            setShowBooking(false);

            // -------------------------------------------------
            // OPEN RAZORPAY
            // -------------------------------------------------

            await openRazorpay(
                appointment
            );

        } catch (error) {
            toast.dismiss(
                'appointment-loading'
            );

            setPaymentLoading(false);

            console.error(
                'Booking error:',
                error
            );

            toast.error(
                error.response?.data?.message ||
                error.message ||
                'Failed to create appointment'
            );
        }
    };

    // =========================================================
    // CANCEL APPOINTMENT
    // =========================================================

    const handleCancel = async (id) => {
        try {
            await appointmentAPI.cancel(id);

            toast.success(
                'Appointment cancelled'
            );

            await fetchData();

        } catch (error) {
            console.error(
                'Cancel error:',
                error
            );

            toast.error(
                error.response?.data?.message ||
                'Failed to cancel appointment'
            );
        }
    };

    // =========================================================
    // CALENDAR
    // =========================================================

    const generateCalendarDays = () => {
        const today = new Date();

        return Array.from(
            { length: 14 },
            (_, index) => {
                const date =
                    new Date(today);

                date.setDate(
                    today.getDate() +
                    index -
                    2
                );

                return date;
            }
        );
    };

    // =========================================================
    // SEARCH
    // =========================================================

    const filteredSearch = (list) => {
        return list.filter((item) =>
            item.userId?.name
                ?.toLowerCase()
                .includes(
                    searchQuery.toLowerCase()
                )
        );
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
            </div>
        );
    }

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="appointments-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="page-header">

                <div>
                    <h1 className="page-title">
                        Appointments
                    </h1>

                    <p className="page-subtitle">
                        {isDoctor
                            ? 'Manage your patient appointments'
                            : 'Manage your medical appointments'}
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={() =>
                        setShowBooking(true)
                    }
                    disabled={paymentLoading}
                >
                    <HiOutlinePlus className="w-5 h-5" />

                    <span>
                        Book Appointment
                    </span>
                </button>

            </div>

            {/* =================================================
                CALENDAR
            ================================================= */}

            <div className="calendar-strip">

                {generateCalendarDays().map(
                    (day, index) => {

                        const dateString =
                            day
                                .toISOString()
                                .split('T')[0];

                        const isSelected =
                            dateString ===
                            selectedDate;

                        const isToday =
                            day.toDateString() ===
                            new Date()
                                .toDateString();

                        const hasAppointment =
                            appointments.some(
                                (appointment) =>
                                    new Date(
                                        appointment.dateTime
                                    ).toDateString() ===
                                    day.toDateString()
                            );

                        return (
                            <button
                                key={index}
                                className={
                                    `calendar-day ${
                                        isSelected
                                            ? 'selected'
                                            : ''
                                    } ${
                                        isToday
                                            ? 'today'
                                            : ''
                                    }`
                                }
                                onClick={() =>
                                    setSelectedDate(
                                        dateString
                                    )
                                }
                            >

                                <span className="calendar-day-name">
                                    {day.toLocaleDateString(
                                        'en',
                                        {
                                            weekday:
                                                'short'
                                        }
                                    )}
                                </span>

                                <span className="calendar-day-num">
                                    {day.getDate()}
                                </span>

                                {hasAppointment && (
                                    <span className="calendar-dot"></span>
                                )}

                            </button>
                        );
                    }
                )}

            </div>

            {/* =================================================
                APPOINTMENTS
            ================================================= */}

            <div className="appointments-grid">

                {appointments.filter(
                    (appointment) =>
                        appointment.dateTime.split('T')[0] ===
                        selectedDate
                ).length === 0 ? (

                    <div className="empty-state">

                        <HiOutlineCalendar className="w-16 h-16 text-slate-600 mx-auto" />

                        <h3>
                            No Appointments
                        </h3>

                        <p>
                            No appointments scheduled for this date
                        </p>

                    </div>

                ) : (

                    appointments
                        .filter(
                            (appointment) =>
                                appointment.dateTime.split('T')[0] ===
                                selectedDate
                        )
                        .map((appointment) => {

                            const primaryName =
                                isDoctor
                                    ? (
                                        appointment
                                            .patientId
                                            ?.userId
                                            ?.name ||
                                        'Patient'
                                    )
                                    : (
                                        appointment
                                            .doctorId
                                            ?.userId
                                            ?.name ||
                                        'Doctor'
                                    );

                            const primarySub =
                                isDoctor
                                    ? 'Patient'
                                    : (
                                        appointment
                                            .doctorId
                                            ?.specialization ||
                                        'Specialist'
                                    );

                            return (
                                <div
                                    key={
                                        appointment._id
                                    }
                                    className="appointment-card"
                                >

                                    {/* CARD HEADER */}

                                    <div className="appointment-card-header">

                                        <div className="appointment-card-avatar">
                                            {primaryName.charAt(0)}
                                        </div>

                                        <div>
                                            <h3>
                                                {primaryName}
                                            </h3>

                                            <p
                                                className="text-sm"
                                                style={{
                                                    color:
                                                        '#94a3b8'
                                                }}
                                            >
                                                {primarySub}
                                            </p>
                                        </div>

                                        <span
                                            className="status-badge"
                                            style={{
                                                '--badge-color':
                                                    STATUS_COLORS[
                                                        appointment.status
                                                    ]
                                            }}
                                        >
                                            {appointment.status}
                                        </span>

                                    </div>

                                    {/* CARD BODY */}

                                    <div className="appointment-card-body">

                                        <div className="info-row">

                                            <HiOutlineCalendar className="w-4 h-4" />

                                            <span>
                                                {new Date(
                                                    appointment.dateTime
                                                ).toLocaleDateString(
                                                    'en',
                                                    {
                                                        dateStyle:
                                                            'medium'
                                                    }
                                                )}
                                            </span>

                                        </div>

                                        <div className="info-row">

                                            <HiOutlineClock className="w-4 h-4" />

                                            <span>
                                                {new Date(
                                                    appointment.dateTime
                                                ).toLocaleTimeString(
                                                    'en',
                                                    {
                                                        timeStyle:
                                                            'short'
                                                    }
                                                )}
                                            </span>

                                        </div>

                                        <div className="info-row">

                                            {appointment.type === 'video'
                                                ? (
                                                    <HiOutlineVideoCamera className="w-4 h-4" />
                                                )
                                                : appointment.type === 'phone'
                                                    ? (
                                                        <HiOutlinePhone className="w-4 h-4" />
                                                    )
                                                    : (
                                                        <HiOutlineLocationMarker className="w-4 h-4" />
                                                    )}

                                            <span>
                                                {appointment.type === 'video'
                                                    ? 'Video Consultation'
                                                    : appointment.type === 'phone'
                                                        ? 'Audio Call'
                                                        : 'In-Person Visit'}
                                            </span>

                                        </div>

                                        {isDoctor &&
                                            appointment.patientId && (
                                                <div className="info-row">

                                                    <HiOutlineUser className="w-4 h-4" />

                                                    <span>
                                                        Patient:{' '}
                                                        {
                                                            appointment
                                                                .patientId
                                                                ?.userId
                                                                ?.name
                                                        }
                                                    </span>

                                                </div>
                                            )}

                                        {!isDoctor &&
                                            appointment.doctorId && (
                                                <div className="info-row">

                                                    <HiOutlineUser className="w-4 h-4" />

                                                    <span>
                                                        Doctor:{' '}
                                                        {
                                                            appointment
                                                                .doctorId
                                                                ?.userId
                                                                ?.name
                                                        }
                                                    </span>

                                                </div>
                                            )}

                                        {appointment.reason && (
                                            <p className="appointment-reason">
                                                {appointment.reason}
                                            </p>
                                        )}

                                        {/* PAYMENT STATUS */}

                                        {!isDoctor && (
                                            <div
                                                style={{
                                                    marginTop: 12,
                                                    padding:
                                                        '8px 12px',
                                                    borderRadius:
                                                        8,
                                                    background:
                                                        appointment.payment?.status === 'paid'
                                                            ? '#10b98115'
                                                            : '#f59e0b15',
                                                    color:
                                                        appointment.payment?.status === 'paid'
                                                            ? '#10b981'
                                                            : '#f59e0b',
                                                    fontSize:
                                                        '0.85rem'
                                                }}
                                            >
                                                Payment:{' '}
                                                <strong>
                                                    {appointment.payment?.status === 'paid'
                                                        ? 'Paid'
                                                        : 'Pending'}
                                                </strong>

                                                {appointment.payment?.amount && (
                                                    <>
                                                        {' · ₹'}
                                                        {
                                                            appointment
                                                                .payment
                                                                .amount
                                                        }
                                                    </>
                                                )}
                                            </div>
                                        )}

                                    </div>

                                    {/* CARD ACTIONS */}

                                    <div className="appointment-card-actions">

                                        {(
                                            appointment.type === 'video' ||
                                            appointment.type === 'phone'
                                        ) &&
                                            appointment.status !== 'cancelled' &&
                                            appointment.status !== 'completed' &&
                                            appointment.payment?.status === 'paid' &&
                                            new Date(
                                                appointment.dateTime
                                            ).toDateString() ===
                                            new Date().toDateString() && (

                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            appointment.type === 'video'
                                                                ? '/video-consultation'
                                                                : '/audio-consultation',
                                                            {
                                                                state: {
                                                                    appointmentId:
                                                                        appointment._id,
                                                                    channelName:
                                                                        `apt_${appointment._id}`,
                                                                    uid:
                                                                        user._id,
                                                                    remoteUserName:
                                                                        primaryName
                                                                }
                                                            }
                                                        )
                                                    }
                                                    className="btn-primary py-1 px-3 text-sm flex items-center justify-center bg-cyan"
                                                >

                                                    {appointment.type === 'video'
                                                        ? (
                                                            <HiOutlineVideoCamera className="w-4 h-4 mr-1" />
                                                        )
                                                        : (
                                                            <HiOutlinePhone className="w-4 h-4 mr-1" />
                                                        )}

                                                    Join Call

                                                </button>
                                            )}

                                        {(appointment.status === 'scheduled' ||
                                            appointment.status === 'pending') && (

                                                <button
                                                    className="btn-sm btn-danger-sm"
                                                    onClick={() =>
                                                        handleCancel(
                                                            appointment._id
                                                        )
                                                    }
                                                >
                                                    Cancel
                                                </button>
                                            )}

                                    </div>

                                </div>
                            );
                        })
                )}

            </div>

            {/* =================================================
                BOOKING MODAL
            ================================================= */}

            {showBooking && (

                <div
                    className="modal-overlay"
                    onClick={() => {
                        if (!paymentLoading) {
                            setShowBooking(false);
                        }
                    }}
                >

                    <div
                        className="modal-content modal-lg"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="modal-header">

                            <h2>
                                Book New Appointment
                            </h2>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowBooking(false)
                                }
                                disabled={paymentLoading}
                            >
                                <HiOutlineX className="w-5 h-5" />
                            </button>

                        </div>

                        {/* MODAL FORM */}

                        <form
                            onSubmit={handleBook}
                            className="modal-body"
                        >

                            {/* =================================================
                                SELECT PATIENT — DOCTOR
                            ================================================= */}

                            {isDoctor && (

                                <div
                                    className="form-group"
                                    ref={dropdownRef}
                                >

                                    <label>
                                        Select Patient
                                    </label>

                                    <div
                                        style={{
                                            position:
                                                'relative'
                                        }}
                                    >

                                        <HiOutlineSearch
                                            style={{
                                                position:
                                                    'absolute',
                                                left: 12,
                                                top: '50%',
                                                transform:
                                                    'translateY(-50%)',
                                                color:
                                                    '#64748b',
                                                zIndex: 1
                                            }}
                                        />

                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={
                                                bookingData.patientId
                                                    ? patients.find(
                                                        (patient) =>
                                                            patient._id ===
                                                            bookingData.patientId
                                                    )?.userId
                                                        ?.name
                                                    : 'Search patients...'
                                            }
                                            value={
                                                searchQuery
                                            }
                                            onFocus={() =>
                                                setDropdownOpen(
                                                    true
                                                )
                                            }
                                            onChange={(e) => {

                                                setSearchQuery(
                                                    e.target.value
                                                );

                                                setDropdownOpen(
                                                    true
                                                );

                                                setBookingData({
                                                    ...bookingData,
                                                    patientId:
                                                        ''
                                                });

                                            }}
                                            style={{
                                                paddingLeft:
                                                    36,
                                                paddingRight:
                                                    36
                                            }}
                                            autoComplete="off"
                                        />

                                        <HiOutlineChevronDown
                                            style={{
                                                position:
                                                    'absolute',
                                                right: 12,
                                                top: '50%',
                                                transform:
                                                    `translateY(-50%) rotate(${
                                                        dropdownOpen
                                                            ? 180
                                                            : 0
                                                    }deg)`,
                                                color:
                                                    '#64748b',
                                                cursor:
                                                    'pointer'
                                            }}
                                            onClick={() =>
                                                setDropdownOpen(
                                                    (open) =>
                                                        !open
                                                )
                                            }
                                        />

                                        {dropdownOpen && (

                                            <div
                                                style={{
                                                    position:
                                                        'absolute',
                                                    top:
                                                        'calc(100% + 4px)',
                                                    left: 0,
                                                    right: 0,
                                                    background:
                                                        '#1e293b',
                                                    border:
                                                        '1px solid #334155',
                                                    borderRadius:
                                                        10,
                                                    maxHeight:
                                                        220,
                                                    overflowY:
                                                        'auto',
                                                    zIndex:
                                                        999,
                                                    boxShadow:
                                                        '0 8px 24px rgba(0,0,0,0.4)'
                                                }}
                                            >

                                                {filteredSearch(
                                                    patients
                                                ).length === 0 ? (

                                                    <div
                                                        style={{
                                                            padding:
                                                                '12px 16px',
                                                            color:
                                                                '#64748b'
                                                        }}
                                                    >
                                                        No patients found
                                                    </div>

                                                ) : (

                                                    filteredSearch(
                                                        patients
                                                    ).map(
                                                        (patient) => (

                                                            <div
                                                                key={
                                                                    patient._id
                                                                }
                                                                onMouseDown={() => {

                                                                    setBookingData({
                                                                        ...bookingData,
                                                                        patientId:
                                                                            patient._id
                                                                    });

                                                                    setSearchQuery(
                                                                        ''
                                                                    );

                                                                    setDropdownOpen(
                                                                        false
                                                                    );

                                                                }}
                                                                style={{
                                                                    padding:
                                                                        '10px 16px',
                                                                    cursor:
                                                                        'pointer',
                                                                    display:
                                                                        'flex',
                                                                    alignItems:
                                                                        'center',
                                                                    gap: 10
                                                                }}
                                                            >

                                                                <div
                                                                    style={{
                                                                        width:
                                                                            32,
                                                                        height:
                                                                            32,
                                                                        borderRadius:
                                                                            '50%',
                                                                        background:
                                                                            'linear-gradient(135deg,#0ea5e9,#6366f1)',
                                                                        display:
                                                                            'flex',
                                                                        alignItems:
                                                                            'center',
                                                                        justifyContent:
                                                                            'center',
                                                                        color:
                                                                            '#fff',
                                                                        fontWeight:
                                                                            700
                                                                    }}
                                                                >
                                                                    {patient.userId?.name?.charAt(0)}
                                                                </div>

                                                                <span
                                                                    style={{
                                                                        color:
                                                                            '#e2e8f0'
                                                                    }}
                                                                >
                                                                    {
                                                                        patient
                                                                            .userId
                                                                            ?.name
                                                                    }
                                                                </span>

                                                            </div>

                                                        )
                                                    )

                                                )}

                                            </div>
                                        )}

                                    </div>

                                    {bookingData.patientId && (

                                        <p
                                            style={{
                                                marginTop: 6,
                                                color:
                                                    '#10b981',
                                                fontSize:
                                                    '0.82rem'
                                            }}
                                        >
                                            ✓ Selected:{' '}

                                            <strong>
                                                {
                                                    patients.find(
                                                        (patient) =>
                                                            patient._id ===
                                                            bookingData.patientId
                                                    )?.userId
                                                        ?.name
                                                }
                                            </strong>
                                        </p>
                                    )}

                                </div>
                            )}

                            {/* =================================================
                                SELECT DOCTOR — PATIENT
                            ================================================= */}

                            {!isDoctor && (

                                <div
                                    className="form-group"
                                    ref={dropdownRef}
                                >

                                    <label>
                                        Select Doctor
                                    </label>

                                    <div
                                        style={{
                                            position:
                                                'relative'
                                        }}
                                    >

                                        <HiOutlineSearch
                                            style={{
                                                position:
                                                    'absolute',
                                                left: 12,
                                                top: '50%',
                                                transform:
                                                    'translateY(-50%)',
                                                color:
                                                    '#64748b',
                                                zIndex: 1
                                            }}
                                        />

                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder={
                                                bookingData.doctorId
                                                    ? selectedDoctor
                                                        ?.userId
                                                        ?.name
                                                    : 'Search doctors...'
                                            }
                                            value={
                                                searchQuery
                                            }
                                            onFocus={() =>
                                                setDropdownOpen(
                                                    true
                                                )
                                            }
                                            onChange={(e) => {

                                                setSearchQuery(
                                                    e.target.value
                                                );

                                                setDropdownOpen(
                                                    true
                                                );

                                                setBookingData({
                                                    ...bookingData,
                                                    doctorId:
                                                        ''
                                                });

                                            }}
                                            style={{
                                                paddingLeft:
                                                    36,
                                                paddingRight:
                                                    36
                                            }}
                                            autoComplete="off"
                                        />

                                        <HiOutlineChevronDown
                                            style={{
                                                position:
                                                    'absolute',
                                                right: 12,
                                                top: '50%',
                                                transform:
                                                    `translateY(-50%) rotate(${
                                                        dropdownOpen
                                                            ? 180
                                                            : 0
                                                    }deg)`,
                                                color:
                                                    '#64748b',
                                                cursor:
                                                    'pointer'
                                            }}
                                            onClick={() =>
                                                setDropdownOpen(
                                                    (open) =>
                                                        !open
                                                )
                                            }
                                        />

                                        {dropdownOpen && (

                                            <div
                                                style={{
                                                    position:
                                                        'absolute',
                                                    top:
                                                        'calc(100% + 4px)',
                                                    left: 0,
                                                    right: 0,
                                                    background:
                                                        '#1e293b',
                                                    border:
                                                        '1px solid #334155',
                                                    borderRadius:
                                                        10,
                                                    maxHeight:
                                                        220,
                                                    overflowY:
                                                        'auto',
                                                    zIndex:
                                                        999,
                                                    boxShadow:
                                                        '0 8px 24px rgba(0,0,0,0.4)'
                                                }}
                                            >

                                                {filteredSearch(
                                                    doctors
                                                ).length === 0 ? (

                                                    <div
                                                        style={{
                                                            padding:
                                                                '12px 16px',
                                                            color:
                                                                '#64748b'
                                                        }}
                                                    >
                                                        No doctors found
                                                    </div>

                                                ) : (

                                                    filteredSearch(
                                                        doctors
                                                    ).map(
                                                        (doctor) => (

                                                            <div
                                                                key={
                                                                    doctor._id
                                                                }
                                                                onMouseDown={() => {

                                                                    setBookingData({
                                                                        ...bookingData,
                                                                        doctorId:
                                                                            doctor._id
                                                                    });

                                                                    setSearchQuery(
                                                                        ''
                                                                    );

                                                                    setDropdownOpen(
                                                                        false
                                                                    );

                                                                }}
                                                                style={{
                                                                    padding:
                                                                        '10px 16px',
                                                                    cursor:
                                                                        'pointer',
                                                                    display:
                                                                        'flex',
                                                                    alignItems:
                                                                        'center',
                                                                    gap: 10
                                                                }}
                                                            >

                                                                <div
                                                                    style={{
                                                                        width:
                                                                            36,
                                                                        height:
                                                                            36,
                                                                        borderRadius:
                                                                            '50%',
                                                                        background:
                                                                            'linear-gradient(135deg,#0ea5e9,#6366f1)',
                                                                        display:
                                                                            'flex',
                                                                        alignItems:
                                                                            'center',
                                                                        justifyContent:
                                                                            'center',
                                                                        color:
                                                                            '#fff',
                                                                        fontWeight:
                                                                            700
                                                                    }}
                                                                >
                                                                    {doctor.userId?.name?.charAt(0)}
                                                                </div>

                                                                <div
                                                                    style={{
                                                                        flex:
                                                                            1
                                                                    }}
                                                                >

                                                                    <div
                                                                        style={{
                                                                            color:
                                                                                '#e2e8f0',
                                                                            fontSize:
                                                                                '0.9rem',
                                                                            fontWeight:
                                                                                500
                                                                        }}
                                                                    >
                                                                        {
                                                                            doctor
                                                                                .userId
                                                                                ?.name
                                                                        }
                                                                    </div>

                                                                    <div
                                                                        style={{
                                                                            color:
                                                                                '#94a3b8',
                                                                            fontSize:
                                                                                '0.78rem'
                                                                        }}
                                                                    >
                                                                        {
                                                                            doctor.specialization
                                                                        }

                                                                        {' · ₹'}

                                                                        {
                                                                            doctor.consultationFee ||
                                                                            500
                                                                        }

                                                                    </div>

                                                                </div>

                                                                {doctor.rating?.average && (

                                                                    <span
                                                                        style={{
                                                                            color:
                                                                                '#f59e0b',
                                                                            fontSize:
                                                                                '0.8rem',
                                                                            fontWeight:
                                                                                600
                                                                        }}
                                                                    >
                                                                        ⭐{' '}
                                                                        {
                                                                            doctor
                                                                                .rating
                                                                                .average
                                                                        }
                                                                    </span>
                                                                )}

                                                            </div>
                                                        )
                                                    )
                                                )}

                                            </div>
                                        )}

                                    </div>

                                    {bookingData.doctorId && (

                                        <p
                                            style={{
                                                marginTop: 6,
                                                color:
                                                    '#10b981',
                                                fontSize:
                                                    '0.82rem'
                                            }}
                                        >
                                            ✓ Selected:{' '}

                                            <strong>
                                                {
                                                    selectedDoctor
                                                        ?.userId
                                                        ?.name
                                                }
                                            </strong>
                                        </p>
                                    )}

                                </div>
                            )}

                            {/* =================================================
                                DATE + TIME
                            ================================================= */}

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        Date &amp; Time
                                    </label>

                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={
                                            bookingData.dateTime
                                        }
                                        onChange={(e) =>
                                            setBookingData({
                                                ...bookingData,
                                                dateTime:
                                                    e.target.value
                                            })
                                        }
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Consultation Type
                                    </label>

                                    <select
                                        className="form-select"
                                        value={
                                            bookingData.type
                                        }
                                        onChange={(e) =>
                                            setBookingData({
                                                ...bookingData,
                                                type:
                                                    e.target.value
                                            })
                                        }
                                    >

                                        <option value="in-person">
                                            🏥 In-Person
                                        </option>

                                        <option value="video">
                                            📹 Video Call
                                        </option>

                                        <option value="phone">
                                            📞 Phone
                                        </option>

                                    </select>

                                </div>

                            </div>

                            {/* =================================================
                                REASON
                            ================================================= */}

                            <div className="form-group">

                                <label>
                                    {isDoctor
                                        ? 'Remarks / Notes'
                                        : 'Reason for Visit'}
                                </label>

                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={
                                        isDoctor
                                            ? 'Add any notes for this appointment...'
                                            : 'Brief description of your concern...'
                                    }
                                    value={
                                        isDoctor
                                            ? bookingData.remarks
                                            : bookingData.reason
                                    }
                                    onChange={(e) => {

                                        if (isDoctor) {
                                            setBookingData({
                                                ...bookingData,
                                                remarks:
                                                    e.target.value
                                            });
                                        } else {
                                            setBookingData({
                                                ...bookingData,
                                                reason:
                                                    e.target.value
                                            });
                                        }

                                    }}
                                />

                            </div>

                            {/* =================================================
                                SYMPTOMS
                            ================================================= */}

                            {!isDoctor && (

                                <div className="form-group">

                                    <label>
                                        Symptoms
                                        {' '}
                                        (comma separated)
                                    </label>

                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., headache, fever, fatigue"
                                        value={
                                            bookingData.symptoms
                                        }
                                        onChange={(e) =>
                                            setBookingData({
                                                ...bookingData,
                                                symptoms:
                                                    e.target.value
                                            })
                                        }
                                    />

                                </div>
                            )}

                            {/* =================================================
                                PAYMENT SUMMARY
                            ================================================= */}

                            {!isDoctor && (
                                <div
                                    style={{
                                        marginTop: 8,
                                        padding: '16px',
                                        borderRadius: 12,
                                        border:
                                            '1px solid #334155',
                                        background:
                                            '#0f172a'
                                    }}
                                >

                                    <div
                                        style={{
                                            display:
                                                'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems:
                                                'center'
                                        }}
                                    >

                                        <div>

                                            <div
                                                style={{
                                                    color:
                                                        '#94a3b8',
                                                    fontSize:
                                                        '0.85rem'
                                                }}
                                            >
                                                Consultation Fee
                                            </div>

                                            <div
                                                style={{
                                                    color:
                                                        '#e2e8f0',
                                                    fontWeight:
                                                        600,
                                                    marginTop:
                                                        4
                                                }}
                                            >
                                                {selectedDoctor
                                                    ?.userId
                                                    ?.name ||
                                                    'Select a doctor'}
                                            </div>

                                        </div>

                                        <div
                                            style={{
                                                color:
                                                    '#22c55e',
                                                fontSize:
                                                    '1.35rem',
                                                fontWeight:
                                                    700
                                            }}
                                        >
                                            ₹{consultationFee}
                                        </div>

                                    </div>

                                </div>
                            )}

                            {/* =================================================
                                ACTIONS
                            ================================================= */}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() =>
                                        setShowBooking(false)
                                    }
                                    disabled={paymentLoading}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={paymentLoading}
                                >

                                    {paymentLoading ? (
                                        <>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            💳 Pay ₹
                                            {consultationFee}
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
};

export default Appointments;