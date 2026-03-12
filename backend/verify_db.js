import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Alert from './models/Alert.js';
import Appointment from './models/Appointment.js';
import Customer from './models/Customer.js';
import Doctor from './models/Doctor.js';
import EHR from './models/EHR.js';
import Inventory from './models/Inventory.js';
import Invoice from './models/Invoice.js';
import LabTest from './models/LabTest.js';
import Message from './models/Message.js';
import Patient from './models/Patient.js';
import Prescription from './models/Prescription.js';
import Storage from './models/Storage.js';
import Truck from './models/Truck.js';
import User from './models/User.js';

dotenv.config();

const models = {
    Alert,
    Appointment,
    Customer,
    Doctor,
    EHR,
    Inventory,
    Invoice,
    LabTest,
    Message,
    Patient,
    Prescription,
    Storage,
    Truck,
    User
};

async function verifyData() {
    try {
        // Suppress Mongoose warnings
        mongoose.set('strictQuery', false);

        await mongoose.connect(process.env.MONGODB_URI);

        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));

        const results = {};
        for (const [name, model] of Object.entries(models)) {
            const count = await model.countDocuments();
            results[name] = count;
        }

        console.log('__JSON_START__');
        console.log(JSON.stringify(results, null, 2));
        console.log('__JSON_END__');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyData();
