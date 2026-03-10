const { loadEnv } = require("../utils/env");

loadEnv();

function requireServiceToken(req, res, next) {
  if (req.path === "/health") {
    return next();
  }

  const expectedToken = process.env.SERVICE_API_TOKEN;
  if (!expectedToken) {
    return next();
  }

  const authHeader = req.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || token !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

module.exports = {
  requireServiceToken,
};
