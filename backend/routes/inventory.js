import express from 'express';
import Inventory from '../models/Inventory.js';
import Storage from '../models/Storage.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/inventory
// @desc    Get all inventory items
// @access  Private
router.get('/', async (req, res) => {
    try {
        const inventory = await Inventory.find()
            .populate('storageId', 'name storageId location')
            .sort({ lastUpdated: -1 });
        res.json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/inventory/low-stock
// @desc    Get low stock items
// @access  Private
router.get('/low-stock', async (req, res) => {
    try {
        const lowStock = await Inventory.find({ isLowStock: true })
            .populate('storageId', 'name storageId');
        res.json({ success: true, data: lowStock });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/inventory/stats
// @desc    Get inventory statistics
// @access  Private
router.get('/stats', async (req, res) => {
    try {
        const totalInventory = await Inventory.aggregate([
            { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } }
        ]);

        const lowStockCount = await Inventory.countDocuments({ isLowStock: true });

        const storageStats = await Storage.aggregate([
            {
                $group: {
                    _id: null,
                    totalCapacity: { $sum: '$totalCapacity' },
                    totalUsed: { $sum: '$currentQuantity' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalQuantity: totalInventory[0]?.totalQuantity || 0,
                lowStockItems: lowStockCount,
                storageCapacity: storageStats[0]?.totalCapacity || 0,
                storageUsed: storageStats[0]?.totalUsed || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/inventory
// @desc    Create inventory item
// @access  Private
router.post('/', async (req, res) => {
    try {
        const inventory = await Inventory.create(req.body);
        res.status(201).json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/inventory/stock-entry
// @desc    Add stock entry (production)
// @access  Private
router.post('/stock-entry', async (req, res) => {
    try {
        const { inventoryId, quantity, notes, batchNumber } = req.body;

        const inventory = await Inventory.findById(inventoryId);
        if (!inventory) {
            return res.status(404).json({ success: false, message: 'Inventory not found' });
        }

        const previousQuantity = inventory.quantity;
        inventory.quantity += quantity;

        inventory.transactions.push({
            type: 'production',
            quantity,
            previousQuantity,
            newQuantity: inventory.quantity,
            notes,
            performedBy: req.user._id
        });

        if (batchNumber) {
            inventory.batchNumber = batchNumber;
        }

        await inventory.save();

        // Update storage quantity
        await Storage.findByIdAndUpdate(inventory.storageId, {
            $inc: { currentQuantity: quantity },
            lastUpdated: new Date()
        });

        res.json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/inventory/stock-deduct
// @desc    Deduct stock (sale/waste)
// @access  Private
router.post('/stock-deduct', async (req, res) => {
    try {
        const { inventoryId, quantity, type = 'sale', notes, invoiceId } = req.body;

        const inventory = await Inventory.findById(inventoryId);
        if (!inventory) {
            return res.status(404).json({ success: false, message: 'Inventory not found' });
        }

        if (inventory.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
                available: inventory.quantity
            });
        }

        const previousQuantity = inventory.quantity;
        inventory.quantity -= quantity;

        inventory.transactions.push({
            type,
            quantity: -quantity,
            previousQuantity,
            newQuantity: inventory.quantity,
            notes,
            invoiceId,
            performedBy: req.user._id
        });

        await inventory.save();

        // Update storage quantity
        await Storage.findByIdAndUpdate(inventory.storageId, {
            $inc: { currentQuantity: -quantity },
            lastUpdated: new Date()
        });

        res.json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const inventory = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!inventory) {
            return res.status(404).json({ success: false, message: 'Inventory not found' });
        }

        res.json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
