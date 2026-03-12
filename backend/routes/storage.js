import express from 'express';
import Storage from '../models/Storage.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/storage
// @desc    Get all storage rooms
// @access  Private
router.get('/', async (req, res) => {
    try {
        const storages = await Storage.find().sort({ createdAt: -1 });
        res.json({ success: true, data: storages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/storage/:id
// @desc    Get single storage
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const storage = await Storage.findById(req.params.id);

        if (!storage) {
            return res.status(404).json({
                success: false,
                message: 'Storage not found'
            });
        }

        res.json({ success: true, data: storage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/storage
// @desc    Create new storage room
// @access  Private
router.post('/', async (req, res) => {
    try {
        const storage = await Storage.create(req.body);
        res.status(201).json({ success: true, data: storage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/storage/:id
// @desc    Update storage
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        req.body.lastUpdated = new Date();
        const storage = await Storage.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!storage) {
            return res.status(404).json({
                success: false,
                message: 'Storage not found'
            });
        }

        res.json({ success: true, data: storage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/storage/:id
// @desc    Delete storage
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const storage = await Storage.findByIdAndDelete(req.params.id);

        if (!storage) {
            return res.status(404).json({
                success: false,
                message: 'Storage not found'
            });
        }

        res.json({ success: true, message: 'Storage deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
