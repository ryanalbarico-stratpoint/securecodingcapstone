const SessionHandler = require("./session");
const ProfileHandler = require("./profile");
const BenefitsHandler = require("./benefits");
const ContributionsHandler = require("./contributions");
const AllocationsHandler = require("./allocations");
const MemosHandler = require("./memos");
const ResearchHandler = require("./research");
const {
    environmentalScripts
} = require("../../config/config");
const ErrorHandler = require("./error").errorHandler;

const index = (app, db) => {

    "use strict";

    const sessionHandler = new SessionHandler(db);
    const profileHandler = new ProfileHandler(db);
    const benefitsHandler = new BenefitsHandler(db);
    const contributionsHandler = new ContributionsHandler(db);
    const allocationsHandler = new AllocationsHandler(db);
    const memosHandler = new MemosHandler(db);
    const researchHandler = new ResearchHandler(db);

    // Middleware to check if a user is logged in
    const isLoggedIn = sessionHandler.isLoggedInMiddleware;

    //Middleware to check if user has admin rights
    const isAdmin = sessionHandler.isAdminUserMiddleware;

    // The main page of the app
    app.get("/", sessionHandler.displayWelcomePage);

    // Login form
    app.get("/login", sessionHandler.displayLoginPage);
    app.post("/login", sessionHandler.handleLoginRequest);

    // Signup form
    app.get("/signup", sessionHandler.displaySignupPage);
    app.post("/signup", sessionHandler.handleSignup);

    // Logout page
    app.get("/logout", sessionHandler.displayLogoutPage);

    // The main page of the app
    app.get("/dashboard", isLoggedIn, sessionHandler.displayWelcomePage);

    // Profile page
    app.get("/profile", isLoggedIn, profileHandler.displayProfile);
    app.post("/profile", isLoggedIn, profileHandler.handleProfileUpdate);

    // Contributions Page
    app.get("/contributions", isLoggedIn, contributionsHandler.displayContributions);
    app.post("/contributions", isLoggedIn, contributionsHandler.handleContributionsUpdate);

    // Benefits Page
    app.get("/benefits", isLoggedIn, isAdmin, benefitsHandler.displayBenefits);
    app.post("/benefits", isLoggedIn, isAdmin, benefitsHandler.updateBenefits);

    // Allocations Page
    app.get("/allocations/:userId", isLoggedIn, allocationsHandler.displayAllocations);

    // Memos Page
    app.get("/memos", isLoggedIn, memosHandler.displayMemos);
    app.post("/memos", isLoggedIn, memosHandler.addMemos);

    // Handle redirect for learning resources link
    // Helper to validate redirect URLs against whitelist
    const validateRedirectUrl = (url) => {
        const allowedHosts = [
            "https://www.khanacademy.org"
        ];
        const allowedPaths = [
            "/dashboard",
            "/profile",
            "/contributions",
            "/allocations",
            "/memos",
            "/research",
            "/benefits"
        ];
        
        // Check against internal paths
        if (typeof url === "string" && url.startsWith("/")) {
            if (allowedPaths.includes(url)) {
                return url;
            }
        }
        
        // Check against external hosts
        if (typeof url === "string") {
            for (const host of allowedHosts) {
                if (url.startsWith(host)) {
                    return url;
                }
            }
        }
        
        throw new Error("Invalid redirect URL");
    };

    app.get("/learn", isLoggedIn, (req, res) => {
        try {
            const redirectUrl = validateRedirectUrl(req.query.url);
            return res.redirect(redirectUrl);
        } catch (err) {
            return res.status(400).send("Invalid redirect target");
        }
    });

    // Handle tutorial pages
    const validateTutorialPage = (page) => {
        const allowedPages = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "redos", "ssrf"];

        if (allowedPages.includes(page)) {
            return page;
        }

        throw new Error("Invalid tutorial page");
    };

    app.get("/tutorial", (req, res) => {
        return res.render("tutorial/a1", {
            environmentalScripts
        });
    });

    app.get("/tutorial/:page", (req, res) => {
        try {
            const page = validateTutorialPage(req.params.page);
            return res.render(`tutorial/${page}`, {
                environmentalScripts
            });
        } catch (err) {
            return res.status(404).send("Tutorial page not found");
        }
    });

    // Research Page
    app.get("/research", isLoggedIn, researchHandler.displayResearch);

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = index;
