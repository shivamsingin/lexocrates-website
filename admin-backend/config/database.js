const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('⚠️  Server will continue without database connection for testing purposes');
    console.log('💡 To enable full functionality, install and start MongoDB');
    // Don't exit process for testing purposes
    // process.exit(1);
  }
};

module.exports = connectDB;
