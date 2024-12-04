const mongoose = require('mongoose');
const fs = require('fs');

const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URI;
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            tls: true, // Use TLS instead of SSL
            tlsCAFile: './config/global-bundle.pem',
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
