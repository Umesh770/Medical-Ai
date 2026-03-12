import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    alternatePhone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    businessName: {
        type: String,
        trim: true
    },
    customerType: {
        type: String,
        enum: ['retail', 'wholesale', 'MCC', 'distributor'],
        default: 'retail'
    },
    vehicleDetails: {
        vehicleNumber: String,
        vehicleType: String,
        driverName: String,
        driverPhone: String
    },
    creditLimit: {
        type: Number,
        default: 0
    },
    currentBalance: {
        type: Number,
        default: 0
    },
    isFrequentCustomer: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Index for search
customerSchema.index({ name: 'text', phone: 'text', businessName: 'text' });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
