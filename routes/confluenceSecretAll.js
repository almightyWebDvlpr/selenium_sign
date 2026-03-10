// ./routes/confluenceSecretAll.js

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { requireEnv } = require("../utils/env");

const router = express.Router();

router.get("/legal-entity-secrets", async (req, res) => {
  const PAGE_ID = "18470502427";
  const EMAIL = requireEnv("CONFLUENCE_EMAIL");
  const API_TOKEN = requireEnv("CONFLUENCE_API_TOKEN");
  const AUTH_HEADER = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString("base64");

  try {
    const { data } = await axios.get(
      `https://e-health-ua.atlassian.net/wiki/rest/api/content/${PAGE_ID}?expand=body.storage`,
      {
        headers: {
          Authorization: `Basic ${AUTH_HEADER}`,
        },
      }
    );

    const html = data.body?.storage?.value || "";
    const $ = cheerio.load(html, { xmlMode: false });

    const paragraphs = $("p").toArray();

    const entities = [];
    let currentEntity = {};

    const resetCurrentEntity = () => {
      currentEntity = {
        client_id: null,
        client_secret: null,
        email: null,
        password: null,
        redirect_uri: null,
        scope: null,
      };
    };

    resetCurrentEntity();

    for (let p of paragraphs) {
      const text = $(p).text().trim();

      if (text.includes("client_id")) {
        if (currentEntity.client_id) {
          entities.push({ ...currentEntity });
          resetCurrentEntity();
        }

        const idMatch = text.match(/client_id["']?:\s*["']?([a-f0-9\-]+)/i);
        if (idMatch) currentEntity.client_id = idMatch[1];

        const secretMatch = text.match(/client_secret["']?:\s*["']?([^"'<\s]+)/i);
        if (secretMatch) currentEntity.client_secret = secretMatch[1];

        const emailMatch = text.match(/"email"\s*:\s*"([^"]+)"/i);
        if (emailMatch) currentEntity.email = emailMatch[1];

        const passwordMatch = text.match(/"password"\s*:\s*"([^"]+)"/i);
        if (passwordMatch) currentEntity.password = passwordMatch[1];

        const redirectUriMatch = text.match(/redirect_uri["']?:\s*["']?([^"'<\s]+)/i);
        if (redirectUriMatch) currentEntity.redirect_uri = redirectUriMatch[1];

        const scopeMatch = text.match(/"scope"\s*:\s*"([^"]+)"/i);
        if (scopeMatch) currentEntity.scope = scopeMatch[1];

      } else {
        if (!currentEntity.client_secret) {
          const secretMatch = text.match(/client_secret["']?:\s*["']?([^"'<\s]+)/i);
          if (secretMatch) currentEntity.client_secret = secretMatch[1];
        }
        if (!currentEntity.email) {
          const emailMatch = text.match(/"email"\s*:\s*"([^"]+)"/i);
          if (emailMatch) currentEntity.email = emailMatch[1];
        }
        if (!currentEntity.password) {
          const passwordMatch = text.match(/"password"\s*:\s*"([^"]+)"/i);
          if (passwordMatch) currentEntity.password = passwordMatch[1];
        }
        if (!currentEntity.redirect_uri) {
          const redirectUriMatch = text.match(/redirect_uri["']?:\s*["']?([^"'<\s]+)/i);
          if (redirectUriMatch) currentEntity.redirect_uri = redirectUriMatch[1];
        }
        if (!currentEntity.scope) {
          const scopeMatch = text.match(/"scope"\s*:\s*"([^"]+)"/i);
          if (scopeMatch) currentEntity.scope = scopeMatch[1];
        }
      }
    }

    if (currentEntity.client_id) {
      entities.push({ ...currentEntity });
    }

    res.json(entities);
  } catch (error) {
    console.error("Confluence fetch error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get data from Confluence" });
  }
});

module.exports = router;
