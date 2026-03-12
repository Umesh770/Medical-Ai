import { useState, useEffect } from 'react';
import { HiOutlinePlusSm, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { prescriptionAPI, patientAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Prescriptions = () => {
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor';
    const [prescriptions, setPrescriptions] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const emptyMedicine = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };
    const [form, setForm] = useState({
        patientId: '', diagnosis: '', notes: '',
        medicines: [{ ...emptyMedicine }],
    });

    useEffect(() => { fetchPrescriptions(); }, []);
    useEffect(() => { if (isDoctor && showModal) fetchPatients(); }, [isDoctor, showModal]);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            const res = await prescriptionAPI.getAll();
            setPrescriptions(res.data.data || []);
        } catch { setPrescriptions([]); }
        setLoading(false);
    };

    const fetchPatients = async () => {
        try {
            const res = await patientAPI.getAll();
            setPatients(res.data.data || []);
        } catch { setPatients([]); }
    };

    // ── Medicine list helpers ──
    const addMedicine = () => setForm(f => ({ ...f, medicines: [...f.medicines, { ...emptyMedicine }] }));
    const removeMedicine = (i) => setForm(f => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));
    const updateMedicine = (i, field, value) => {
        setForm(f => {
            const meds = [...f.medicines];
            meds[i] = { ...meds[i], [field]: value };
            return { ...f, medicines: meds };
        });
    };

    const handleSubmit = async () => {
        if (!form.patientId) return toast.error('Select a patient');
        if (!form.diagnosis.trim()) return toast.error('Enter diagnosis');
        if (form.medicines.some(m => !m.name.trim())) return toast.error('All medicines must have a name');
        setSaving(true);
        try {
            await prescriptionAPI.create(form);
            toast.success('Prescription created successfully!');
            setShowModal(false);
            setForm({ patientId: '', diagnosis: '', notes: '', medicines: [{ ...emptyMedicine }] });
            fetchPrescriptions();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create prescription');
        }
        setSaving(false);
    };

    const pharmacyColor = { not_sent: '#64748b', sent: '#f59e0b', processing: '#8b5cf6', ready: '#06b6d4', dispensed: '#10b981' };

    if (loading) return <div className="page-loader"><div className="spinner" /></div>;

    return (
        <div className="prescriptions-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📋 Prescriptions</h1>
                    <p className="page-subtitle">
                        {isDoctor ? 'Write and manage prescriptions for patients' : 'View your prescriptions from doctors'}
                    </p>
                </div>
                {isDoctor && (
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <HiOutlinePlusSm className="w-5 h-5" />
                        Write Prescription
                    </button>
                )}
            </div>

            {/* Prescriptions list */}
            <div className="prescriptions-list">
                {prescriptions.length === 0 ? (
                    <div className="empty-state">
                        <span className="text-5xl">📋</span>
                        <h3>No prescriptions yet</h3>
                        <p>{isDoctor ? 'Write your first prescription' : 'Your prescriptions from doctors will appear here'}</p>
                    </div>
                ) : prescriptions.map(rx => {
                    const docName = rx.doctorId?.userId?.name || 'Doctor';
                    const patName = rx.patientId?.userId?.name || 'Patient';
                    const isExpanded = expandedId === rx._id;
                    return (
                        <div key={rx._id} className="prescription-card" onClick={() => setExpandedId(isExpanded ? null : rx._id)} style={{ cursor: 'pointer' }}>
                            <div className="prescription-header">
                                <div>
                                    <h3 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1.05rem' }}>
                                        {rx.diagnosis || 'Prescription'}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                                        <span>{isDoctor ? `Patient: ${patName}` : `Dr. ${docName}`}</span>
                                        <span>•</span>
                                        <span>{new Date(rx.createdAt).toLocaleDateString('en', { dateStyle: 'medium' })}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span className="status-badge" style={{ '--badge-color': pharmacyColor[rx.pharmacyStatus] || '#64748b' }}>
                                        {rx.pharmacyStatus === 'not_sent' ? '📝 Not sent' : `💊 ${rx.pharmacyStatus}`}
                                    </span>
                                    <span style={{ color: '#64748b', fontSize: '1.2rem' }}>{isExpanded ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {isExpanded && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(71,85,105,0.3)', paddingTop: '1rem' }} onClick={e => e.stopPropagation()}>
                                    {/* Medicines table */}
                                    <h4 style={{ color: '#06b6d4', fontWeight: 600, marginBottom: '0.5rem' }}>💊 Medicines</h4>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="rx-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(rx.medicines || []).map((m, i) => (
                                                    <tr key={i}>
                                                        <td>{i + 1}</td>
                                                        <td style={{ fontWeight: 500, color: '#e2e8f0' }}>{m.name}</td>
                                                        <td>{m.dosage || '—'}</td>
                                                        <td>{m.frequency || '—'}</td>
                                                        <td>{m.duration || '—'}</td>
                                                        <td>{m.instructions || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {rx.notes && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(6,182,212,0.06)', borderRadius: '0.5rem', border: '1px solid rgba(6,182,212,0.15)' }}>
                                            <span style={{ color: '#06b6d4', fontWeight: 500, fontSize: '0.82rem' }}>📝 Notes: </span>
                                            <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{rx.notes}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Write Prescription Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📝 Write Prescription</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Patient *</label>
                                    <select className="form-input" value={form.patientId}
                                        onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
                                        <option value="">Select Patient</option>
                                        {patients.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.userId?.name || 'Unknown'} — {p.userId?.email || ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Diagnosis *</label>
                                    <input type="text" className="form-input" placeholder="e.g. Viral Fever"
                                        value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
                                </div>
                            </div>

                            {/* Medicines */}
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>💊 Medicines</label>
                                    <button className="btn-sm btn-primary-sm" onClick={addMedicine} type="button">
                                        <HiOutlinePlusSm className="w-4 h-4" /> Add Medicine
                                    </button>
                                </div>
                                {form.medicines.map((med, i) => (
                                    <div key={i} className="medicine-row" style={{
                                        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr auto',
                                        gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end',
                                    }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            {i === 0 && <label style={{ fontSize: '0.75rem' }}>Name *</label>}
                                            <input className="form-input" placeholder="Medicine name" value={med.name}
                                                onChange={e => updateMedicine(i, 'name', e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            {i === 0 && <label style={{ fontSize: '0.75rem' }}>Dosage</label>}
                                            <input className="form-input" placeholder="e.g. 500mg" value={med.dosage}
                                                onChange={e => updateMedicine(i, 'dosage', e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            {i === 0 && <label style={{ fontSize: '0.75rem' }}>Frequency</label>}
                                            <input className="form-input" placeholder="e.g. Twice daily" value={med.frequency}
                                                onChange={e => updateMedicine(i, 'frequency', e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            {i === 0 && <label style={{ fontSize: '0.75rem' }}>Duration</label>}
                                            <input className="form-input" placeholder="e.g. 7 days" value={med.duration}
                                                onChange={e => updateMedicine(i, 'duration', e.target.value)} />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            {i === 0 && <label style={{ fontSize: '0.75rem' }}>Instructions</label>}
                                            <input className="form-input" placeholder="e.g. After meals" value={med.instructions}
                                                onChange={e => updateMedicine(i, 'instructions', e.target.value)} />
                                        </div>
                                        {form.medicines.length > 1 && (
                                            <button onClick={() => removeMedicine(i)} title="Remove"
                                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.375rem', padding: '0.5rem', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Notes (optional)</label>
                                <textarea className="form-input" rows={3} placeholder="Additional notes for the patient..."
                                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>

                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                                    {saving ? <><span className="spinner-sm" /> Saving…</> : '✓ Create Prescription'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Prescriptions;
