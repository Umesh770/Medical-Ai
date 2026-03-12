import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from './models/Patient.js';
import Doctor from './models/Doctor.js';
import Truck from './models/Truck.js';
import Storage from './models/Storage.js';
import User from './models/User.js';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data (optional, but good for testing)
        // await User.deleteMany({});
        // await Patient.deleteMany({});
        // await Doctor.deleteMany({});
        // await Truck.deleteMany({});
        // await Storage.deleteMany({});

        // 1. Create Users (Patient & Doctor)
        const patientUser = await User.create({
            name: 'John Doe',
            email: `patient_${Date.now()}@example.com`, // Ensure uniqueness
            password: 'password123',
            role: 'patient',
            phone: '+1234567890'
        });
        console.log('✅ Patient User created:', patientUser._id);

        const doctorUser = await User.create({
            name: 'Dr. Jane Smith',
            email: `doctor_${Date.now()}@example.com`,
            password: 'password123',
            role: 'doctor',
            phone: '+0987654321'
        });
        console.log('✅ Doctor User created:', doctorUser._id);

        // 2. Create Patient Profile
        const patient = new Patient({
            userId: patientUser._id,
            dateOfBirth: new Date('1990-01-01'),
            gender: 'male',
            address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                pincode: '10001' // Changed from zipCode
            },
            bloodGroup: 'O+',
            medicalHistory: []
        });
        await patient.save();
        console.log('✅ Patient Profile seeded');

        // 3. Create Doctor Profile
        const doctor = new Doctor({
            userId: doctorUser._id,
            specialization: 'Cardiology',
            licenseNumber: `MD-${Date.now()}`, // Ensure uniqueness
            experience: 10,
            department: 'Cardiology',
            availability: [{
                day: 'monday', // Lowercase enum
                startTime: '09:00',
                endTime: '17:00'
            }]
        });
        await doctor.save();
        console.log('✅ Doctor Profile seeded');

        // 4. Create Truck
        const truck = new Truck({
            vehicleNumber: `TRK-${Math.floor(Math.random() * 1000)}`, // Changed from truckId
            driverName: 'Rajesh Kumar', // Changed structure
            driverPhone: '+91 98765 43210',
            status: 'en-route', // Changed from in-transit
            currentLocation: {
                latitude: 28.6139,
                longitude: 77.2090
            },
            cargo: "Vaccines", // Keeping simple string due to schema ambiguity
            isActive: true
        });
        await truck.save();
        console.log('✅ Truck seeded');

        // 5. Create Storage
        const storage = new Storage({
            storageId: `STR-${Math.floor(Math.random() * 1000)}`,
            name: 'Main Warehouse Cold Room',
            location: 'Warehouse A',
            totalCapacity: 1000,
            currentQuantity: 450,
            unit: 'kg',
            temperature: {
                current: -20,
                min: -25,
                max: -15
            },
            status: 'active'
        });
        await storage.save();
        console.log('✅ Storage seeded');

        console.log('🎉 Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error: ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

seedData();
