const connectDB = async () => {
    try {
        // Direct connection using environment variables
        const dbURI = process.env.MONGODB_URI;
        
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ssl: true,
            sslValidate: true,
            sslCA: fs.readFileSync('/config/global-bundle.pem')
        });

        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};
