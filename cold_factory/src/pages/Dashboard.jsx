import { useState, useEffect } from 'react';
import {
    HiOutlineCube,
    HiOutlineUsers,
    HiOutlineCurrencyRupee,
    HiOutlineExclamation,
    HiOutlineTrendingUp,
    HiOutlineServer
} from 'react-icons/hi';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { dashboardAPI } from '../services/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await dashboardAPI.getStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const salesChartData = {
        labels: stats?.weeklySales?.map(s => s._id) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Sales (₹)',
                data: stats?.weeklySales?.map(s => s.total) || [0, 0, 0, 0, 0, 0, 0],
                fill: true,
                borderColor: '#22d3ee',
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#22d3ee',
            },
        ],
    };

    const storageChartData = {
        labels: ['Used', 'Available'],
        datasets: [
            {
                data: [stats?.storage?.totalUsed || 0, (stats?.storage?.totalCapacity || 100) - (stats?.storage?.totalUsed || 0)],
                backgroundColor: ['#3b82f6', '#1e293b'],
                borderColor: ['#3b82f6', '#334155'],
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                grid: { color: '#e2e8f0' },
                ticks: { color: '#64748b' },
            },
            y: {
                grid: { color: '#e2e8f0' },
                ticks: { color: '#64748b' },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        cutout: '75%',
    };

    const statCards = [
        {
            title: "Today's Sales",
            value: `₹${stats?.todaySales?.amount?.toLocaleString() || 0}`,
            subtitle: `${stats?.todaySales?.count || 0} invoices`,
            icon: HiOutlineCurrencyRupee,
            color: 'from-emerald-500 to-emerald-600',
        },
        {
            title: 'Total Stock',
            value: `${stats?.inventory?.totalQuantity?.toLocaleString() || 0} kg`,
            subtitle: 'Available inventory',
            icon: HiOutlineCube,
            color: 'from-blue-500 to-blue-600',
        },
        {
            title: 'Customers',
            value: stats?.customers?.total || 0,
            subtitle: 'Active customers',
            icon: HiOutlineUsers,
            color: 'from-purple-500 to-purple-600',
        },
        {
            title: 'Low Stock Alerts',
            value: stats?.inventory?.lowStockCount || 0,
            subtitle: 'Items need attention',
            icon: HiOutlineExclamation,
            color: stats?.inventory?.lowStockCount > 0 ? 'from-red-500 to-red-600' : 'from-slate-500 to-slate-600',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div key={index} className="stat-card group hover:scale-[1.02] transition-transform">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-slate-500 text-sm">{card.title}</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
                                <p className="text-slate-500 text-sm mt-1">{card.subtitle}</p>
                            </div>
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <div className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-800">Weekly Sales</h3>
                        <HiOutlineTrendingUp className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="h-64">
                        <Line data={salesChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Storage Chart */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-800">Storage Usage</h3>
                        <HiOutlineServer className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="h-48 flex items-center justify-center">
                        <div className="relative w-40 h-40">
                            <Doughnut data={storageChartData} options={doughnutOptions} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-800">{stats?.storage?.utilization || 0}%</p>
                                    <p className="text-xs text-slate-500">Used</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Capacity</span>
                            <span className="text-slate-800">{stats?.storage?.totalCapacity?.toLocaleString() || 0} kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Used</span>
                            <span className="text-cyan-600">{stats?.storage?.totalUsed?.toLocaleString() || 0} kg</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Invoices</h3>
                    <div className="space-y-3">
                        {stats?.recentInvoices?.length > 0 ? (
                            stats.recentInvoices.map((invoice) => (
                                <div key={invoice._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="text-slate-800 font-medium">{invoice.invoiceNumber}</p>
                                        <p className="text-sm text-slate-500">{invoice.customer?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-800 font-medium">₹{invoice.totalAmount?.toLocaleString()}</p>
                                        <span className={`badge ${invoice.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                            {invoice.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-8">No invoices yet</p>
                        )}
                    </div>
                </div>

                {/* Low Stock Items */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Low Stock Alerts</h3>
                    <div className="space-y-3">
                        {stats?.lowStockItems?.length > 0 ? (
                            stats.lowStockItems.map((item) => (
                                <div key={item._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="text-slate-800 font-medium">{item.productType}</p>
                                        <p className="text-sm text-slate-500">{item.storageId?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-red-500 font-medium">{item.quantity} {item.unit}</p>
                                        <span className="badge badge-danger">Low Stock</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-8">No low stock items 🎉</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
