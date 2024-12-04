// config/db.js
const mongoose = require('mongoose');
const fs = require('fs');

const connectDB = async () => {
    try {
        // Direct connection using environment variables
        const dbURI = process.env.MONGODB_URI;
        
        if (!dbURI) {
            console.error('MONGODB_URI is not defined');
            process.exit(1);
        }

        console.log('Attempting to connect to:', dbURI); // Debugging log

        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ssl: true,
            sslValidate: true,
            sslCA: fs.readFileSync('/config/global-bundle.pem'),
            retryWrites: false  // Important for DocumentDB
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
