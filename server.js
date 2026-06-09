"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
const consolidate = require("consolidate"); // Templating library adapter for Express
const swig = require("swig");
const MongoClient = require("mongodb").MongoClient; // Driver for connecting to MongoDB
const http = require("http");
const marked = require("marked");
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret, hostName } = require("./config/config"); // Application config properties

// Connect to MongoDB and start the server. Support both callback and promise-based
// behavior of different mongodb driver versions by using the promise API.
MongoClient.connect(db, { useUnifiedTopology: true }).then(client => {
    // In modern drivers `client` is a MongoClient; get the `Db` instance
    const database = client.db();
    console.log(`Connected to the database`);


    // Adding/ remove HTTP Headers for security
    app.use(favicon(__dirname + "/app/assets/favicon.ico"));

    // Express middleware to populate "req.body" so we can access POST variables
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        // Mandatory in Express v4
        extended: false
    }));

    // Enable session management using express middleware
    const sessionCookieName = process.env.SESSION_COOKIE_NAME || "nodegoat.sid";
    const sessionCookieDomain = process.env.SESSION_COOKIE_DOMAIN || hostName;

    const sessionOptions = {
        name: sessionCookieName,
        secret: cookieSecret,
        // Both mandatory in Express v4
        saveUninitialized: true,
        resave: true,
        cookie: {
            domain: sessionCookieDomain,
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            expires: new Date(Date.now() + 1000 * 60 * 60),
            maxAge: 1000 * 60 * 60 // 1 hour
        }
    };

    if (process.env.NODE_ENV === "production") {
        app.set("trust proxy", 1);
        sessionOptions.proxy = true;
        sessionOptions.cookie.secure = true;
    } else {
        sessionOptions.cookie.secure = false;
    }

    app.use(session(sessionOptions));

    // Register templating engine
    app.engine(".html", consolidate.swig);
    app.set("view engine", "html");
    app.set("views", `${__dirname}/app/views`);
    app.use(express.static(`${__dirname}/app/assets`));


    // Initializing marked library
    marked.setOptions({
        sanitize: true
    });
    app.locals.marked = marked;

    // Application routes
    routes(app, database);

    // Template system setup
    swig.setDefaults({
        // Autoescape disabled
        autoescape: false
    });

    // HTTP connection
    http.createServer(app).listen(port, () => {
        console.log(`Express http server listening on port ${port}`);
    });

}).catch(err => {
    console.log("Error: DB: connect");
    console.log(err);
    process.exit(1);
});
