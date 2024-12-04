const mongoose = require('mongoose');
const fs = require('fs');

const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URI;
        
        if (!dbURI) {
            console.error('MONGODB_URI is not defined');
            process.exit(1);
        }

        console.log('Attempting to connect to:', dbURI);

        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ssl: true,
            sslValidate: true,
            sslCA: fs.readFileSync('/config/global-bundle.pem'),
            retryWrites: false
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
};

// IMPORTANT: Use module.exports, not exports.connectDB
module.exports = connectDB;
