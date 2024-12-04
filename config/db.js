require('dotenv').config();
const mongoose = require('mongoose');
const { SecretsManager } = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const connectDB = async () => {
    try {
        // Check if using Secrets Manager
        if (process.env.USE_SECRETS_MANAGER === 'true') {
            const secretsManager = new SecretsManager({ region: 'us-east-1' });
            
            // Retrieve credentials from Secrets Manager
            const data = await secretsManager.getSecretValue({ 
                SecretId: process.env.DOCUMENTDB_SECRET_NAME 
            }).promise();
            
            const secret = JSON.parse(data.SecretString);
            
            // Construct connection URI
            const dbURI = `mongodb://${secret.username}:${secret.password}@${secret.endpoint}:27017/?tls=true&tlsCAFile=/config/global-bundle.pem&retryWrites=false`;
            
            // Verify certificate exists
            const certPath = '/config/global-bundle.pem';
            if (!fs.existsSync(certPath)) {
                throw new Error(`Certificate not found at ${certPath}`);
            }

            // Connect to DocumentDB
            await mongoose.connect(dbURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                ssl: true,
                sslValidate: true,
                sslCA: fs.readFileSync(certPath)
            });
        } else {
            // Fallback to environment variable connection
            const dbURI = process.env.MONGODB_URI;
            
            await mongoose.connect(dbURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                ssl: true,
                sslValidate: true,
                sslCA: fs.readFileSync('/config/global-bundle.pem')
            });
        }

        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
