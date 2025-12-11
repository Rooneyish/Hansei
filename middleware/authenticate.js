const jwt = require("jsonwebtoken");
require("dotenv").config();

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (token == null) {
            return res.sendStatus(401);
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        console.log("Authenticated User:", req.user);
        next();
    } catch (err) {
        console.error("Middleware Error", err);
        res.status(403).json({ error: "Access denied: Invalid or expired token" });
    }
}

module.exports = authenticate;
