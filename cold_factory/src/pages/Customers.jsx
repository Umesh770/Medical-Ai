import { useState, useEffect } from 'react';
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineSearch,
    HiOutlinePhone,
    HiOutlineLocationMarker
} from 'react-icons/hi';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        alternatePhone: '',
        address: { street: '', city: '', state: '', pincode: '' },
        gstNumber: '',
        businessName: '',
        customerType: 'retail',
        creditLimit: 0,
        notes: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, [searchQuery]);

    const fetchCustomers = async () => {
        try {
            const response = await customerAPI.getAll({ search: searchQuery });
            setCustomers(response.data.data);
        } catch {
            toast.error('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCustomer) {
                await customerAPI.update(editingCustomer._id, formData);
                toast.success('Customer updated successfully');
            } else {
                await customerAPI.create(formData);
                toast.success('Customer added successfully');
            }
            setShowModal(false);
            setEditingCustomer(null);
            resetForm();
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            alternatePhone: customer.alternatePhone || '',
            address: customer.address || { street: '', city: '', state: '', pincode: '' },
            gstNumber: customer.gstNumber || '',
            businessName: customer.businessName || '',
            customerType: customer.customerType,
            creditLimit: customer.creditLimit,
            notes: customer.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await customerAPI.delete(id);
                toast.success('Customer deleted');
                fetchCustomers();
            } catch {
                toast.error('Failed to delete customer');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            alternatePhone: '',
            address: { street: '', city: '', state: '', pincode: '' },
            gstNumber: '',
            businessName: '',
            customerType: 'retail',
            creditLimit: 0,
            notes: ''
        });
    };

    const customerTypes = [
        { value: 'retail', label: 'Retail', color: 'badge-info' },
        { value: 'wholesale', label: 'Wholesale', color: 'badge-success' },
        { value: 'MCC', label: 'MCC', color: 'badge-warning' },
        { value: 'distributor', label: 'Distributor', color: 'badge-danger' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-12"
                    />
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditingCustomer(null); resetForm(); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <HiOutlinePlus className="w-5 h-5" />
                    Add Customer
                </button>
            </div>

            {/* Customer Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map((customer) => (
                        <div key={customer._id} className="glass-card p-5 hover:scale-[1.02] transition-transform">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{customer.name}</h3>
                                    {customer.businessName && (
                                        <p className="text-sm text-slate-400">{customer.businessName}</p>
                                    )}
                                </div>
                                <span className={`badge ${customerTypes.find(t => t.value === customer.customerType)?.color}`}>
                                    {customer.customerType}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <HiOutlinePhone className="w-4 h-4 text-slate-400" />
                                    {customer.phone}
                                </div>
                                {customer.address?.city && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <HiOutlineLocationMarker className="w-4 h-4 text-slate-400" />
                                        {customer.address.city}, {customer.address.state}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                                <div>
                                    <p className="text-xs text-slate-400">Balance</p>
                                    <p className={`font-semibold ${customer.currentBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        ₹{customer.currentBalance?.toLocaleString() || 0}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(customer)}
                                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 transition-colors"
                                    >
                                        <HiOutlinePencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(customer._id)}
                                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {customers.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-slate-400">No customers found. Add your first customer!</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">
                            {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Customer Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Customer Type</label>
                                    <select
                                        value={formData.customerType}
                                        onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                                        className="input-field"
                                    >
                                        {customerTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
                                    <input
                                        type="text"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">GST Number</label>
                                    <input
                                        type="text"
                                        value={formData.gstNumber}
                                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                                    <input
                                        type="text"
                                        value={formData.address.city}
                                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                        className="input-field"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Credit Limit (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.creditLimit}
                                        onChange={(e) => setFormData({ ...formData, creditLimit: parseInt(e.target.value) || 0 })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingCustomer(null); }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingCustomer ? 'Update' : 'Add'} Customer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
