const ProfileDAO = require("../data/profile-dao").ProfileDAO;
const ESAPI = require('node-esapi')
const {
    environmentalScripts
} = require("../../config/config");

/* The ProfileHandler must be constructed with a connected db */
function ProfileHandler(db) {
    "use strict";

    const profile = new ProfileDAO(db);

    this.displayProfile = (req, res, next) => {
        const {
            userId
        } = req.session;



        profile.getByUserId(parseInt(userId), (err, doc) => {
            if (err) return next(err);
            doc.userId = userId;
            doc.firstNameSafeHTML = ESAPI.encoder().encodeForHTML(doc.firstName || "");
            doc.firstNameSafeURL = ESAPI.encoder().encodeForURL(doc.firstName || "");
            doc.websiteSafeHTML = ESAPI.encoder().encodeForHTML(doc.website || "");
            doc.websiteSafeURL = ESAPI.encoder().encodeForURL(doc.website || "");

            return res.render("profile", {
                ...doc,
                environmentalScripts
            });
        });
    };

    this.handleProfileUpdate = (req, res, next) => {

        const {
            firstName,
            lastName,
            ssn,
            dob,
            address,
            bankAcc,
            bankRouting
        } = req.body;

        // Fix for Section: ReDoS attack
        // The following regexPattern that is used to validate the bankRouting number is insecure and vulnerable to
        // catastrophic backtracking which means that specific type of input may cause it to consume all CPU resources
        // with an exponential time until it completes.
        const regexPattern = /^\d+#$/;
        // Allow only digits with a trailing #, for example: '0198212#'
        const testComplyWithRequirements = regexPattern.test(bankRouting);
        // if the regex test fails we do not allow saving
        if (testComplyWithRequirements !== true) {
            const firstNameSafeHTML = ESAPI.encoder().encodeForHTML(firstName || "");
            const firstNameSafeURL = ESAPI.encoder().encodeForURL(firstName || "");
            return res.render("profile", {
                updateError: "Bank Routing number does not comply with requirements for format specified",
                firstNameSafeHTML,
                firstNameSafeURL,
                lastName,
                ssn,
                dob,
                address,
                bankAcc,
                bankRouting,
                environmentalScripts
            });
        }

        const {
            userId
        } = req.session;

        profile.updateUser(
            parseInt(userId),
            firstName,
            lastName,
            ssn,
            dob,
            address,
            bankAcc,
            bankRouting,
            (err, user) => {

                if (err) return next(err);

                user.updateSuccess = true;
                user.userId = userId;
                user.firstNameSafeHTML = ESAPI.encoder().encodeForHTML(user.firstName || "");
                user.firstNameSafeURL = ESAPI.encoder().encodeForURL(user.firstName || "");
                user.websiteSafeHTML = ESAPI.encoder().encodeForHTML(user.website || "");
                user.websiteSafeURL = ESAPI.encoder().encodeForURL(user.website || "");

                return res.render("profile", {
                    ...user,
                    environmentalScripts
                });
            }
        );

    };

}

module.exports = ProfileHandler;
