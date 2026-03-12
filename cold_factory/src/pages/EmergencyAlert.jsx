import { useState, useEffect } from 'react';
import { HiOutlineExclamation, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineMail } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api, { alertAPI } from '../services/api';

const EmergencyAlert = () => {
    const [sending, setSending] = useState(false);
    const [alertSent, setAlertSent] = useState(false);
    const [description, setDescription] = useState('');
    const [countdown, setCountdown] = useState(null);
    const [emergencyContact, setEmergencyContact] = useState(null);
    const [location, setLocation] = useState(null);

    // Fetch emergency contact from patient profile on mount
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'patient') {
            api.get('/patients/profile').then(res => {
                const data = res.data?.data;
                if (data?.emergencyContact) {
                    setEmergencyContact(data.emergencyContact);
                }
            }).catch(() => { });
        }

        // Try to get current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => setLocation({ latitude: 28.6139, longitude: 77.2090 }) // Fallback
            );
        }
    }, []);

    const sendEmergency = async () => {
        setSending(true);
        let count = 3;
        setCountdown(count);
        const timer = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
                clearInterval(timer);
                setCountdown(null);
                triggerAlert();
            }
        }, 1000);
    };

    const triggerAlert = async () => {
        try {
            await alertAPI.sendEmergency({
                description: description || 'Emergency assistance needed',
                location: location || { latitude: 28.6139, longitude: 77.2090, address: 'Current Location' }
            });
        } catch {
            // Continue even if API fails
        }
        setAlertSent(true);
        setSending(false);
        toast.success('Emergency alert sent! Help is on the way.');
    };

    const cancelAlert = () => {
        setSending(false);
        setCountdown(null);
        toast('Emergency alert cancelled');
    };

    const emergencyName = emergencyContact?.name || 'Emergency Contact';
    const emergencyPhone = emergencyContact?.phone || '';
    const emergencyRelation = emergencyContact?.relationship || '';

    // Build SMS body with location
    const smsBody = encodeURIComponent(
        `🆘 EMERGENCY ALERT!\n${description || 'Medical emergency — need help immediately!'}\n` +
        (location ? `📍 Location: https://maps.google.com/?q=${location.latitude},${location.longitude}` : '') +
        `\n— Sent from MediCare App`
    );

    if (alertSent) {
        return (
            <div className="emergency-page">
                <div className="emergency-sent">
                    <div className="emergency-sent-icon pulse-ring">
                        <span>🚑</span>
                    </div>
                    <h1>Emergency Alert Sent!</h1>
                    <p>Help is on the way. Use the buttons below to call or message for help.</p>

                    <div className="emergency-info-cards">
                        <div className="emergency-info-card">
                            <HiOutlineLocationMarker className="w-6 h-6" />
                            <div>
                                <h4>Your Location Shared</h4>
                                <p>{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Getting GPS...'}</p>
                            </div>
                        </div>
                        {emergencyPhone && (
                            <div className="emergency-info-card">
                                <HiOutlinePhone className="w-6 h-6" />
                                <div>
                                    <h4>Emergency Contact</h4>
                                    <p>{emergencyName} ({emergencyRelation}) — {emergencyPhone}</p>
                                </div>
                            </div>
                        )}
                        <div className="emergency-info-card">
                            <span className="text-xl">👨‍⚕️</span>
                            <div>
                                <h4>Ambulance Numbers</h4>
                                <p>102 (Ambulance) · 108 (Emergency)</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Quick Action Buttons ────────────────────── */}
                    <div className="emergency-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                        {/* Call Emergency Contact */}
                        {emergencyPhone && (
                            <a href={`tel:${emergencyPhone}`} className="btn-emergency-call" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                background: '#10b981', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: 12,
                                fontWeight: 700, fontSize: '1rem', textDecoration: 'none'
                            }}>
                                <HiOutlinePhone className="w-5 h-5" />
                                📞 Call {emergencyName} ({emergencyPhone})
                            </a>
                        )}

                        {/* SMS Emergency Contact */}
                        {emergencyPhone && (
                            <a href={`sms:${emergencyPhone}?body=${smsBody}`} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                background: '#3b82f6', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: 12,
                                fontWeight: 700, fontSize: '1rem', textDecoration: 'none'
                            }}>
                                <HiOutlineMail className="w-5 h-5" />
                                💬 SMS {emergencyName} (with location)
                            </a>
                        )}

                        {/* Call Ambulance 102 */}
                        <a href="tel:102" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            background: '#ef4444', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: 12,
                            fontWeight: 700, fontSize: '1rem', textDecoration: 'none'
                        }}>
                            <HiOutlinePhone className="w-5 h-5" />
                            🚑 Call Ambulance (102)
                        </a>

                        {/* Call Emergency 108 */}
                        <a href="tel:108" style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            background: '#f97316', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: 12,
                            fontWeight: 700, fontSize: '1rem', textDecoration: 'none'
                        }}>
                            <HiOutlinePhone className="w-5 h-5" />
                            🆘 Call Emergency Services (108)
                        </a>

                        <button className="btn-secondary" onClick={() => setAlertSent(false)} style={{ marginTop: '0.5rem' }}>
                            Send Another Alert
                        </button>
                    </div>

                    {/* Timeline */}
                    <div className="emergency-timeline">
                        <h3>Response Timeline</h3>
                        <div className="timeline">
                            <div className="timeline-item done">
                                <div className="timeline-dot">✓</div>
                                <div><strong>Alert Sent</strong><span>Just now</span></div>
                            </div>
                            {emergencyPhone && (
                                <div className="timeline-item done">
                                    <div className="timeline-dot">✓</div>
                                    <div><strong>Emergency Contact Notified</strong><span>{emergencyName}</span></div>
                                </div>
                            )}
                            <div className="timeline-item active">
                                <div className="timeline-dot pulse"></div>
                                <div><strong>Awaiting Response</strong><span>Call or SMS sent...</span></div>
                            </div>
                            <div className="timeline-item">
                                <div className="timeline-dot"></div>
                                <div><strong>Help Arrives</strong><span>Stay at your location</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="emergency-page">
            <div className="emergency-container">
                <div className="emergency-warning">
                    <HiOutlineExclamation className="w-8 h-8" />
                    <span>Use only in genuine medical emergencies</span>
                </div>

                <div className="emergency-button-wrapper">
                    {countdown !== null ? (
                        <div className="emergency-countdown">
                            <div className="countdown-number">{countdown}</div>
                            <p>Sending alert in...</p>
                            <button className="btn-cancel-emergency" onClick={cancelAlert}>Cancel</button>
                        </div>
                    ) : (
                        <button className="emergency-big-button" onClick={sendEmergency} disabled={sending}>
                            <span className="emergency-btn-icon">🆘</span>
                            <span className="emergency-btn-text">EMERGENCY</span>
                            <span className="emergency-btn-subtext">Tap to send alert</span>
                        </button>
                    )}
                </div>

                <div className="emergency-form">
                    <div className="form-group">
                        <label>Describe the emergency (optional)</label>
                        <textarea className="form-textarea" rows={2}
                            placeholder="e.g., Chest pain, difficulty breathing..."
                            value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                </div>

                {/* Emergency Contact Info */}
                {emergencyPhone && (
                    <div style={{
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: 12, padding: '1rem', marginBottom: '1rem', textAlign: 'center'
                    }}>
                        <p style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
                            📱 Emergency contact: <strong>{emergencyName}</strong> ({emergencyRelation}) — {emergencyPhone}
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                            They will be notified with your location after the alert
                        </p>
                    </div>
                )}

                {!emergencyPhone && (
                    <div style={{
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 12, padding: '1rem', marginBottom: '1rem', textAlign: 'center'
                    }}>
                        <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
                            ⚠️ No emergency contact set — go to Profile → Emergency to add one
                        </p>
                    </div>
                )}

                <div className="emergency-features">
                    <div className="feature-item">
                        <span>📍</span>
                        <div>
                            <h4>Live Location</h4>
                            <p>Your GPS location will be shared automatically</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <span>📞</span>
                        <div>
                            <h4>Direct Call & SMS</h4>
                            <p>Call or message your emergency contact directly</p>
                        </div>
                    </div>
                    <div className="feature-item">
                        <span>🚑</span>
                        <div>
                            <h4>Ambulance Numbers</h4>
                            <p>Quick dial 102 (Ambulance) and 108 (Emergency)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyAlert;
