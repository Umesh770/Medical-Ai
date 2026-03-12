import { useState, useEffect } from 'react';
import {
    HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineCalendar,
    HiOutlinePencil, HiOutlineCheck, HiOutlineX, HiOutlineShieldCheck,
    HiOutlineLocationMarker
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { patientAPI, doctorAPI } from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/* ── Patient helpers ─────────────────────────────────────────────── */
const mapPatient = (d, user) => ({
    name: d.userId?.name || user?.name || '',
    email: d.userId?.email || user?.email || '',
    phone: d.userId?.phone || '',
    dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().split('T')[0] : '',
    gender: d.gender || '',
    bloodGroup: d.bloodGroup || '',
    height: d.height || '',
    weight: d.weight || '',
    nearbyHospital: d.nearbyHospital || '',
    allergies: (d.allergies || []).map(a => a.name || a).filter(Boolean),
    conditions: (d.medicalHistory || []).map(c => c.condition || c).filter(Boolean),
    emergencyName: d.emergencyContact?.name || '',
    emergencyPhone: d.emergencyContact?.phone || '',
    emergencyRelationship: d.emergencyContact?.relationship || '',
    twoFactorEnabled: false,
});

/* ── Doctor helpers ──────────────────────────────────────────────── */
const mapDoctor = (d, user) => ({
    name: d.userId?.name || user?.name || '',
    email: d.userId?.email || user?.email || '',
    phone: d.userId?.phone || '',
    specialization: d.specialization || '',
    licenseNumber: d.licenseNumber || '',
    experience: d.experience || '',
    qualification: d.qualification || '',
    consultationFee: d.consultationFee || '',
    department: d.department || '',
    bio: d.bio || '',
    isAvailable: d.isAvailable ?? true,
    rating: d.rating?.average || '',
    twoFactorEnabled: false,
});

/* ── Shared Components ───────────────────────────────────────────── */
const PATIENT_TABS = [
    { id: 'personal', label: '👤 Personal' },
    { id: 'health', label: '❤️ Health' },
    { id: 'emergency', label: '🚨 Emergency' },
    { id: 'security', label: '🔒 Security' },
];
const DOCTOR_TABS = [
    { id: 'personal', label: '👤 Personal' },
    { id: 'professional', label: '🩺 Professional' },
    { id: 'security', label: '🔒 Security' },
];

/* ── Main Component ──────────────────────────────────────────────── */
const Profile = () => {
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor';
    const isPatient = user?.role === 'patient';

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [recordId, setRecordId] = useState(null);

    const [profile, setProfile] = useState(null);
    const [edit, setEdit] = useState({});

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            if (isDoctor) {
                const res = await doctorAPI.getMyProfile();
                const data = res.data.data;
                setRecordId(data._id);
                const mapped = mapDoctor(data, user);
                setProfile(mapped);
                setEdit(mapped);
            } else {
                const res = await patientAPI.getMyProfile();
                const data = res.data.data;
                setRecordId(data._id);
                const mapped = mapPatient(data, user);
                setProfile(mapped);
                setEdit(mapped);
            }
        } catch {
            // Blank fallback
            const blank = isDoctor
                ? mapDoctor({}, user)
                : mapPatient({}, user);
            setProfile(blank);
            setEdit(blank);
        } finally {
            setLoading(false);
        }
    };

    /* ── Save ─────────────────────────────────────────────────────── */
    const handleSave = async () => {
        setSaving(true);
        try {
            if (isDoctor && recordId) {
                await doctorAPI.update(recordId, {
                    specialization: edit.specialization,
                    qualification: edit.qualification,
                    experience: edit.experience ? Number(edit.experience) : undefined,
                    consultationFee: edit.consultationFee ? Number(edit.consultationFee) : undefined,
                    department: edit.department,
                    bio: edit.bio,
                });
            } else if (isPatient) {
                await patientAPI.completeOnboarding({
                    bloodGroup: edit.bloodGroup,
                    height: edit.height ? Number(edit.height) : undefined,
                    weight: edit.weight ? Number(edit.weight) : undefined,
                    nearbyHospital: edit.nearbyHospital,
                    allergies: edit.allergies?.join(', '),
                    medicalConditions: edit.conditions?.join(', '),
                    emergencyContactName: edit.emergencyName,
                    emergencyContactPhone: edit.emergencyPhone,
                    emergencyContactRelationship: edit.emergencyRelationship,
                });
            }
            setProfile({ ...edit });
            setEditing(false);
            toast.success('Profile updated!');
        } catch {
            toast.error('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => { setEdit({ ...profile }); setEditing(false); };
    const setField = (key, value) => setEdit(e => ({ ...e, [key]: value }));
    const addTag = (key, raw) => {
        if (!raw.trim()) return;
        const items = raw.split(',').map(s => s.trim()).filter(Boolean);
        setEdit(e => ({ ...e, [key]: [...new Set([...(e[key] || []), ...items])] }));
    };
    const removeTag = (key, idx) => setEdit(e => ({ ...e, [key]: e[key].filter((_, i) => i !== idx) }));

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;
    if (!profile) return null;

    const dp = editing ? edit : profile;  // display profile
    const TABS = isDoctor ? DOCTOR_TABS : PATIENT_TABS;

    return (
        <div className="profile-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Manage your {isDoctor ? 'professional' : 'personal & health'} information</p>
                </div>
                {!editing ? (
                    <button className="btn-primary" onClick={() => setEditing(true)}>
                        <HiOutlinePencil className="w-5 h-5" /> Edit Profile
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary" onClick={handleCancel} disabled={saving}>
                            <HiOutlineX className="w-5 h-5" /> Cancel
                        </button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="spinner-sm" /> : <HiOutlineCheck className="w-5 h-5" />}
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                )}
            </div>

            {/* Avatar card */}
            <div className="profile-header-card">
                <div className="profile-avatar-large">
                    <span>{(profile.name || '?').charAt(0).toUpperCase()}</span>
                </div>
                <div className="profile-header-info">
                    <h2>{profile.name || user?.name}</h2>
                    <p>{profile.email || user?.email}</p>
                    <div className="profile-badges">
                        <span className="profile-badge badge-role">{user?.role}</span>
                        {isDoctor && profile.specialization && (
                            <span className="profile-badge badge-role" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                                🩺 {profile.specialization}
                            </span>
                        )}
                        {isDoctor && profile.experience && (
                            <span className="profile-badge badge-role" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                                {profile.experience} yrs exp.
                            </span>
                        )}
                        {isPatient && profile.bloodGroup && (
                            <span className="profile-badge badge-blood">🩸 {profile.bloodGroup}</span>
                        )}
                        {isPatient && profile.height && profile.weight && (
                            <span className="profile-badge badge-role" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                                {profile.height} cm · {profile.weight} kg
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
                {TABS.map(tab => (
                    <button key={tab.id} className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Personal tab (both roles) ─────────────────────────── */}
            {activeTab === 'personal' && (
                <div className="profile-section">
                    <div className="form-grid">
                        <div className="form-group">
                            <label><HiOutlineUser className="inline w-4 h-4" style={{ marginRight: 4 }} />Full Name</label>
                            <p className="form-value">{profile.name || '—'}</p>
                        </div>
                        <div className="form-group">
                            <label><HiOutlineMail className="inline w-4 h-4" style={{ marginRight: 4 }} />Email</label>
                            <p className="form-value">{profile.email || '—'}</p>
                        </div>
                        <div className="form-group">
                            <label><HiOutlinePhone className="inline w-4 h-4" style={{ marginRight: 4 }} />Phone</label>
                            {editing
                                ? <input type="tel" className="form-input" value={edit.phone} onChange={e => setField('phone', e.target.value)} placeholder="Phone number" />
                                : <p className="form-value">{profile.phone || '—'}</p>}
                        </div>
                        {isPatient && (
                            <>
                                <div className="form-group">
                                    <label><HiOutlineCalendar className="inline w-4 h-4" style={{ marginRight: 4 }} />Date of Birth</label>
                                    {editing
                                        ? <input type="date" className="form-input" value={edit.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)} />
                                        : <p className="form-value">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en', { dateStyle: 'long' }) : '—'}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    {editing
                                        ? <select className="form-select" value={edit.gender} onChange={e => setField('gender', e.target.value)}>
                                            <option value="">Select...</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        : <p className="form-value capitalize">{profile.gender || '—'}</p>}
                                </div>
                                <div className="form-group">
                                    <label><HiOutlineLocationMarker className="inline w-4 h-4" style={{ marginRight: 4 }} />Nearest Hospital</label>
                                    {editing
                                        ? <input type="text" className="form-input" value={edit.nearbyHospital} onChange={e => setField('nearbyHospital', e.target.value)} placeholder="Hospital name / address" />
                                        : <p className="form-value">{profile.nearbyHospital || '—'}</p>}
                                </div>
                            </>
                        )}
                        {isDoctor && (
                            <div className="form-group">
                                <label>Bio</label>
                                {editing
                                    ? <textarea className="form-textarea" value={edit.bio} onChange={e => setField('bio', e.target.value)} placeholder="Short bio..." rows={3} />
                                    : <p className="form-value">{profile.bio || '—'}</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Doctor: Professional tab ──────────────────────────── */}
            {activeTab === 'professional' && isDoctor && (
                <div className="profile-section">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>🩺 Specialization</label>
                            {editing
                                ? <input type="text" className="form-input" value={edit.specialization} onChange={e => setField('specialization', e.target.value)} />
                                : <p className="form-value">{profile.specialization || '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>🎓 Qualification</label>
                            {editing
                                ? <input type="text" className="form-input" value={edit.qualification} onChange={e => setField('qualification', e.target.value)} placeholder="e.g. MBBS, MD" />
                                : <p className="form-value">{profile.qualification || '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>⏱️ Experience (years)</label>
                            {editing
                                ? <input type="number" className="form-input" value={edit.experience} onChange={e => setField('experience', e.target.value)} min="0" />
                                : <p className="form-value">{profile.experience ? `${profile.experience} years` : '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>💰 Consultation Fee (₹)</label>
                            {editing
                                ? <input type="number" className="form-input" value={edit.consultationFee} onChange={e => setField('consultationFee', e.target.value)} min="0" />
                                : <p className="form-value">{profile.consultationFee ? `₹${profile.consultationFee}` : '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>🏥 Department</label>
                            {editing
                                ? <input type="text" className="form-input" value={edit.department} onChange={e => setField('department', e.target.value)} placeholder="e.g. Cardiology" />
                                : <p className="form-value">{profile.department || '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>📋 License Number</label>
                            <p className="form-value">{profile.licenseNumber || '—'}</p>
                        </div>
                        {profile.rating && (
                            <div className="form-group">
                                <label>⭐ Rating</label>
                                <p className="form-value">{profile.rating} / 5</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Patient: Health tab ───────────────────────────────── */}
            {activeTab === 'health' && isPatient && (
                <div className="profile-section">
                    <div className="form-grid" style={{ marginBottom: 24 }}>
                        <div className="form-group">
                            <label>🩸 Blood Group</label>
                            {editing ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 4 }}>
                                    {BLOOD_GROUPS.map(bg => (
                                        <button key={bg} type="button" onClick={() => setField('bloodGroup', bg)}
                                            style={{
                                                padding: '9px 4px', borderRadius: 8, cursor: 'pointer',
                                                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.15s',
                                                border: edit.bloodGroup === bg ? '2px solid #06b6d4' : '1px solid rgba(71,85,105,0.5)',
                                                background: edit.bloodGroup === bg ? 'rgba(6,182,212,0.15)' : 'rgba(15,23,42,0.6)',
                                                color: edit.bloodGroup === bg ? '#06b6d4' : '#94a3b8',
                                            }}>{bg}</button>
                                    ))}
                                </div>
                            ) : <p className="form-value">{profile.bloodGroup || '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>📏 Height</label>
                            {editing
                                ? <input type="number" className="form-input" value={edit.height} onChange={e => setField('height', e.target.value)} placeholder="cm" />
                                : <p className="form-value">{profile.height ? `${profile.height} cm` : '—'}</p>}
                        </div>
                        <div className="form-group">
                            <label>⚖️ Weight</label>
                            {editing
                                ? <input type="number" className="form-input" value={edit.weight} onChange={e => setField('weight', e.target.value)} placeholder="kg" />
                                : <p className="form-value">{profile.weight ? `${profile.weight} kg` : '—'}</p>}
                        </div>
                    </div>

                    {/* Allergies */}
                    <div className="profile-subsection">
                        <h3>⚠️ Allergies</h3>
                        <div className="tags-list">
                            {(dp.allergies || []).length > 0
                                ? (dp.allergies || []).map((a, i) => (
                                    <span key={i} className="allergy-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        {a}
                                        {editing && <button type="button" onClick={() => removeTag('allergies', i)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem', padding: 0, lineHeight: 1 }}>×</button>}
                                    </span>
                                ))
                                : <span style={{ color: '#64748b', fontSize: '0.875rem' }}>No allergies recorded</span>
                            }
                        </div>
                        {editing && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <input id="allergy-input" type="text" className="form-input" placeholder="Add allergy (comma for multiple)" style={{ flex: 1 }}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('allergies', e.target.value); e.target.value = ''; } }} />
                                <button type="button" className="btn-secondary" onClick={() => { const el = document.getElementById('allergy-input'); addTag('allergies', el.value); el.value = ''; }}>Add</button>
                            </div>
                        )}
                    </div>

                    {/* Conditions */}
                    <div className="profile-subsection" style={{ marginTop: 20 }}>
                        <h3>🏥 Medical Conditions</h3>
                        <div className="tags-list">
                            {(dp.conditions || []).length > 0
                                ? (dp.conditions || []).map((c, i) => (
                                    <span key={i} className="condition-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        {c}
                                        {editing && <button type="button" onClick={() => removeTag('conditions', i)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem', padding: 0, lineHeight: 1 }}>×</button>}
                                    </span>
                                ))
                                : <span style={{ color: '#64748b', fontSize: '0.875rem' }}>No conditions recorded</span>
                            }
                        </div>
                        {editing && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <input id="condition-input" type="text" className="form-input" placeholder="Add condition (comma for multiple)" style={{ flex: 1 }}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag('conditions', e.target.value); e.target.value = ''; } }} />
                                <button type="button" className="btn-secondary" onClick={() => { const el = document.getElementById('condition-input'); addTag('conditions', el.value); el.value = ''; }}>Add</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Patient: Emergency tab ────────────────────────────── */}
            {activeTab === 'emergency' && isPatient && (
                <div className="profile-section">
                    <div className="emergency-contact-card">
                        <h3>🚨 Emergency Contact</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Contact Name</label>
                                {editing
                                    ? <input type="text" className="form-input" value={edit.emergencyName} onChange={e => setField('emergencyName', e.target.value)} placeholder="e.g. Rahul Sharma" />
                                    : <p className="form-value">{profile.emergencyName || '—'}</p>}
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                {editing
                                    ? <input type="tel" className="form-input" value={edit.emergencyPhone} onChange={e => setField('emergencyPhone', e.target.value)} placeholder="e.g. 9876543210" />
                                    : <p className="form-value">{profile.emergencyPhone || '—'}</p>}
                            </div>
                            <div className="form-group">
                                <label>Relationship</label>
                                {editing
                                    ? <select className="form-select" value={edit.emergencyRelationship} onChange={e => setField('emergencyRelationship', e.target.value)}>
                                        <option value="">Select...</option>
                                        <option value="Spouse">Spouse</option>
                                        <option value="Parent">Parent</option>
                                        <option value="Sibling">Sibling</option>
                                        <option value="Child">Child</option>
                                        <option value="Friend">Friend</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    : <p className="form-value">{profile.emergencyRelationship || '—'}</p>}
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: 16 }}>
                            <label><HiOutlineLocationMarker className="inline w-4 h-4" style={{ marginRight: 4 }} />Nearest Hospital</label>
                            {editing
                                ? <input type="text" className="form-input" value={edit.nearbyHospital} onChange={e => setField('nearbyHospital', e.target.value)} placeholder="Hospital name / address" />
                                : <p className="form-value">{profile.nearbyHospital || '—'}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Security tab (both roles) ─────────────────────────── */}
            {activeTab === 'security' && (
                <div className="profile-section">
                    <div className="security-options">
                        <div className="security-option">
                            <div>
                                <h4><HiOutlineShieldCheck className="inline w-5 h-5" /> Two-Factor Auth</h4>
                                <p>Add an extra security layer to your account</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={profile.twoFactorEnabled}
                                    onChange={() => { setProfile(p => ({ ...p, twoFactorEnabled: !p.twoFactorEnabled })); toast.success('2FA toggled!'); }}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                        <div className="security-option">
                            <div>
                                <h4>🔑 Change Password</h4>
                                <p>Update your account password</p>
                            </div>
                            <button className="btn-secondary btn-sm" onClick={() => toast.success('Password change coming soon!')}>Change</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
