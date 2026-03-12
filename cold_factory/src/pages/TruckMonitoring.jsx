import { useState, useEffect } from 'react';
import { HiOutlineTruck, HiOutlineLocationMarker, HiOutlineExclamation, HiOutlineRefresh } from 'react-icons/hi';
import { truckAPI } from '../services/api';

const TruckMonitoring = () => {
    const [trucks, setTrucks] = useState([]);
    const [selectedTruck, setSelectedTruck] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchTrucks(); }, []);

    const fetchTrucks = async () => {
        try {
            const res = await truckAPI.getAll();
            setTrucks(res.data.data || []);
        } catch {
            setTrucks([
                {
                    _id: 't1', truckId: 'TRK-001', name: 'Cold Chain Alpha', status: 'in-transit', driver: { name: 'Rajesh Kumar', phone: '+91 98765 43210' }, currentLocation: { lat: 28.6139, lng: 77.2090, address: 'NH-44, Near Sonipat' },
                    temperature: { current: -18.5, min: -25, max: -15, unit: '°C' }, doorStatus: 'closed', battery: 85, lastUpdate: new Date(Date.now() - 300000),
                    alerts: [{ type: 'none' }], cargo: 'Vaccines – 500 units'
                },
                {
                    _id: 't2', truckId: 'TRK-002', name: 'MedFreeze Beta', status: 'in-transit', driver: { name: 'Suresh Verma', phone: '+91 91234 56789' }, currentLocation: { lat: 19.076, lng: 72.8777, address: 'Mumbai-Pune Expressway' },
                    temperature: { current: -12.3, min: -20, max: -15, unit: '°C' }, doorStatus: 'closed', battery: 62, lastUpdate: new Date(Date.now() - 600000),
                    alerts: [{ type: 'temperature', message: 'Temperature above threshold (-15°C)' }], cargo: 'Blood Plasma – 200 units'
                },
                {
                    _id: 't3', truckId: 'TRK-003', name: 'CryoHaul Gamma', status: 'parked', driver: { name: 'Amit Singh', phone: '+91 87654 32100' }, currentLocation: { lat: 12.9716, lng: 77.5946, address: 'Warehouse B, Bangalore' },
                    temperature: { current: -20.1, min: -25, max: -15, unit: '°C' }, doorStatus: 'closed', battery: 95, lastUpdate: new Date(Date.now() - 60000),
                    alerts: [{ type: 'none' }], cargo: 'Insulin Packs – 1000 units'
                },
            ]);
        }
        setLoading(false);
    };

    const getStatusColor = (s) => ({ active: '#10b981', 'in-transit': '#06b6d4', parked: '#f59e0b', maintenance: '#ef4444' }[s] || '#6b7280');
    const getTempColor = (t, max) => t > max ? '#ef4444' : t > max - 3 ? '#f59e0b' : '#10b981';
    const hasAlert = (truck) => truck.alerts?.some(a => a.type !== 'none');

    if (loading) return <div className="page-loader"><div className="spinner"></div></div>;

    return (
        <div className="truck-monitoring-page">
            <div className="page-header">
                <div><h1 className="page-title">🚛 Cold Chain Monitoring</h1><p className="page-subtitle">Real-time fleet & temperature tracking</p></div>
                <button className="btn-primary" onClick={fetchTrucks}><HiOutlineRefresh className="w-5 h-5" /> Refresh</button>
            </div>

            {/* Fleet Overview Stats */}
            <div className="stats-grid">
                <div className="stat-card-health"><div className="stat-icon-wrapper" style={{ background: 'rgba(6,182,212,0.1)' }}><HiOutlineTruck className="w-6 h-6" style={{ color: '#06b6d4' }} /></div><div className="stat-info"><p className="stat-label">Active Trucks</p><h3 className="stat-value" style={{ color: '#06b6d4' }}>{trucks.filter(t => t.status === 'in-transit').length}/{trucks.length}</h3></div></div>
                <div className="stat-card-health"><div className="stat-icon-wrapper" style={{ background: 'rgba(239,68,68,0.1)' }}><HiOutlineExclamation className="w-6 h-6" style={{ color: '#ef4444' }} /></div><div className="stat-info"><p className="stat-label">Active Alerts</p><h3 className="stat-value" style={{ color: '#ef4444' }}>{trucks.filter(hasAlert).length}</h3></div></div>
                <div className="stat-card-health"><div className="stat-icon-wrapper" style={{ background: 'rgba(16,185,129,0.1)' }}><span className="text-xl" style={{ color: '#10b981' }}>🌡️</span></div><div className="stat-info"><p className="stat-label">Avg Temperature</p><h3 className="stat-value" style={{ color: '#10b981' }}>{(trucks.reduce((s, t) => s + t.temperature.current, 0) / trucks.length).toFixed(1)}°C</h3></div></div>
            </div>

            <div className="truck-grid">
                {trucks.map(truck => (
                    <div key={truck._id} className={`truck-card ${hasAlert(truck) ? 'truck-alert' : ''}`} onClick={() => setSelectedTruck(truck._id === selectedTruck?._id ? null : truck)}>
                        <div className="truck-card-header">
                            <div><h3>🚛 {truck.name}</h3><span className="truck-id">{truck.truckId}</span></div>
                            <span className="status-badge" style={{ '--badge-color': getStatusColor(truck.status) }}>{truck.status}</span>
                        </div>

                        {/* Temperature Gauge */}
                        <div className="temp-gauge">
                            <div className="temp-display" style={{ color: getTempColor(truck.temperature.current, truck.temperature.max) }}>
                                <span className="temp-value">{truck.temperature.current}</span>
                                <span className="temp-unit">{truck.temperature.unit}</span>
                            </div>
                            <div className="temp-range">
                                <span>Min: {truck.temperature.min}°C</span>
                                <span>Max: {truck.temperature.max}°C</span>
                            </div>
                            <div className="temp-bar-track">
                                <div className="temp-bar-fill" style={{
                                    width: `${Math.min(100, ((truck.temperature.current - truck.temperature.min) / (truck.temperature.max - truck.temperature.min)) * 100)}%`,
                                    backgroundColor: getTempColor(truck.temperature.current, truck.temperature.max)
                                }}></div>
                            </div>
                        </div>

                        <div className="truck-meta">
                            <span><HiOutlineLocationMarker className="inline w-4 h-4" /> {truck.currentLocation.address}</span>
                            <span>📦 {truck.cargo}</span>
                            <span>🔋 {truck.battery}%</span>
                            <span>🚪 Door: {truck.doorStatus}</span>
                        </div>

                        {hasAlert(truck) && (
                            <div className="truck-alert-banner">
                                <HiOutlineExclamation className="w-5 h-5" />
                                <span>{truck.alerts.find(a => a.type !== 'none')?.message}</span>
                            </div>
                        )}

                        <div className="truck-driver">
                            <span>👤 {truck.driver.name}</span>
                            <span>📱 {truck.driver.phone}</span>
                        </div>

                        <p className="truck-updated">Updated {new Date(truck.lastUpdate).toLocaleTimeString('en', { timeStyle: 'short' })}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TruckMonitoring;
