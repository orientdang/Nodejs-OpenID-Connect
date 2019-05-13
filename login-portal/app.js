const createError = require("http-errors");
const express = require("express");
const path = require("path");
const logger = require("morgan");
const session = require("express-session");
const okta = require("@okta/okta-sdk-nodejs");
const ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;
// middleware
const loginRequired = require("./middleware/loginRequires");
// routes
const publicRoute = require("./routes/public");
const dashboardRoute = require("./routes/dashboard");
const logOutRoute = require("./routes/logOut");
const app = express();

// okta client & expressOIDC
const oktaClient = new okta.Client({
    orgUrl: "https://dev-667997.okta.com",
    token: "00dMMdsq3C9P8uUK9UC8NHv8Hamtp0T28S-RxWi8xu"
});
const oidc = new ExpressOIDC({
    issuer: "https://dev-667997.okta.com/oauth2/default",
    client_id: "0oal0t3p8SyqkWxIO356",
    client_secret: "6tTETN5sBNsayq26jE6Hc2X_ASf3OI51qVNWtodA",
    redirect_uri: "http://localhost:3000/users/callback",
    scope: "openid profile",
    routes: {
        login: {
            path: "/users/login"
        },
        callback: {
            path: "/users/callback",
            defaultRedirect: "/dashboard"
        }
    }
});
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// session setup
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "nguyenhaidang",
        resave: true,
        saveUninitialized: false
    })
);
app.use(oidc.router);

// run on every user request
app.use((req, res, next) => {
    if (!req.userinfo) {
        return next();
    }

    oktaClient
        .getUser(req.userinfo.sub)
        .then(user => {
            req.user = user;
            res.locals.user = user;
            next();
        })
        .catch(err => {
            next(err);
        });
});
// using routes
app.use("/", publicRoute);
app.use("/dashboard", loginRequired, dashboardRoute);
app.use("/users", logOutRoute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
