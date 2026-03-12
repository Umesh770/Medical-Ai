import { useState, useEffect } from 'react';
import {
    HiOutlinePlus,
    HiOutlineDocumentDownload,
    HiOutlineEye,
    HiOutlineCash
} from 'react-icons/hi';
import { invoiceAPI, customerAPI, inventoryAPI } from '../services/api';
import toast from 'react-hot-toast';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [filter, setFilter] = useState('');

    const [formData, setFormData] = useState({
        customer: '',
        items: [{ productType: 'Ice Block', quantity: 1, pricePerUnit: 0, inventoryId: '' }],
        discount: 0,
        paymentMethod: 'cash',
        notes: ''
    });

    const [paymentData, setPaymentData] = useState({
        paidAmount: 0,
        paymentMethod: 'cash'
    });

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            const [invRes, custRes, inventoryRes] = await Promise.all([
                invoiceAPI.getAll({ status: filter }),
                customerAPI.getAll({ limit: 100 }),
                inventoryAPI.getAll()
            ]);
            setInvoices(invRes.data.data);
            setCustomers(custRes.data.data);
            setInventory(inventoryRes.data.data);
        } catch {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await invoiceAPI.create(formData);
            toast.success('Invoice created successfully');
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create invoice');
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        try {
            await invoiceAPI.updatePayment(selectedInvoice._id, paymentData);
            toast.success('Payment recorded');
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            fetchData();
        } catch {
            toast.error('Failed to record payment');
        }
    };

    const downloadPDF = async (id) => {
        try {
            const response = await invoiceAPI.downloadPDF(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            toast.error('Failed to download PDF');
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productType: 'Ice Block', quantity: 1, pricePerUnit: 0, inventoryId: '' }]
        });
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'inventoryId' && value) {
            const inv = inventory.find(i => i._id === value);
            if (inv) {
                newItems[index].pricePerUnit = inv.pricePerUnit;
                newItems[index].productType = inv.productType;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const resetForm = () => {
        setFormData({
            customer: '',
            items: [{ productType: 'Ice Block', quantity: 1, pricePerUnit: 0, inventoryId: '' }],
            discount: 0,
            paymentMethod: 'cash',
            notes: ''
        });
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const tax = subtotal * 0.18;
        return subtotal + tax - formData.discount;
    };

    const statusColors = {
        pending: 'badge-warning',
        partial: 'badge-info',
        paid: 'badge-success',
        overdue: 'badge-danger'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('')}
                        className={`px-4 py-2 rounded-xl text-sm transition-colors ${!filter ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-xl text-sm transition-colors ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('paid')}
                        className={`px-4 py-2 rounded-xl text-sm transition-colors ${filter === 'paid' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                        Paid
                    </button>
                </div>
                <button
                    onClick={() => { setShowModal(true); resetForm(); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <HiOutlinePlus className="w-5 h-5" />
                    Create Invoice
                </button>
            </div>

            {/* Invoices Table */}
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
                                    <th className="text-left p-4 text-slate-400 font-medium">Invoice #</th>
                                    <th className="text-left p-4 text-slate-400 font-medium">Customer</th>
                                    <th className="text-left p-4 text-slate-400 font-medium">Date</th>
                                    <th className="text-right p-4 text-slate-400 font-medium">Amount</th>
                                    <th className="text-center p-4 text-slate-400 font-medium">Status</th>
                                    <th className="text-center p-4 text-slate-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice._id} className="table-row">
                                        <td className="p-4 text-white font-medium">{invoice.invoiceNumber}</td>
                                        <td className="p-4">
                                            <p className="text-white">{invoice.customer?.name}</p>
                                            <p className="text-sm text-slate-400">{invoice.customer?.phone}</p>
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <p className="text-white font-semibold">₹{invoice.totalAmount?.toLocaleString()}</p>
                                            {invoice.paidAmount > 0 && invoice.paidAmount < invoice.totalAmount && (
                                                <p className="text-sm text-emerald-400">Paid: ₹{invoice.paidAmount?.toLocaleString()}</p>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`badge ${statusColors[invoice.paymentStatus]}`}>
                                                {invoice.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => downloadPDF(invoice._id)}
                                                    className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                                                    title="Download PDF"
                                                >
                                                    <HiOutlineDocumentDownload className="w-4 h-4" />
                                                </button>
                                                {invoice.paymentStatus !== 'paid' && (
                                                    <button
                                                        onClick={() => { setSelectedInvoice(invoice); setPaymentData({ paidAmount: invoice.totalAmount - invoice.paidAmount, paymentMethod: 'cash' }); setShowPaymentModal(true); }}
                                                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                                        title="Record Payment"
                                                    >
                                                        <HiOutlineCash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {invoices.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-slate-400">No invoices yet. Create your first invoice!</p>
                </div>
            )}

            {/* Create Invoice Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Create Invoice</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Customer *</label>
                                <select
                                    value={formData.customer}
                                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                                    className="input-field"
                                    required
                                >
                                    <option value="">Select customer</option>
                                    {customers.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-slate-300">Items</label>
                                    <button type="button" onClick={addItem} className="text-cyan-400 text-sm hover:text-cyan-300">
                                        + Add Item
                                    </button>
                                </div>

                                {formData.items.map((item, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <select
                                            value={item.inventoryId}
                                            onChange={(e) => updateItem(index, 'inventoryId', e.target.value)}
                                            className="input-field flex-1"
                                        >
                                            <option value="">Select product</option>
                                            {inventory.map(inv => (
                                                <option key={inv._id} value={inv._id}>{inv.productType} (₹{inv.pricePerUnit}/{inv.unit})</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="input-field w-24"
                                            min="1"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={item.pricePerUnit}
                                            onChange={(e) => updateItem(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                            className="input-field w-28"
                                        />
                                        {formData.items.length > 1 && (
                                            <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-300 px-2">
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="input-field"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Discount (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.discount}
                                        onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-slate-300">
                                    <span>Subtotal</span>
                                    <span>₹{calculateSubtotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>GST (18%)</span>
                                    <span>₹{(calculateSubtotal() * 0.18).toLocaleString()}</span>
                                </div>
                                {formData.discount > 0 && (
                                    <div className="flex justify-between text-emerald-400">
                                        <span>Discount</span>
                                        <span>-₹{formData.discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-slate-700">
                                    <span>Total</span>
                                    <span>₹{calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-md p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Record Payment</h2>
                        <p className="text-slate-400 mb-6">Invoice: {selectedInvoice.invoiceNumber}</p>

                        <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Amount (₹)</label>
                                <input
                                    type="number"
                                    value={paymentData.paidAmount}
                                    onChange={(e) => setPaymentData({ ...paymentData, paidAmount: parseFloat(e.target.value) || 0 })}
                                    className="input-field"
                                    max={selectedInvoice.totalAmount - selectedInvoice.paidAmount}
                                    required
                                />
                                <p className="text-sm text-slate-400 mt-1">
                                    Due: ₹{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                                <select
                                    value={paymentData.paymentMethod}
                                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
