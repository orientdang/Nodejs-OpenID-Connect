function loginRequired(req, res, next) {
    if (!req.user) {
        res.status(401).render("unauthenticated");
    }
    next();
}

module.exports = loginRequired;
