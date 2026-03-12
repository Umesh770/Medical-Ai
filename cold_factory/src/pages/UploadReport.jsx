import { useState, useEffect } from 'react';
import {
    HiOutlineCloudUpload, HiOutlineDocumentReport, HiOutlinePhotograph,
    HiOutlineX, HiOutlineDownload, HiOutlineEye, HiOutlineTrash,
    HiOutlineDocument, HiOutlineCheck, HiOutlineExclamation
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { uploadAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FILE_ICONS = {
    'application/pdf': '📄',
    'image/jpeg': '🖼️', 'image/jpg': '🖼️', 'image/png': '🖼️',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/msword': '📝',
};

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.docx,.doc';

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d) => new Date(d).toLocaleDateString('en', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

const UploadReport = () => {
    const { user } = useAuth();
    const [dragActive, setDragActive] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);  // files to upload (File objects)
    const [savedFiles, setSavedFiles] = useState([]);      // already uploaded (from backend)
    const [uploading, setUploading] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(true);

    useEffect(() => { fetchMyFiles(); }, []);

    const fetchMyFiles = async () => {
        setLoadingFiles(true);
        try {
            const res = await uploadAPI.getMyFiles();
            setSavedFiles(res.data.data || []);
        } catch {
            setSavedFiles([]);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); setDragActive(false);
        if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
    };

    const handleInput = (e) => { if (e.target.files) addFiles(Array.from(e.target.files)); };

    const addFiles = (newFiles) => {
        const valid = newFiles.filter(f => {
            const ok = [
                'application/pdf', 'image/jpeg', 'image/jpg', 'image/png',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword'
            ].includes(f.type);
            if (!ok) toast.error(`${f.name}: unsupported file type`);
            return ok;
        });
        setPendingFiles(prev => [...prev, ...valid]);
    };

    const removePending = (idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx));

    const handleUpload = async () => {
        if (pendingFiles.length === 0) { toast.error('Select files first'); return; }
        setUploading(true);
        try {
            const formData = new FormData();
            pendingFiles.forEach(f => formData.append('files', f));
            await uploadAPI.upload(formData);
            toast.success(`${pendingFiles.length} file(s) uploaded!`);
            setPendingFiles([]);
            fetchMyFiles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed. Make sure you have a patient profile.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await uploadAPI.deleteFile(id);
            toast.success('File deleted');
            setSavedFiles(prev => prev.filter(f => f._id !== id));
        } catch {
            toast.error('Delete failed');
        }
    };

    const handleDownload = (id, name) => {
        const url = uploadAPI.downloadUrl(id);
        const a = document.createElement('a');
        const token = localStorage.getItem('token');
        // Use fetch with auth token
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => {
                const bUrl = URL.createObjectURL(blob);
                a.href = bUrl; a.download = name; a.click();
                URL.revokeObjectURL(bUrl);
            })
            .catch(() => toast.error('Download failed'));
    };

    const handleView = (id, fileType) => {
        const url = uploadAPI.downloadUrl(id);
        const token = localStorage.getItem('token');
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => {
                const bUrl = URL.createObjectURL(blob);
                window.open(bUrl, '_blank');
            })
            .catch(() => toast.error('Preview failed'));
    };

    return (
        <div className="upload-report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Upload Medical Files</h1>
                    <p className="page-subtitle">Securely upload and manage your medical documents. Supported: PDF, JPG, PNG, DOCX</p>
                </div>
            </div>

            {/* Drop Zone — the whole area is clickable */}
            <label
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                style={{ cursor: 'pointer', display: 'block' }}
                onDragEnter={handleDrag} onDragLeave={handleDrag}
                onDragOver={handleDrag} onDrop={handleDrop}
            >
                <input type="file" multiple accept={ACCEPTED} onChange={handleInput} hidden />
                <div className="upload-icon-wrapper">
                    <HiOutlineCloudUpload className="w-12 h-12" />
                </div>
                <p className="upload-text"><strong>Drag &amp; drop files here</strong></p>
                <p className="upload-subtext">
                    or <span className="upload-browse">browse</span> to select files
                </p>
                <p className="upload-formats">
                    <HiOutlinePhotograph className="inline w-4 h-4 mr-1" />
                    PDF · JPG · PNG · DOCX
                </p>
            </label>

            {/* Pending Files (queued for upload) */}
            {pendingFiles.length > 0 && (
                <div className="uploaded-files">
                    <h3>Ready to Upload ({pendingFiles.length})</h3>
                    {pendingFiles.map((file, i) => (
                        <div key={i} className="file-item">
                            <div className="file-icon">
                                <span style={{ fontSize: 20 }}>{FILE_ICONS[file.type] || '📎'}</span>
                            </div>
                            <div className="file-info">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatSize(file.size)}</span>
                            </div>
                            <button className="file-remove" onClick={() => removePending(i)} title="Remove">
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button className="btn-primary w-full mt-4" onClick={handleUpload} disabled={uploading}>
                        {uploading
                            ? <><div className="spinner-sm"></div> Uploading...</>
                            : <><HiOutlineCloudUpload className="w-5 h-5" /> Upload {pendingFiles.length} File(s)</>}
                    </button>
                </div>
            )}

            {/* Saved Files (from backend) */}
            <div className="uploaded-files" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>My Uploaded Files</h3>
                    <button className="btn-secondary btn-sm" onClick={fetchMyFiles}>↻ Refresh</button>
                </div>

                {loadingFiles ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        <div className="spinner-sm" style={{ margin: 'auto' }}></div>
                    </div>
                ) : savedFiles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                        <HiOutlineDocument className="w-12 h-12" style={{ margin: '0 auto 1rem' }} />
                        <p>No files uploaded yet.</p>
                    </div>
                ) : (
                    savedFiles.map(file => (
                        <div key={file._id} className="file-item" style={{ alignItems: 'flex-start' }}>
                            <div className="file-icon">
                                <span style={{ fontSize: 22 }}>{FILE_ICONS[file.fileType] || '📎'}</span>
                            </div>
                            <div className="file-info" style={{ flex: 1 }}>
                                <span className="file-name">{file.originalName}</span>
                                <span className="file-size">
                                    {formatSize(file.fileSize)} &nbsp;·&nbsp; Uploaded: {formatDate(file.uploadedAt)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                {/* View (for images/PDF) */}
                                {(file.fileType.startsWith('image/') || file.fileType === 'application/pdf') && (
                                    <button
                                        className="btn-sm"
                                        style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: 'none', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                        onClick={() => handleView(file._id, file.fileType)}
                                        title="View"
                                    >
                                        <HiOutlineEye className="w-4 h-4" /> View
                                    </button>
                                )}
                                {/* Download */}
                                <button
                                    className="btn-sm"
                                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    onClick={() => handleDownload(file._id, file.originalName)}
                                    title="Download"
                                >
                                    <HiOutlineDownload className="w-4 h-4" /> Download
                                </button>
                                {/* Delete */}
                                <button
                                    className="btn-sm"
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    onClick={() => handleDelete(file._id, file.originalName)}
                                    title="Delete"
                                >
                                    <HiOutlineTrash className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Info */}
            <div className="info-cards-row">
                <div className="info-card info-card-success">
                    <div className="info-card-icon">🔒</div>
                    <div>
                        <h4>Secure Storage</h4>
                        <ul>
                            <li>Files are stored securely on the server</li>
                            <li>Only you can view and manage your files</li>
                            <li>Supported: PDF, JPG, PNG, DOCX (max 10 MB each)</li>
                            <li>Download or share with your doctor anytime</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadReport;
