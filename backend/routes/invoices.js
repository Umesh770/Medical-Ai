import express from 'express';
import PDFDocument from 'pdfkit';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Inventory from '../models/Inventory.js';
import Storage from '../models/Storage.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = {};
        if (status) {
            query.paymentStatus = status;
        }

        const invoices = await Invoice.find(query)
            .populate('customer', 'name phone businessName')
            .sort({ invoiceDate: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Invoice.countDocuments(query);

        res.json({
            success: true,
            data: invoices,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/invoices/:id
// @desc    Get single invoice
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer')
            .populate('createdBy', 'name');

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/invoices
// @desc    Create new invoice (auto-deducts stock)
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { customer, items, discount = 0, paymentMethod, dueDate, notes } = req.body;

        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);

        // Calculate tax (GST)
        const taxRate = parseFloat(process.env.DEFAULT_GST_RATE) || 18;
        const taxAmount = (subtotal * taxRate) / 100;

        // Calculate total
        const totalAmount = subtotal + taxAmount - discount;

        // Create invoice
        const invoice = await Invoice.create({
            customer,
            items: items.map(item => ({
                ...item,
                amount: item.quantity * item.pricePerUnit
            })),
            subtotal,
            taxRate,
            taxAmount,
            discount,
            totalAmount,
            paymentMethod,
            dueDate,
            notes,
            createdBy: req.user._id
        });

        // Auto-deduct from inventory
        for (const item of items) {
            if (item.inventoryId) {
                const inventory = await Inventory.findById(item.inventoryId);
                if (inventory && inventory.quantity >= item.quantity) {
                    inventory.quantity -= item.quantity;
                    inventory.transactions.push({
                        type: 'sale',
                        quantity: -item.quantity,
                        invoiceId: invoice._id,
                        performedBy: req.user._id
                    });
                    await inventory.save();

                    // Update storage
                    await Storage.findByIdAndUpdate(inventory.storageId, {
                        $inc: { currentQuantity: -item.quantity },
                        lastUpdated: new Date()
                    });
                }
            }
        }

        // Update customer balance
        await Customer.findByIdAndUpdate(customer, {
            $inc: { currentBalance: totalAmount }
        });

        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('customer', 'name phone businessName');

        res.status(201).json({ success: true, data: populatedInvoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/invoices/:id/payment
// @desc    Update payment status
// @access  Private
router.put('/:id/payment', async (req, res) => {
    try {
        const { paidAmount, paymentMethod } = req.body;
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        invoice.paidAmount += paidAmount;
        invoice.paymentMethod = paymentMethod || invoice.paymentMethod;

        if (invoice.paidAmount >= invoice.totalAmount) {
            invoice.paymentStatus = 'paid';
        } else if (invoice.paidAmount > 0) {
            invoice.paymentStatus = 'partial';
        }

        await invoice.save();

        // Update customer balance
        await Customer.findByIdAndUpdate(invoice.customer, {
            $inc: { currentBalance: -paidAmount }
        });

        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/invoices/:id/pdf
// @desc    Generate PDF invoice
// @access  Private
router.get('/:id/pdf', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer');

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(24).text('ICE COLD STORAGE', { align: 'center' });
        doc.fontSize(12).text('Tax Invoice', { align: 'center' });
        doc.moveDown();

        // Invoice details
        doc.fontSize(10);
        doc.text(`Invoice No: ${invoice.invoiceNumber}`);
        doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`);
        doc.moveDown();

        // Customer details
        doc.text('Bill To:');
        doc.text(invoice.customer.name);
        if (invoice.customer.businessName) doc.text(invoice.customer.businessName);
        doc.text(invoice.customer.phone);
        if (invoice.customer.gstNumber) doc.text(`GSTIN: ${invoice.customer.gstNumber}`);
        doc.moveDown();

        // Table header
        doc.text('─'.repeat(60));
        doc.text('Item                    Qty        Rate        Amount', { font: 'Helvetica-Bold' });
        doc.text('─'.repeat(60));

        // Items
        invoice.items.forEach(item => {
            doc.text(
                `${item.productType.padEnd(20)} ${String(item.quantity).padStart(6)} ${String(item.pricePerUnit.toFixed(2)).padStart(10)} ${String(item.amount.toFixed(2)).padStart(12)}`
            );
        });

        doc.text('─'.repeat(60));
        doc.moveDown();

        // Totals
        doc.text(`Subtotal: ₹${invoice.subtotal.toFixed(2)}`, { align: 'right' });
        doc.text(`GST (${invoice.taxRate}%): ₹${invoice.taxAmount.toFixed(2)}`, { align: 'right' });
        if (invoice.discount > 0) {
            doc.text(`Discount: -₹${invoice.discount.toFixed(2)}`, { align: 'right' });
        }
        doc.fontSize(12).text(`Total: ₹${invoice.totalAmount.toFixed(2)}`, { align: 'right' });
        doc.moveDown();

        doc.fontSize(10).text(`Payment Status: ${invoice.paymentStatus.toUpperCase()}`);
        doc.text(`Payment Method: ${invoice.paymentMethod}`);

        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
