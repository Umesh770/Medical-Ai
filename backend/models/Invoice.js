import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
    productType: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unit: {
        type: String,
        default: 'kg'
    },
    pricePerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    amount: {
        type: Number,
        required: true
    }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    items: [invoiceItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    taxRate: {
        type: Number,
        default: 18 // GST percentage
    },
    taxAmount: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'overdue'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'credit'],
        default: 'cash'
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueDate: {
        type: Date
    },
    notes: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate invoice number before saving
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const count = await this.constructor.countDocuments() + 1;
        this.invoiceNumber = `INV-${year}${month}-${count.toString().padStart(5, '0')}`;
    }
    next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
