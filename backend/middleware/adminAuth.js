const jwt = require("jsonwebtoken");

function getSecret() {
  return process.env.ADMIN_JWT_SECRET;
}

function requireAdmin(req, res, next) {
  const secret = getSecret();
  if (!secret) {
    return res.status(503).json({ error: "Admin auth not configured." });
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  try {
    const payload = jwt.verify(token, secret);
    if (!payload?.admin) {
      return res.status(403).json({ error: "Forbidden." });
    }
    req.admin = true;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { requireAdmin, getSecret };
