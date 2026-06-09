const _ = require("underscore");
const path = require("path");
const util = require('util')

const finalEnv = process.env.NODE_ENV || "development";

const allConf = require(path.resolve(__dirname + "/../config/env/all.js"))
const envConf = require(path.resolve(__dirname + "/../config/env/" + finalEnv.toLowerCase() + ".js")) || {}

const config = { ...allConf, ...envConf }

// Log a redacted version of the configuration to avoid leaking secrets or raw HTML
console.log(`Current Config:`)
const safeConfig = _.clone(config);
if (safeConfig.environmentalScripts) {
	safeConfig.environmentalScripts = `[${safeConfig.environmentalScripts.length} scripts redacted]`;
}
if (safeConfig.cookieSecret) {
	safeConfig.cookieSecret = '[REDACTED]';
}
if (safeConfig.cryptoKey) {
	safeConfig.cryptoKey = '[REDACTED]';
}
console.log(util.inspect(safeConfig, false, null))

module.exports = config;
