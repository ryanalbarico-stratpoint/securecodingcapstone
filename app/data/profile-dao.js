/* The ProfileDAO must be constructed with a connected database object */
function ProfileDAO(db) {

    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof ProfileDAO)) {
        console.log("Warning: ProfileDAO constructor called without 'new' operator");
        return new ProfileDAO(db);
    }

    const users = db.collection("users");
    const crypto = require("crypto");
    const config = require("../../config/config");
    const key = crypto.createHash("sha256").update(config.cryptoKey).digest();
    const ivLength = 16;

    const encrypt = (plaintext) => {
        const iv = crypto.randomBytes(ivLength);
        const cipher = crypto.createCipheriv(config.cryptoAlgo, key, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
        return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
    };

    const decrypt = (cipherText) => {
        const [ivHex, encryptedHex] = cipherText.split(":");
        if (!ivHex || !encryptedHex) {
            return cipherText;
        }
        const iv = Buffer.from(ivHex, "hex");
        const encrypted = Buffer.from(encryptedHex, "hex");
        const decipher = crypto.createDecipheriv(config.cryptoAlgo, key, iv);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    };

    this.updateUser = (userId, firstName, lastName, ssn, dob, address, bankAcc, bankRouting, callback) => {

        // Create user document
        const user = {};
        if (firstName) {
            user.firstName = firstName;
        }
        if (lastName) {
            user.lastName = lastName;
        }
        if (address) {
            user.address = address;
        }
        if (bankAcc) {
            user.bankAcc = bankAcc;
        }
        if (bankRouting) {
            user.bankRouting = bankRouting;
        }
        if (ssn) {
            user.ssn = encrypt(ssn);
        }
        if (dob) {
            user.dob = encrypt(dob);
        }

        users.update({
                _id: parseInt(userId)
            }, {
                $set: user
            },
            err => {
                if (!err) {
                    console.log("Updated user profile");
                    return callback(null, user);
                }

                return callback(err, null);
            }
        );
    };

    this.getByUserId = (userId, callback) => {
        users.findOne({
                _id: parseInt(userId)
            },
            (err, user) => {
                if (err) return callback(err, null);
                if (user.ssn) {
                    user.ssn = decrypt(user.ssn);
                }
                if (user.dob) {
                    user.dob = decrypt(user.dob);
                }

                callback(null, user);
            }
        );
    };
}

module.exports = { ProfileDAO };
