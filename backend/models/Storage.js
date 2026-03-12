import mongoose from 'mongoose';

const storageSchema = new mongoose.Schema({
    storageId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: [true, 'Storage name is required'],
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    totalCapacity: {
        type: Number,
        required: [true, 'Total capacity is required'],
        min: 0
    },
    currentQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    unit: {
        type: String,
        default: 'kg',
        enum: ['kg', 'tons', 'blocks', 'units']
    },
    temperature: {
        current: { type: Number },
        min: { type: Number, default: -25 },
        max: { type: Number, default: -15 }
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'inactive'],
        default: 'active'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for available capacity
storageSchema.virtual('availableCapacity').get(function () {
    return this.totalCapacity - this.currentQuantity;
});

// Virtual for capacity percentage
storageSchema.virtual('capacityPercentage').get(function () {
    return Math.round((this.currentQuantity / this.totalCapacity) * 100);
});

storageSchema.set('toJSON', { virtuals: true });

const Storage = mongoose.model('Storage', storageSchema);
export default Storage;
