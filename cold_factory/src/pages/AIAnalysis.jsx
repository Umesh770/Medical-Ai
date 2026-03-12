import { useState, useRef } from 'react';
import {
    HiOutlineCloudUpload, HiOutlineDocumentReport, HiOutlineX,
    HiOutlineCheck, HiOutlineExclamation, HiOutlinePhotograph,
    HiOutlineLightBulb, HiOutlineShieldExclamation, HiOutlineBeaker
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const SEV_COLOR = {
    critical: '#ef4444', high: '#f59e0b', moderate: '#06b6d4',
    low: '#10b981', default: '#6b7280'
};
const getSevColor = (s) => SEV_COLOR[s] || SEV_COLOR.default;

const STATUS_META = {
    normal: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅', label: 'Normal' },
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '⬆️', label: 'High' },
    low: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⬇️', label: 'Low' },
    borderline: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⚠️', label: 'Borderline' },
};

/* ------------------------------------------------------------------ */
const AIAnalysis = () => {
    const [activeTab, setActiveTab] = useState('summary');

    // ── Report Summary ──────────────────────────────────────────────
    const [reportFile, setReportFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [summary, setSummary] = useState(null);
    const fileInputRef = useRef(null);

    // ── Disease Prediction ──────────────────────────────────────────
    const [symptoms, setSymptoms] = useState('');
    const [predicting, setPredicting] = useState(false);
    const [predictions, setPredictions] = useState(null);

    // ── Drug Interaction ────────────────────────────────────────────
    const [drugs, setDrugs] = useState('');
    const [allergies, setAllergies] = useState('');
    const [checking, setChecking] = useState(false);
    const [interactions, setInteractions] = useState(null);

    /* ── Report Summary handlers ─────────────────────────────────── */
    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); setDragActive(false);
        const f = e.dataTransfer.files?.[0];
        if (f) validateAndSet(f);
    };

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (f) validateAndSet(f);
    };

    const validateAndSet = (f) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (!allowed.includes(f.type)) { toast.error('Only PDF, JPG, PNG, or DOCX files are accepted'); return; }
        if (f.size > 10 * 1024 * 1024) { toast.error('File too large — max 10 MB'); return; }
        setReportFile(f);
        setSummary(null);
    };

    const summarizeReport = async () => {
        if (!reportFile) { toast.error('Please upload your blood report file first'); return; }
        setSummarizing(true);
        try {
            const fd = new FormData();
            fd.append('report', reportFile);
            const res = await api.post('/ai/summarize-report', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSummary(res.data.data);
            toast.success('Report analysed by AI!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Analysis failed — please try again');
        }
        setSummarizing(false);
    };

    /* ── Disease Prediction handlers ─────────────────────────────── */
    const predictDisease = async () => {
        if (!symptoms.trim()) { toast.error('Please enter your symptoms'); return; }
        setPredicting(true);
        try {
            const res = await api.post('/ai/predict-disease', {
                symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean)
            });
            setPredictions(res.data.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Prediction failed — try again');
        }
        setPredicting(false);
    };

    /* ── Drug Interaction handlers ───────────────────────────────── */
    const checkInteractions = async () => {
        if (!drugs.trim()) { toast.error('Please enter at least one medication'); return; }
        setChecking(true);
        try {
            const res = await api.post('/ai/check-drug-interaction', {
                drugs: drugs.split(',').map(s => s.trim()).filter(Boolean),
                allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : []
            });
            setInteractions(res.data.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Check failed — try again');
        }
        setChecking(false);
    };

    /* ── Render ──────────────────────────────────────────────────── */
    return (
        <div className="ai-analysis-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🤖 AI Medical Analysis</h1>
                    <p className="page-subtitle">Upload your blood report for instant AI analysis, check disease risk from symptoms, and verify drug safety</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="analysis-tabs">
                {[
                    { id: 'summary', label: '🩸 Blood Report', desc: 'Upload & analyse report' },
                    { id: 'disease', label: '🧬 Disease Prediction', desc: 'Predict from symptoms' },
                    { id: 'drugs', label: '💊 Drug Interaction', desc: 'Check drug safety' },
                ].map(tab => (
                    <button key={tab.id}
                        className={`analysis-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        <span className="tab-label">{tab.label}</span>
                        <span className="tab-desc">{tab.desc}</span>
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* REPORT SUMMARY TAB                                      */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'summary' && (
                <div className="analysis-section">
                    <div className="analysis-input-card">
                        <h3>🩸 Blood Report AI Analysis</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                            Upload your blood test report (PDF, JPG, or PNG). The AI will extract values,
                            highlight what's high or low, and give you personalised health advice.
                        </p>

                        {/* Drop Zone */}
                        <label
                            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                            style={{ cursor: 'pointer', display: 'block', marginBottom: '1rem' }}
                            onDragEnter={handleDrag} onDragLeave={handleDrag}
                            onDragOver={handleDrag} onDrop={handleDrop}
                        >
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" hidden
                                ref={fileInputRef} onChange={handleFileChange} />
                            {reportFile ? (
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '2.5rem' }}>
                                        {reportFile.type.startsWith('image/') ? '🖼️' : '📄'}
                                    </span>
                                    <p style={{ color: '#e2e8f0', fontWeight: 600, marginTop: '0.5rem' }}>{reportFile.name}</p>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                        {(reportFile.size / 1024).toFixed(1)} KB
                                    </p>
                                    <button
                                        className="btn-sm"
                                        style={{ marginTop: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 8, padding: '0.3rem 0.8rem', cursor: 'pointer' }}
                                        onClick={e => { e.preventDefault(); setReportFile(null); setSummary(null); }}>
                                        <HiOutlineX className="inline w-4 h-4" /> Remove
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="upload-icon-wrapper">
                                        <HiOutlineCloudUpload className="w-10 h-10" />
                                    </div>
                                    <p className="upload-text"><strong>Drag &amp; drop your blood report here</strong></p>
                                    <p className="upload-subtext">or <span className="upload-browse">browse</span> to select file</p>
                                    <p className="upload-formats">
                                        <HiOutlinePhotograph className="inline w-4 h-4 mr-1" />
                                        PDF · JPG · PNG · DOCX (max 10 MB)
                                    </p>
                                </>
                            )}
                        </label>

                        <button className="btn-primary w-full" onClick={summarizeReport} disabled={summarizing || !reportFile}>
                            {summarizing
                                ? <><div className="spinner-sm" /> Analysing with AI…</>
                                : <><HiOutlineBeaker className="w-5 h-5" /> Analyse Blood Report</>}
                        </button>
                    </div>

                    {/* Results */}
                    {summary && (
                        <div className="summary-results" style={{ marginTop: '1.5rem' }}>
                            {/* Header */}
                            <div style={{ marginBottom: '1rem' }}>
                                <h3 style={{ color: '#e2e8f0' }}>📊 {summary.summary}</h3>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                    {summary.fileName && (
                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>File: {summary.fileName}</span>
                                    )}
                                    {summary.aiEngine && (
                                        <span style={{
                                            fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 20,
                                            background: summary.aiEngine.includes('Gemini') ? 'rgba(66,133,244,0.15)' : 'rgba(16,185,129,0.15)',
                                            color: summary.aiEngine.includes('Gemini') ? '#4285f4' : '#10b981',
                                            fontWeight: 600
                                        }}>
                                            {summary.aiEngine.includes('Gemini') ? '✨' : '🔬'} {summary.aiEngine}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Parameter Cards */}
                            {summary.keyFindings?.length > 0 && (
                                <div className="summary-findings">
                                    <h4 style={{ color: '#94a3b8', marginBottom: '0.75rem' }}>Parameters Found ({summary.parsedCount})</h4>
                                    {summary.keyFindings.map((f, i) => {
                                        const meta = STATUS_META[f.status] || STATUS_META.normal;
                                        return (
                                            <div key={i} className={`finding-card finding-${f.status}`}
                                                style={{ borderLeft: `4px solid ${meta.color}`, background: meta.bg }}>
                                                <div className="finding-header">
                                                    <span className="finding-param">{f.parameter}</span>
                                                    <span className="finding-value">{f.value}</span>
                                                    <span style={{ color: meta.color, fontWeight: 700, fontSize: '0.8rem' }}>
                                                        {meta.icon} {meta.label}
                                                    </span>
                                                </div>
                                                <p className="finding-explanation">{f.explanation}</p>
                                                {f.advice && (
                                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', gap: '0.5rem' }}>
                                                        <HiOutlineLightBulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: meta.color }} />
                                                        <span>{f.advice}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Overall advice when abnormals found */}
                            {summary.adviceList?.length > 0 && (
                                <div className="simple-language-box" style={{ marginTop: '1rem' }}>
                                    <h4><HiOutlineShieldExclamation className="inline w-5 h-5 mr-1" />Key Health Advice</h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
                                        {summary.adviceList.map((a, i) => (
                                            <li key={i} style={{ padding: '0.35rem 0', borderBottom: '1px solid rgba(71,85,105,0.2)', fontSize: '0.87rem', color: '#cbd5e1' }}>
                                                {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Simple language summary */}
                            <div className="simple-language-box" style={{ marginTop: '1rem' }}>
                                <h4>🗣️ In Simple Words</h4>
                                <p style={{ color: '#cbd5e1' }}>{summary.simpleLanguage}</p>
                            </div>

                            <div className="analysis-disclaimer small" style={{ marginTop: '1rem' }}>
                                ⚠️ This AI analysis is for informational purposes only. Consult a qualified doctor before making any health decisions.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* DISEASE PREDICTION TAB                                  */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'disease' && (
                <div className="analysis-section">
                    <div className="analysis-input-card">
                        <h3>🧬 Disease Risk Prediction</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Describe your symptoms separated by commas. The AI engine will rank possible conditions by risk.
                        </p>
                        <textarea className="form-textarea" rows={3}
                            placeholder="e.g., fever, cough, fatigue, headache, body aches…"
                            value={symptoms} onChange={e => setSymptoms(e.target.value)} />
                        <div className="symptom-suggestions" style={{ marginTop: '0.75rem' }}>
                            <span className="suggestion-label">Quick add:</span>
                            {['fever', 'cough', 'headache', 'fatigue', 'nausea', 'chest pain', 'shortness of breath', 'joint pain', 'rash', 'dizziness'].map(s => (
                                <button key={s} className="suggestion-chip"
                                    onClick={() => setSymptoms(prev => prev ? `${prev}, ${s}` : s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button className="btn-primary w-full mt-4" onClick={predictDisease} disabled={predicting}>
                            {predicting ? <><div className="spinner-sm" /> Analysing symptoms…</> : '🧬 Predict Disease Risk'}
                        </button>
                    </div>

                    {predictions && (
                        <div className="prediction-results" style={{ marginTop: '1.5rem' }}>
                            <h3>AI Prediction Results</h3>
                            {predictions.predictions.map((pred, i) => (
                                <div key={i} className="prediction-card" style={{ '--pred-color': getSevColor(pred.severity) }}>
                                    <div className="prediction-rank">#{i + 1}</div>
                                    <div className="prediction-info">
                                        <h4>{pred.disease}</h4>
                                        <div className="prediction-bars">
                                            <div className="risk-bar">
                                                <span>Risk Score</span>
                                                <div className="bar-track">
                                                    <div className="bar-fill" style={{ width: `${pred.risk}%`, backgroundColor: getSevColor(pred.severity) }} />
                                                </div>
                                                <span className="bar-value">{pred.risk}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="severity-badge" style={{ color: getSevColor(pred.severity), borderColor: getSevColor(pred.severity) }}>
                                        {pred.severity}
                                    </span>
                                </div>
                            ))}
                            <div className="prediction-recommendation">
                                <strong>📋 Recommendation:</strong> {predictions.recommendation}
                            </div>
                            <div className="analysis-disclaimer small">⚠️ {predictions.disclaimer}</div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* DRUG INTERACTION TAB                                    */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'drugs' && (
                <div className="analysis-section">
                    <div className="analysis-input-card">
                        <h3>💊 Drug Interaction Checker</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Enter the names of medications you're taking. The AI checks all known interaction pairs.
                        </p>
                        <div className="form-group">
                            <label>Medications <span style={{ color: '#64748b' }}>(comma separated)</span></label>
                            <input type="text" className="form-input"
                                placeholder="e.g., Aspirin, Warfarin, Ibuprofen, Metformin"
                                value={drugs} onChange={e => setDrugs(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Known Allergies <span style={{ color: '#64748b' }}>(optional)</span></label>
                            <input type="text" className="form-input"
                                placeholder="e.g., Penicillin, Sulfa drugs"
                                value={allergies} onChange={e => setAllergies(e.target.value)} />
                        </div>
                        <button className="btn-primary w-full" onClick={checkInteractions} disabled={checking}>
                            {checking ? <><div className="spinner-sm" /> Checking…</> : '🔍 Check Interactions'}
                        </button>

                        {/* Common pairs hint */}
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(6,182,212,0.07)', borderRadius: 10, fontSize: '0.8rem', color: '#94a3b8' }}>
                            <strong style={{ color: '#06b6d4' }}>Try these known interactions:</strong><br />
                            Aspirin + Warfarin · Metformin + Alcohol · Ibuprofen + Aspirin · Omeprazole + Clopidogrel
                        </div>
                    </div>

                    {interactions && (
                        <div className="interaction-results" style={{ marginTop: '1.5rem' }}>
                            {/* Overall status */}
                            <div className={`interaction-status ${interactions.safe ? 'safe' : 'warning'}`}>
                                {interactions.safe
                                    ? <><HiOutlineCheck className="w-6 h-6" /><span>{interactions.message}</span></>
                                    : <><HiOutlineExclamation className="w-6 h-6" /><span>{interactions.message}</span></>
                                }
                            </div>

                            {/* Interaction cards */}
                            {interactions.interactions.map((inter, i) => (
                                <div key={i} className="interaction-card">
                                    <div className="interaction-drugs">{inter.drugs.join(' + ')}</div>
                                    <span className={`severity-badge severity-${inter.severity}`}>{inter.severity}</span>
                                    <p className="interaction-warning">{inter.warning}</p>
                                </div>
                            ))}

                            {/* Allergy warnings */}
                            {interactions.allergyWarnings?.map((aw, i) => (
                                <div key={`aw-${i}`} className="interaction-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                    <div className="interaction-drugs">Allergy Alert: {aw.drug}</div>
                                    <span className="severity-badge severity-high">allergy</span>
                                    <p className="interaction-warning">{aw.warning}</p>
                                </div>
                            ))}

                            <div className="analysis-disclaimer small" style={{ marginTop: '1rem' }}>
                                ⚠️ Always verify with your pharmacist or prescribing doctor before changing medications.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIAnalysis;
