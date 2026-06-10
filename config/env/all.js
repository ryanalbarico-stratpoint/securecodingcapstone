const crypto = require("crypto");

function buildMongoUri() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://localhost:27017/nodegoat";
    const hasDbPath = /mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(uri);
    let resolved = hasDbPath ? uri : `${uri.replace(/\/$/, "")}/nodegoat`;

    if (!/authSource=/.test(resolved) && /@/.test(resolved)) {
        resolved += resolved.includes("?") ? "&authSource=admin" : "?authSource=admin";
    }

    return resolved;
}

// default app configuration
const port = process.env.PORT || 4000;
const db = buildMongoUri();

module.exports = {
    port,
    db,
    cookieSecret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString("hex"),
    cryptoKey: process.env.CRYPTO_KEY || "a_secure_key_for_crypto_here",
    cryptoAlgo: "aes-256-cbc",
    hostName: process.env.RAILWAY_PUBLIC_DOMAIN || "localhost",
    environmentalScripts: []
};

