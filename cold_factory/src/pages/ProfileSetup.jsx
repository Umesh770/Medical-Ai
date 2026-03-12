import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { patientAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ─── Blood group selector ────────────────────────────────────────── */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/* ─── These components live OUTSIDE ProfileSetup so React doesn't   ─
       unmount+remount them on every keystroke (which would kill focus) ─ */

const Step1 = ({ form, onChange }) => (
    <>
        <div className="form-group">
            <label>Blood Group</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 4 }}>
                {BLOOD_GROUPS.map(bg => (
                    <button
                        key={bg}
                        type="button"
                        onClick={() => onChange('bloodGroup', bg)}
                        style={{
                            padding: '10px 4px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            transition: 'all 0.15s',
                            border: form.bloodGroup === bg ? '2px solid #06b6d4' : '1px solid rgba(71,85,105,0.5)',
                            background: form.bloodGroup === bg ? 'rgba(6,182,212,0.15)' : 'rgba(15,23,42,0.6)',
                            color: form.bloodGroup === bg ? '#06b6d4' : '#94a3b8',
                        }}
                    >
                        {bg}
                    </button>
                ))}
            </div>
        </div>

        <div className="form-row">
            <div className="form-group">
                <label>Weight (kg)</label>
                <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 65"
                    value={form.weight}
                    onChange={e => onChange('weight', e.target.value)}
                    min="1" max="300"
                />
            </div>
            <div className="form-group">
                <label>Height (cm)</label>
                <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 170"
                    value={form.height}
                    onChange={e => onChange('height', e.target.value)}
                    min="50" max="300"
                />
            </div>
        </div>
    </>
);

const Step2 = ({ form, onChange }) => (
    <>
        <div className="form-group">
            <label>Allergies (comma separated — leave blank if none)</label>
            <input
                type="text"
                className="form-input"
                placeholder="e.g. Penicillin, Peanuts, Dust"
                value={form.allergies}
                onChange={e => onChange('allergies', e.target.value)}
            />
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 5 }}>Separate multiple allergies with commas</p>
        </div>
        <div className="form-group">
            <label>Existing Medical Conditions (comma separated — leave blank if none)</label>
            <textarea
                className="form-textarea"
                placeholder="e.g. Diabetes, Hypertension, Asthma"
                value={form.medicalConditions}
                onChange={e => onChange('medicalConditions', e.target.value)}
                rows={3}
            />
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 5 }}>Separate multiple conditions with commas</p>
        </div>
    </>
);

const Step3 = ({ form, onChange }) => (
    <>
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 20
        }}>
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
            <p style={{ color: '#fca5a5', fontSize: '0.82rem', margin: 0 }}>
                This information is used in emergencies to contact your family or take you to a hospital quickly.
            </p>
        </div>

        <div className="form-group">
            <label>Emergency Contact Name</label>
            <input
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={form.emergencyContactName}
                onChange={e => onChange('emergencyContactName', e.target.value)}
            />
        </div>

        <div className="form-row">
            <div className="form-group">
                <label>Contact Phone</label>
                <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9876543210"
                    value={form.emergencyContactPhone}
                    onChange={e => onChange('emergencyContactPhone', e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Relationship</label>
                <select
                    className="form-select"
                    value={form.emergencyContactRelationship}
                    onChange={e => onChange('emergencyContactRelationship', e.target.value)}
                >
                    <option value="">Select...</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                </select>
            </div>
        </div>

        <div className="form-group">
            <label>Nearest Hospital Name / Address</label>
            <input
                type="text"
                className="form-input"
                placeholder="e.g. Apollo Hospital, MG Road, Bangalore"
                value={form.nearbyHospital}
                onChange={e => onChange('nearbyHospital', e.target.value)}
            />
        </div>
    </>
);

/* ─── Step metadata ─────────────────────────────────────────────── */
const STEPS = [
    { id: 1, title: 'Body Information', subtitle: 'Your physical details', icon: '🩺', Component: Step1 },
    { id: 2, title: 'Medical History', subtitle: 'Your health background', icon: '📋', Component: Step2 },
    { id: 3, title: 'Emergency & Hospital', subtitle: 'Safety information', icon: '🚨', Component: Step3 },
];

/* ─── Main component ─────────────────────────────────────────────── */
export default function ProfileSetup() {
    const navigate = useNavigate();
    const { user, refreshProfileStatus } = useAuth();

    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        bloodGroup: '',
        weight: '',
        height: '',
        allergies: '',
        medicalConditions: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
        nearbyHospital: '',
    });

    // Stable updater — doesn't recreate sub-component functions
    const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

    const next = () => setStep(s => Math.min(s + 1, 3));
    const back = () => setStep(s => Math.max(s - 1, 1));

    const submit = async () => {
        setSaving(true);
        try {
            await patientAPI.completeOnboarding(form);
            await refreshProfileStatus();
            toast.success('Profile setup complete! Welcome 🎉');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const { Component: StepComponent } = STEPS[step - 1];

    return (
        /* Outer page — mimics the site's auth-page dark background */
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            fontFamily: "'Inter', sans-serif",
        }}>
            <div style={{ width: '100%', maxWidth: 560 }}>

                {/* ── Logo / Header ── */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#06b6d4,#0891b2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem', margin: '0 auto 14px',
                        boxShadow: '0 0 0 8px rgba(6,182,212,0.12)',
                    }}>🏥</div>
                    <h1 style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                        Welcome, {user?.name?.split(' ')[0] || 'there'}! 👋
                    </h1>
                    <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>
                        Complete your health profile — takes under 2 minutes.
                    </p>
                </div>

                {/* ── Step indicator row ── */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                    {STEPS.map((s, i) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.3s',
                                background: step > s.id
                                    ? 'linear-gradient(135deg,#10b981,#059669)'
                                    : step === s.id
                                        ? 'linear-gradient(135deg,#06b6d4,#0891b2)'
                                        : 'rgba(15,23,42,0.8)',
                                color: step >= s.id ? '#fff' : '#475569',
                                border: step === s.id
                                    ? '2px solid #06b6d4'
                                    : step > s.id
                                        ? '2px solid #10b981'
                                        : '1px solid rgba(71,85,105,0.5)',
                                boxShadow: step === s.id ? '0 0 14px rgba(6,182,212,0.4)' : 'none',
                            }}>
                                {step > s.id ? '✓' : s.id}
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{
                                    flex: 1, height: 2, margin: '0 6px',
                                    background: step > s.id
                                        ? 'linear-gradient(90deg,#10b981,#06b6d4)'
                                        : 'rgba(71,85,105,0.3)',
                                    transition: 'background 0.4s',
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Card ── matches site modal style ── */}
                <div style={{
                    background: '#1e293b',
                    border: '1px solid rgba(71,85,105,0.5)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}>
                    {/* Card header */}
                    <div style={{
                        padding: '20px 24px 16px',
                        borderBottom: '1px solid rgba(71,85,105,0.3)',
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>{STEPS[step - 1].icon}</span>
                        <div>
                            <h2 style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                                {STEPS[step - 1].title}
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, marginTop: 2 }}>
                                {STEPS[step - 1].subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Card body — the step content */}
                    <div style={{ padding: '24px 24px 0' }}>
                        <StepComponent form={form} onChange={handleChange} />
                    </div>

                    {/* Card footer / nav */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px 24px 20px',
                        borderTop: '1px solid rgba(71,85,105,0.3)',
                        marginTop: 8,
                    }}>
                        {step > 1
                            ? <button className="btn-secondary" type="button" onClick={back}>← Back</button>
                            : <div />
                        }

                        {step < 3
                            ? (
                                <button className="btn-primary" type="button" onClick={next}>
                                    Next →
                                </button>
                            ) : (
                                <button
                                    className="btn-primary"
                                    type="button"
                                    onClick={submit}
                                    disabled={saving}
                                    style={{ minWidth: 140, justifyContent: 'center' }}
                                >
                                    {saving
                                        ? <><span className="spinner-sm" style={{ marginRight: 8 }} />Saving…</>
                                        : '✓ Complete Setup'
                                    }
                                </button>
                            )
                        }
                    </div>
                </div>

                {/* Skip link */}
                <p style={{ textAlign: 'center', marginTop: 18, color: '#475569', fontSize: '0.8rem' }}>
                    You can always update this later from your Profile page.{' '}
                    <button
                        onClick={submit}
                        disabled={saving}
                        style={{
                            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                            textDecoration: 'underline', fontSize: '0.8rem'
                        }}
                    >
                        Skip for now
                    </button>
                </p>
            </div>
        </div>
    );
}
