// middleware/auth.js
const jwt = require("jsonwebtoken");
const SECRET = "collab_it"; // Keep this secure

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token missing" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // decoded contains { email, name, isAdmin }
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

module.exports = verifyToken;
