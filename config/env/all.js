const crypto = require("crypto");

// default app configuration
const port = process.env.PORT || 4000;
const db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

module.exports = {
    port,
    db,
    cookieSecret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString("hex"),
    cryptoKey: process.env.CRYPTO_KEY || "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes-256-cbc",
    hostName: "localhost",
    environmentalScripts: []
};

