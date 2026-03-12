import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['production', 'sale', 'transfer', 'adjustment', 'waste'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    previousQuantity: Number,
    newQuantity: Number,
    reference: String,
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const inventorySchema = new mongoose.Schema({
    storageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Storage',
        required: true
    },
    productType: {
        type: String,
        default: 'Ice Block',
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    unit: {
        type: String,
        default: 'kg',
        enum: ['kg', 'tons', 'blocks', 'units']
    },
    pricePerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    batchNumber: {
        type: String,
        trim: true
    },
    productionDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    },
    lowStockThreshold: {
        type: Number,
        default: 100
    },
    isLowStock: {
        type: Boolean,
        default: false
    },
    transactions: [transactionSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update isLowStock before saving
inventorySchema.pre('save', function (next) {
    this.isLowStock = this.quantity <= this.lowStockThreshold;
    this.lastUpdated = new Date();
    next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
