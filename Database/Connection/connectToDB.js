const mongoose = require("mongoose");

module.exports = async function connectToDb() {
  const dbUri = process.env.MONGO_DB_URI;

  const options = {
    autoIndex: true,
    connectTimeoutMS: 10000,
  };

  try {
    await mongoose.connect(dbUri, options);
    console.log(
      `Connected to MongoDB at ${dbUri.split("@")[1] || "localhost"}`,
    );
  } catch (error) {
    console.error(`CRITICAL: Database connection failed.`);
    console.error(error.message);

    process.exit(1);
  }
};
