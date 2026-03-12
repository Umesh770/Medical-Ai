import express from 'express';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Inventory from '../models/Inventory.js';
import Storage from '../models/Storage.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Today's sales
        const todaySales = await Invoice.aggregate([
            { $match: { invoiceDate: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]);

        // Total inventory
        const inventoryStats = await Inventory.aggregate([
            { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } }
        ]);

        // Low stock count
        const lowStockCount = await Inventory.countDocuments({ isLowStock: true });

        // Total customers
        const totalCustomers = await Customer.countDocuments({ isActive: true });

        // Storage utilization
        const storageStats = await Storage.aggregate([
            {
                $group: {
                    _id: null,
                    totalCapacity: { $sum: '$totalCapacity' },
                    totalUsed: { $sum: '$currentQuantity' }
                }
            }
        ]);

        // Pending payments
        const pendingPayments = await Invoice.aggregate([
            { $match: { paymentStatus: { $in: ['pending', 'partial'] } } },
            { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } }
        ]);

        // Recent invoices
        const recentInvoices = await Invoice.find()
            .populate('customer', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        // Low stock items
        const lowStockItems = await Inventory.find({ isLowStock: true })
            .populate('storageId', 'name')
            .limit(5);

        // Weekly sales data (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weeklySales = await Invoice.aggregate([
            { $match: { invoiceDate: { $gte: weekAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate' } },
                    total: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                todaySales: {
                    amount: todaySales[0]?.total || 0,
                    count: todaySales[0]?.count || 0
                },
                inventory: {
                    totalQuantity: inventoryStats[0]?.totalQuantity || 0,
                    lowStockCount
                },
                storage: {
                    totalCapacity: storageStats[0]?.totalCapacity || 0,
                    totalUsed: storageStats[0]?.totalUsed || 0,
                    utilization: storageStats[0]?.totalCapacity
                        ? Math.round((storageStats[0].totalUsed / storageStats[0].totalCapacity) * 100)
                        : 0
                },
                customers: {
                    total: totalCustomers
                },
                pendingPayments: pendingPayments[0]?.total || 0,
                recentInvoices,
                lowStockItems,
                weeklySales
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
