import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyConnection = async () => {
    console.log('Testing MongoDB Connection...');
    console.log('URI:', process.env.MONGODB_URI ? 'Defined (hidden)' : 'Undefined');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected Successfully!');

        // List collections to ensure we can actually read from the DB
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📊 Available Collections:', collections.map(c => c.name).join(', '));

        await mongoose.connection.close();
        console.log('Connection closed.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection Failed:', err);
        process.exit(1);
    }
};

verifyConnection();
