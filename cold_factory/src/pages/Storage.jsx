import { useState, useEffect } from 'react';
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineServer
} from 'react-icons/hi';
import { storageAPI } from '../services/api';
import toast from 'react-hot-toast';

const Storage = () => {
    const [storages, setStorages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStorage, setEditingStorage] = useState(null);
    const [formData, setFormData] = useState({
        storageId: '',
        name: '',
        location: '',
        totalCapacity: 0,
        currentQuantity: 0,
        unit: 'kg',
        status: 'active'
    });

    useEffect(() => {
        fetchStorages();
    }, []);

    const fetchStorages = async () => {
        try {
            const response = await storageAPI.getAll();
            setStorages(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch storage rooms');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStorage) {
                await storageAPI.update(editingStorage._id, formData);
                toast.success('Storage updated');
            } else {
                await storageAPI.create(formData);
                toast.success('Storage added');
            }
            setShowModal(false);
            setEditingStorage(null);
            resetForm();
            fetchStorages();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (storage) => {
        setEditingStorage(storage);
        setFormData({
            storageId: storage.storageId,
            name: storage.name,
            location: storage.location || '',
            totalCapacity: storage.totalCapacity,
            currentQuantity: storage.currentQuantity,
            unit: storage.unit,
            status: storage.status
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this storage room?')) {
            try {
                await storageAPI.delete(id);
                toast.success('Storage deleted');
                fetchStorages();
            } catch (error) {
                toast.error('Failed to delete storage');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            storageId: '',
            name: '',
            location: '',
            totalCapacity: 0,
            currentQuantity: 0,
            unit: 'kg',
            status: 'active'
        });
    };

    const getUsageColor = (percentage) => {
        if (percentage >= 90) return 'from-red-500 to-red-600';
        if (percentage >= 70) return 'from-amber-500 to-amber-600';
        return 'from-emerald-500 to-emerald-600';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-end">
                <button
                    onClick={() => { setShowModal(true); setEditingStorage(null); resetForm(); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <HiOutlinePlus className="w-5 h-5" />
                    Add Storage Room
                </button>
            </div>

            {/* Storage Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {storages.map((storage) => {
                        const usage = storage.totalCapacity > 0
                            ? Math.round((storage.currentQuantity / storage.totalCapacity) * 100)
                            : 0;

                        return (
                            <div key={storage._id} className="glass-card p-6 relative overflow-hidden">
                                {/* Status indicator */}
                                <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${storage.status === 'active' ? 'bg-emerald-500' :
                                    storage.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'
                                    }`}></div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                                        <HiOutlineServer className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">{storage.name}</h3>
                                        <p className="text-sm text-slate-500">{storage.storageId}</p>
                                        {storage.location && (
                                            <p className="text-sm text-slate-600">{storage.location}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Capacity bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600">Capacity</span>
                                        <span className="text-slate-800 font-medium">{usage}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${getUsageColor(usage)} transition-all duration-500`}
                                            style={{ width: `${Math.min(usage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500">Current</p>
                                        <p className="text-lg font-semibold text-slate-800">
                                            {storage.currentQuantity?.toLocaleString()} {storage.unit}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Total</p>
                                        <p className="text-lg font-semibold text-slate-700">
                                            {storage.totalCapacity?.toLocaleString()} {storage.unit}
                                        </p>
                                    </div>
                                </div>

                                {/* Temperature (if available) */}
                                {storage.temperature?.current && (
                                    <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Temperature</p>
                                        <p className="text-xl font-bold text-cyan-600">
                                            {storage.temperature.current}°C
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                                    <button
                                        onClick={() => handleEdit(storage)}
                                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                    >
                                        <HiOutlinePencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(storage._id)}
                                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {storages.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-slate-400">No storage rooms yet. Add your first storage room!</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-md p-6">
                        <h2 className="text-xl font-semibold text-slate-800 mb-6">
                            {editingStorage ? 'Edit Storage Room' : 'Add Storage Room'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Storage ID *</label>
                                    <input
                                        type="text"
                                        value={formData.storageId}
                                        onChange={(e) => setFormData({ ...formData, storageId: e.target.value.toUpperCase() })}
                                        className="input-field"
                                        placeholder="CS-001"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="active">Active</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Storage Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                    placeholder="Cold Storage Room 1"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="input-field"
                                    placeholder="Building A, Ground Floor"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Total Capacity *</label>
                                    <input
                                        type="number"
                                        value={formData.totalCapacity}
                                        onChange={(e) => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) || 0 })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="kg">Kilograms</option>
                                        <option value="tons">Tons</option>
                                        <option value="blocks">Blocks</option>
                                        <option value="units">Units</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingStorage(null); }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingStorage ? 'Update' : 'Add'} Storage
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Storage;
