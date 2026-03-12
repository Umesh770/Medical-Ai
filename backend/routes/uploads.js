import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Upload from '../models/Upload.js';
import Patient from '../models/Patient.js';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, unique + path.extname(file.originalname));
    }
});

const allowedMimes = [
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
];

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (req, file, cb) => {
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, PNG, and DOCX files are allowed'));
        }
    }
});

// @route   POST /api/uploads
router.post('/', protect, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        // Find patient profile
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
            // Clean up files
            req.files.forEach(f => fs.unlinkSync(f.path));
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }

        const saved = await Promise.all(req.files.map(file =>
            Upload.create({
                patientId: patient._id,
                fileName: file.filename,
                originalName: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size,
                filePath: file.path,
            })
        ));

        res.status(201).json({ success: true, data: saved });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/uploads/my-files
router.get('/my-files', protect, async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

        const files = await Upload.find({ patientId: patient._id }).sort({ uploadedAt: -1 });
        res.json({ success: true, data: files });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/uploads/:id/download
router.get('/:id/download', protect, async (req, res) => {
    try {
        const file = await Upload.findById(req.params.id);
        if (!file) return res.status(404).json({ success: false, message: 'File not found' });

        if (!fs.existsSync(file.filePath)) {
            return res.status(404).json({ success: false, message: 'File not found on disk' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.fileType);
        res.sendFile(file.filePath);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/uploads/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const file = await Upload.findById(req.params.id);
        if (!file) return res.status(404).json({ success: false, message: 'File not found' });

        // Delete from disk
        if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        await Upload.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
