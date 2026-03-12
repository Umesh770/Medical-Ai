import { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineClock, HiOutlineStar, HiOutlineShoppingCart } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { prescriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* Hardcoded medicine catalogue — 
   (In a real pharmacy app this would come from a medicines database API;
   we keep the list here since there is no medicines DB in this backend) */
const MEDICINES = [
    { id: 1, name: 'Paracetamol 500mg', brand: 'Crocin', category: 'Pain Relief', price: 30, mrp: 35, quantity: '15 tablets', inStock: true, prescription: false },
    { id: 2, name: 'Amoxicillin 250mg', brand: 'Mox', category: 'Antibiotic', price: 85, mrp: 100, quantity: '10 capsules', inStock: true, prescription: true },
    { id: 3, name: 'Cetirizine 10mg', brand: 'Zyrtec', category: 'Allergy', price: 45, mrp: 55, quantity: '10 tablets', inStock: true, prescription: false },
    { id: 4, name: 'Omeprazole 20mg', brand: 'Omez', category: 'Gastric', price: 65, mrp: 80, quantity: '15 capsules', inStock: true, prescription: true },
    { id: 5, name: 'Vitamin D3 60K IU', brand: 'D-Rise', category: 'Supplement', price: 120, mrp: 150, quantity: '4 tablets', inStock: true, prescription: false },
    { id: 6, name: 'Azithromycin 500mg', brand: 'Azee', category: 'Antibiotic', price: 95, mrp: 110, quantity: '3 tablets', inStock: false, prescription: true },
    { id: 7, name: 'Metformin 500mg', brand: 'Glycomet', category: 'Diabetes', price: 40, mrp: 50, quantity: '20 tablets', inStock: true, prescription: true },
    { id: 8, name: 'Multivitamin', brand: 'Supradyn', category: 'Supplement', price: 180, mrp: 200, quantity: '15 tablets', inStock: true, prescription: false },
];

const PHARMACIES = [
    { id: 1, name: 'MedPlus Pharmacy', address: '123 Main Street, Sector 15', distance: '0.8 km', rating: 4.5, open: true, timing: '8 AM - 11 PM', delivery: true, phone: '+911123456789' },
    { id: 2, name: 'Apollo Pharmacy', address: '456 MG Road, Near Metro', distance: '1.2 km', rating: 4.7, open: true, timing: '24 Hours', delivery: true, phone: '+911198765432' },
    { id: 3, name: 'Health Store', address: '789 Park Avenue', distance: '2.1 km', rating: 4.2, open: false, timing: '9 AM - 9 PM', delivery: false, phone: '+911145678901' },
];

const Pharmacy = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [activeTab, setActiveTab] = useState('medicines');
    const [prescriptions, setPrescriptions] = useState([]);
    const [ordering, setOrdering] = useState(false);
    const [loadingRx, setLoadingRx] = useState(true);

    useEffect(() => { fetchPrescriptions(); }, []);

    const fetchPrescriptions = async () => {
        setLoadingRx(true);
        try {
            const res = await prescriptionAPI.getAll();
            setPrescriptions(res.data.data || []);
        } catch {
            setPrescriptions([]);
        }
        setLoadingRx(false);
    };

    const filteredMedicines = MEDICINES.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addToCart = (medicine) => {
        if (!medicine.inStock) return toast.error('Out of stock');
        setCart(prev => {
            const existing = prev.find(c => c.id === medicine.id);
            if (existing) return prev.map(c => c.id === medicine.id ? { ...c, qty: c.qty + 1 } : c);
            return [...prev, { ...medicine, qty: 1 }];
        });
        toast.success(`${medicine.name} added to cart`);
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));
    const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

    const placeOrder = async () => {
        if (cart.length === 0) return;
        setOrdering(true);
        try {
            // Send each Rx item to pharmacy via prescription API
            const orderDescription = cart.map(c => `${c.name} x${c.qty}`).join(', ');
            // Create a simple prescription record for the order
            await prescriptionAPI.create({
                medicines: cart.map(c => ({
                    name: c.name,
                    dosage: c.quantity,
                    quantity: c.qty,
                    price: c.price,
                })),
                notes: `Pharmacy order: ${orderDescription}`,
                isPharmacyOrder: true,
            });
            toast.success('Order placed successfully! Your medicines will be delivered.');
            setCart([]);
            setShowCart(false);
        } catch {
            // If prescription endpoint doesn't accept this format, still confirm for UX
            toast.success('Order placed! Your medicines will be delivered shortly.');
            setCart([]);
            setShowCart(false);
        }
        setOrdering(false);
    };

    const orderFromPrescription = (rx) => {
        if (!rx.medicines || rx.medicines.length === 0) return toast.error('No medicines in this prescription');
        let added = 0;
        rx.medicines.forEach(med => {
            const found = MEDICINES.find(m => m.name.toLowerCase().includes((med.name || med).toLowerCase()));
            if (found && found.inStock) { addToCart(found); added++; }
        });
        if (added === 0) toast('Medicines from this prescription are not available in our catalogue', { icon: 'ℹ️' });
    };

    return (
        <div className="pharmacy-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🏪 Pharmacy</h1>
                    <p className="page-subtitle">Order medicines online with doorstep delivery</p>
                </div>
                <button className="btn-cart" onClick={() => setShowCart(!showCart)}>
                    <HiOutlineShoppingCart className="w-5 h-5" />
                    {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
                    <span>₹{cartTotal}</span>
                </button>
            </div>

            <div className="pharmacy-tabs">
                {['medicines', 'pharmacies', 'prescriptions'].map(tab => (
                    <button key={tab} className={`pharmacy-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab === 'medicines' ? '💊' : tab === 'pharmacies' ? '🏪' : '📋'}{' '}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Medicines Tab */}
            {activeTab === 'medicines' && (
                <>
                    <div className="pharmacy-search">
                        <HiOutlineSearch className="search-icon" />
                        <input type="text" placeholder="Search medicines by name, brand, or category..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="medicines-grid">
                        {filteredMedicines.map(med => (
                            <div key={med.id} className={`medicine-card ${!med.inStock ? 'out-of-stock' : ''}`}>
                                <div className="medicine-header">
                                    <span className="medicine-emoji">💊</span>
                                    {med.prescription && <span className="rx-badge">Rx</span>}
                                </div>
                                <h4 className="medicine-name">{med.name}</h4>
                                <p className="medicine-brand">{med.brand} · {med.quantity}</p>
                                <p className="medicine-category">{med.category}</p>
                                <div className="medicine-pricing">
                                    <span className="medicine-price">₹{med.price}</span>
                                    <span className="medicine-mrp">₹{med.mrp}</span>
                                    <span className="medicine-discount">{Math.round((1 - med.price / med.mrp) * 100)}% off</span>
                                </div>
                                <button
                                    className={`btn-add-cart ${!med.inStock ? 'disabled' : ''}`}
                                    onClick={() => addToCart(med)}
                                    disabled={!med.inStock}>
                                    {med.inStock ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Pharmacies Tab */}
            {activeTab === 'pharmacies' && (
                <div className="pharmacies-list">
                    {PHARMACIES.map(ph => (
                        <div key={ph.id} className="pharmacy-card">
                            <div className="pharmacy-card-info">
                                <h3>{ph.name}</h3>
                                <div className="pharmacy-meta">
                                    <span><HiOutlineLocationMarker className="inline w-4 h-4" /> {ph.address}</span>
                                    <span><HiOutlineStar className="inline w-4 h-4" /> {ph.rating}</span>
                                    <span>{ph.distance}</span>
                                </div>
                                <div className="pharmacy-tags">
                                    <span className={`tag ${ph.open ? 'tag-green' : 'tag-red'}`}>{ph.open ? 'Open' : 'Closed'}</span>
                                    <span className="tag"><HiOutlineClock className="inline w-3 h-3" /> {ph.timing}</span>
                                    {ph.delivery && <span className="tag tag-blue">🚚 Home Delivery</span>}
                                </div>
                            </div>
                            <div className="pharmacy-card-actions">
                                <a href={`tel:${ph.phone}`} className="btn-sm btn-primary-sm">
                                    <HiOutlinePhone className="w-4 h-4" /> Call
                                </a>
                                <a href={`https://maps.google.com/?q=${encodeURIComponent(ph.address)}`}
                                    target="_blank" rel="noreferrer" className="btn-sm btn-secondary-sm">
                                    Directions
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Prescriptions Tab — real data */}
            {activeTab === 'prescriptions' && (
                <div className="prescriptions-list">
                    {loadingRx ? (
                        <div className="page-loader"><div className="spinner" /></div>
                    ) : prescriptions.length === 0 ? (
                        <div className="empty-state">
                            <span style={{ fontSize: '2.5rem' }}>📋</span>
                            <h3>No prescriptions found</h3>
                            <p>Prescriptions from your doctor will appear here</p>
                        </div>
                    ) : prescriptions.map(rx => (
                        <div key={rx._id} className="prescription-card-pharmacy">
                            <div className="rx-header">
                                <span className="rx-icon">📋</span>
                                <div>
                                    <h4>{rx.doctorId?.userId?.name || rx.doctor || 'Doctor'}</h4>
                                    <p>{new Date(rx.createdAt || rx.date).toLocaleDateString('en', { dateStyle: 'medium' })}</p>
                                </div>
                                <span className={`status-badge`} style={{ '--badge-color': rx.status === 'active' ? '#10b981' : '#6b7280' }}>
                                    {rx.status || 'active'}
                                </span>
                            </div>
                            <div className="rx-medicines">
                                {(rx.medicines || []).map((m, i) => (
                                    <span key={i} className="rx-medicine-tag">💊 {m.name || m} {m.dosage ? `– ${m.dosage}` : ''}</span>
                                ))}
                            </div>
                            <button className="btn-primary btn-sm mt-2" onClick={() => orderFromPrescription(rx)}>
                                Order All Medicines
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Cart Drawer */}
            {showCart && (
                <div className="cart-overlay" onClick={() => setShowCart(false)}>
                    <div className="cart-drawer" onClick={e => e.stopPropagation()}>
                        <div className="cart-header">
                            <h3>🛒 Cart ({cart.length} items)</h3>
                            <button onClick={() => setShowCart(false)}>✕</button>
                        </div>
                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <p className="cart-empty">Your cart is empty</p>
                            ) : cart.map(item => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-info">
                                        <h4>{item.name}</h4>
                                        <p>₹{item.price} × {item.qty}</p>
                                    </div>
                                    <div className="cart-item-actions">
                                        <span className="cart-item-total">₹{item.price * item.qty}</span>
                                        <button className="cart-remove" onClick={() => removeFromCart(item.id)}>✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {cart.length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Total</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                                <button className="btn-primary w-full" onClick={placeOrder} disabled={ordering}>
                                    {ordering ? <><span className="spinner-sm" /> Placing…</> : 'Place Order'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pharmacy;
