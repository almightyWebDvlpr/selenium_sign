const express = require("express");
const https = require("https");
const { URL } = require("url");
const { requireEnv } = require("../utils/env");

const router = express.Router();

router.post("/log-legal-entity-update", async (req, res) => {
  try {
    const data = req.body;
    let parsedResponseBody = data.responseBody;

    try {
      parsedResponseBody = JSON.parse(data.responseBody);
    } catch (_) {}

    const legalEntity = parsedResponseBody?.data || {};
    const security = parsedResponseBody?.urgent?.security || {};

    const entityName = legalEntity.name || "Невідомо";
    const entityId = legalEntity.id || "Невідомо";
    const edrpou = legalEntity.edrpou || "Невідомо";
    const entityType = legalEntity.type || "Невідомо";
    const email = legalEntity.email || "Невідомо";
    const clientSecret = security.client_secret || "Невідомо";
    const redirectUri = security.redirect_uri || "Невідомо";

    const chatMessage = {
      text: `✅ Оновлено заклад:
- Назва: *${entityName}*
- ID: ${entityId}
- ЄДРПОУ: ${edrpou}
- Тип: ${entityType}
- Email: ${email}
- Client Secret: \`${clientSecret}\`
- Redirect URI: ${redirectUri}`
    };

    const webhookUrl = requireEnv("GOOGLE_CHAT_WEBHOOK_URL");
    const chatUrl = new URL(webhookUrl);

    const reqOptions = {
      hostname: chatUrl.hostname,
      path: chatUrl.pathname + chatUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify(chatMessage)),
      },
    };

    const chatReq = https.request(reqOptions, (chatRes) => {
      chatRes.on("data", () => {});
      chatRes.on("end", () => {
        res.status(200).send("Legal entity update sent to Google Chat");
      });
    });

    chatReq.on("error", (e) => {
      console.error("Google Chat error:", e);
      res.status(500).send("Failed to send to Google Chat");
    });

    chatReq.write(JSON.stringify(chatMessage));
    chatReq.end();
  } catch (err) {
    console.error("Failed to handle legal entity update:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
