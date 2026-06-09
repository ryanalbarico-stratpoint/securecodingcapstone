"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const bodyParser = require("body-parser");
const session = require("express-session");
const helmet = require("helmet");
const csurf = require("csurf");
const consolidate = require("consolidate"); // Templating library adapter for Express
const swig = require("swig");
const MongoClient = require("mongodb").MongoClient; // Driver for connecting to MongoDB
const http = require("http");
const marked = require("marked");
const app = express(); // Web framework to handle routing requests
const routes = require("./app/routes");
const { port, db, cookieSecret } = require("./config/config"); // Application config properties

// Holds references for graceful shutdown
let server;
let mongoDb;

MongoClient.connect(db, (err, mongo) => {
    if (err) {
        console.log("Error: DB: connect");
        console.log(err);
        process.exit(1);
    }
    mongoDb = mongo;
    console.log(`Connected to the database`);


    // Adding/ remove HTTP Headers for security
    app.set("trust proxy", 1);
    app.use(helmet());
    app.use(favicon(__dirname + "/app/assets/favicon.ico"));

    // Express middleware to populate "req.body" so we can access POST variables
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        // Mandatory in Express v4
        extended: false
    }));

    // Enable session management using express middleware
    const isProduction = process.env.NODE_ENV === "production";
    app.use(session({
        name: "nodegoat_sessionId",
        secret: cookieSecret,
        saveUninitialized: false,
        resave: false,
        cookie: {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : false,
            path: "/",
            domain: isProduction ? undefined : "localhost",
            maxAge: 24 * 60 * 60 * 1000,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
    }));

    // Register templating engine
    app.engine(".html", consolidate.swig);
    app.set("view engine", "html");
    app.set("views", `${__dirname}/app/views`);
    app.use(express.static(`${__dirname}/app/assets`, { dotfiles: "ignore", maxAge: "1d" }));

    app.use(csurf());
    app.use((req, res, next) => {
        res.locals.csrftoken = req.csrfToken();
        next();
    });

    // Initializing marked library
    marked.setOptions({
        sanitize: true
    });
    app.locals.marked = marked;

    // Application routes
    routes(app, mongo);

    // Template system setup
    swig.setDefaults({
        autoescape: true
    });

    // HTTP connection
    server = http.createServer(app);

    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Another process is listening on this port.`);
            console.error('Tip: run `lsof -i :'+port+'` to find and stop the process, or set a different PORT.');
            process.exit(1);
        }
        throw err;
    });

    server.listen(port, () => {
        console.log(`Express http server listening on port ${port}`);
    });

    // Graceful shutdown handlers
    const shutdown = (signal) => {
        console.log(`Received ${signal}. Closing server and database connections...`);
        if (server) {
            server.close(() => {
                console.log('HTTP server closed');
                if (mongoDb && typeof mongoDb.close === 'function') {
                    mongoDb.close(() => {
                        console.log('MongoDB connection closed');
                        process.exit(0);
                    });
                } else {
                    process.exit(0);
                }
            });
            // Force exit if not closed within 10s
            setTimeout(() => {
                console.error('Forcing shutdown after timeout');
                process.exit(1);
            }, 10000).unref();
        } else {
            process.exit(0);
        }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (err) => {
        console.error('Uncaught exception:', err);
        shutdown('uncaughtException');
    });

});
