import { useState, useEffect } from 'react';
import {
    HiOutlinePlus,
    HiOutlineCube,
    HiOutlineExclamation,
    HiOutlineArrowUp,
    HiOutlineArrowDown
} from 'react-icons/hi';
import { inventoryAPI, storageAPI } from '../services/api';
import toast from 'react-hot-toast';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [storages, setStorages] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'entry', 'deduct'
    const [selectedInventory, setSelectedInventory] = useState(null);
    const [formData, setFormData] = useState({
        storageId: '',
        productType: 'Ice Block',
        quantity: 0,
        pricePerUnit: 0,
        unit: 'kg',
        batchNumber: '',
        lowStockThreshold: 100
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [invRes, storRes, statsRes] = await Promise.all([
                inventoryAPI.getAll(),
                storageAPI.getAll(),
                inventoryAPI.getStats()
            ]);
            setInventory(invRes.data.data);
            setStorages(storRes.data.data);
            setStats(statsRes.data.data);
        } catch {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'add') {
                await inventoryAPI.create(formData);
                toast.success('Inventory item created');
            } else if (modalType === 'entry') {
                await inventoryAPI.addStock({
                    inventoryId: selectedInventory._id,
                    quantity: formData.quantity,
                    batchNumber: formData.batchNumber,
                    notes: formData.notes
                });
                toast.success('Stock added successfully');
            } else if (modalType === 'deduct') {
                await inventoryAPI.deductStock({
                    inventoryId: selectedInventory._id,
                    quantity: formData.quantity,
                    type: formData.deductType || 'waste',
                    notes: formData.notes
                });
                toast.success('Stock deducted');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const openStockEntry = (item) => {
        setSelectedInventory(item);
        setModalType('entry');
        setFormData({ quantity: 0, batchNumber: '', notes: '' });
        setShowModal(true);
    };

    const openStockDeduct = (item) => {
        setSelectedInventory(item);
        setModalType('deduct');
        setFormData({ quantity: 0, deductType: 'waste', notes: '' });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            storageId: '',
            productType: 'Ice Block',
            quantity: 0,
            pricePerUnit: 0,
            unit: 'kg',
            batchNumber: '',
            lowStockThreshold: 100
        });
        setSelectedInventory(null);
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                            <HiOutlineCube className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Stock</p>
                            <p className="text-2xl font-bold text-white">{stats?.totalQuantity?.toLocaleString() || 0} kg</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
                            <HiOutlineExclamation className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Low Stock Items</p>
                            <p className="text-2xl font-bold text-white">{stats?.lowStockItems || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500">
                            <HiOutlineArrowUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Storage Capacity</p>
                            <p className="text-2xl font-bold text-white">{stats?.storageCapacity?.toLocaleString() || 0} kg</p>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                            <HiOutlineArrowDown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Storage Used</p>
                            <p className="text-2xl font-bold text-white">{stats?.storageUsed?.toLocaleString() || 0} kg</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
                <button
                    onClick={() => { setModalType('add'); setShowModal(true); resetForm(); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <HiOutlinePlus className="w-5 h-5" />
                    Add Inventory
                </button>
            </div>

            {/* Inventory Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left p-4 text-slate-400 font-medium">Product</th>
                                    <th className="text-left p-4 text-slate-400 font-medium">Storage</th>
                                    <th className="text-right p-4 text-slate-400 font-medium">Quantity</th>
                                    <th className="text-right p-4 text-slate-400 font-medium">Price/Unit</th>
                                    <th className="text-center p-4 text-slate-400 font-medium">Status</th>
                                    <th className="text-center p-4 text-slate-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map((item) => (
                                    <tr key={item._id} className="table-row">
                                        <td className="p-4">
                                            <div>
                                                <p className="text-white font-medium">{item.productType}</p>
                                                <p className="text-sm text-slate-400">Batch: {item.batchNumber || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            {item.storageId?.name || 'Unassigned'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`font-semibold ${item.isLowStock ? 'text-red-400' : 'text-white'}`}>
                                                {item.quantity?.toLocaleString()}
                                            </span>
                                            <span className="text-slate-400 ml-1">{item.unit}</span>
                                        </td>
                                        <td className="p-4 text-right text-white">
                                            ₹{item.pricePerUnit?.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {item.isLowStock ? (
                                                <span className="badge badge-danger">Low Stock</span>
                                            ) : (
                                                <span className="badge badge-success">In Stock</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => openStockEntry(item)}
                                                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                                    title="Add Stock"
                                                >
                                                    <HiOutlineArrowUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openStockDeduct(item)}
                                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                                    title="Deduct Stock"
                                                >
                                                    <HiOutlineArrowDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {inventory.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-slate-400">No inventory items. Add your first item!</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-md p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">
                            {modalType === 'add' && 'Add Inventory Item'}
                            {modalType === 'entry' && `Add Stock - ${selectedInventory?.productType}`}
                            {modalType === 'deduct' && `Deduct Stock - ${selectedInventory?.productType}`}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {modalType === 'add' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Storage Room *</label>
                                        <select
                                            value={formData.storageId}
                                            onChange={(e) => setFormData({ ...formData, storageId: e.target.value })}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Select storage</option>
                                            {storages.map(s => (
                                                <option key={s._id} value={s._id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Product Type</label>
                                        <input
                                            type="text"
                                            value={formData.productType}
                                            onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Initial Quantity</label>
                                            <input
                                                type="number"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Price/Unit (₹)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.pricePerUnit}
                                                onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {(modalType === 'entry' || modalType === 'deduct') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Quantity ({selectedInventory?.unit}) *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                                            className="input-field"
                                            required
                                            min="1"
                                        />
                                        {modalType === 'deduct' && (
                                            <p className="text-sm text-slate-400 mt-1">
                                                Available: {selectedInventory?.quantity} {selectedInventory?.unit}
                                            </p>
                                        )}
                                    </div>

                                    {modalType === 'deduct' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Reason</label>
                                            <select
                                                value={formData.deductType}
                                                onChange={(e) => setFormData({ ...formData, deductType: e.target.value })}
                                                className="input-field"
                                            >
                                                <option value="waste">Waste/Damage</option>
                                                <option value="transfer">Transfer</option>
                                                <option value="adjustment">Adjustment</option>
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="input-field"
                                            rows="2"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {modalType === 'add' && 'Add Item'}
                                    {modalType === 'entry' && 'Add Stock'}
                                    {modalType === 'deduct' && 'Deduct Stock'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
