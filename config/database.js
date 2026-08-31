const dns = require("node:dns");
const mongoose = require("mongoose");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

async function connectDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conected to MongoDB");
}

module.exports = connectDatabase;
