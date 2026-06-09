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
    app.get("/benefits", isLoggedIn, benefitsHandler.displayBenefits);
    app.post("/benefits", isLoggedIn, benefitsHandler.updateBenefits);
    /* Fix for A7 - checks user role to implement  Function Level Access Control
     app.get("/benefits", isLoggedIn, isAdmin, benefitsHandler.displayBenefits);
     app.post("/benefits", isLoggedIn, isAdmin, benefitsHandler.updateBenefits);
     */

    // Allocations Page
    app.get("/allocations/:userId", isLoggedIn, allocationsHandler.displayAllocations);

    // Memos Page
    app.get("/memos", isLoggedIn, memosHandler.displayMemos);
    app.post("/memos", isLoggedIn, memosHandler.addMemos);

    const getSafeRedirectUrl = (url) => {
        if (!url || typeof url !== "string") return "/learn";
        if (url.indexOf("\n") !== -1 || url.indexOf("\r") !== -1) return "/learn";
        if (url.startsWith("//")) return "/learn";
        if (url.startsWith("/")) return url;
        return "/learn";
    };

    // Handle redirect for learning resources link
    app.get("/learn", isLoggedIn, (req, res) => {
        return res.redirect(getSafeRedirectUrl(req.query.url));
    });

    const renderTutorialPage = (page, res) => {
        switch (page) {
            case "a1":
                return res.render("tutorial/a1", { environmentalScripts });
            case "a2":
                return res.render("tutorial/a2", { environmentalScripts });
            case "a3":
                return res.render("tutorial/a3", { environmentalScripts });
            case "a4":
                return res.render("tutorial/a4", { environmentalScripts });
            case "a5":
                return res.render("tutorial/a5", { environmentalScripts });
            case "a6":
                return res.render("tutorial/a6", { environmentalScripts });
            case "a7":
                return res.render("tutorial/a7", { environmentalScripts });
            case "a8":
                return res.render("tutorial/a8", { environmentalScripts });
            case "a9":
                return res.render("tutorial/a9", { environmentalScripts });
            case "a10":
                return res.render("tutorial/a10", { environmentalScripts });
            case "redos":
                return res.render("tutorial/redos", { environmentalScripts });
            case "ssrf":
                return res.render("tutorial/ssrf", { environmentalScripts });
            default:
                return res.status(404).render("error-template", {
                    message: "Tutorial page not found",
                    environmentalScripts
                });
        }
    };

    // Handle redirect for learning resources link
    app.get("/tutorial", (req, res) => {
        return res.render("tutorial/a1", {
            environmentalScripts
        });
    });

    app.get("/tutorial/:page", (req, res) => {
        return renderTutorialPage(req.params.page, res);
    });

    // Research Page
    app.get("/research", isLoggedIn, researchHandler.displayResearch);

    // Error handling middleware
    app.use(ErrorHandler);
};

module.exports = index;
