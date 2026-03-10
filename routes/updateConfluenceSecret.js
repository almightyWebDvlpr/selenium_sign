const express = require("express");
const axios = require("axios");
const he = require("he"); 
const { requireEnv } = require("../utils/env");

const router = express.Router();

router.put("/legal-entity-secret/:id", async (req, res) => {
  const targetClientId = req.params.id;
  const newClientSecretRaw = req.body.client_secret;

  if (!newClientSecretRaw) {
    return res.status(400).json({ message: "client_secret is required in body" });
  }

  const PAGE_ID = "19084214273";
  const EMAIL = requireEnv("CONFLUENCE_EMAIL");
  const API_TOKEN = requireEnv("CONFLUENCE_API_TOKEN");
  const AUTH_HEADER = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString("base64");

  try {
    // 1. Отримати HTML сторінки
    const { data } = await axios.get(
      `https://e-health-ua.atlassian.net/wiki/rest/api/content/${PAGE_ID}?expand=body.storage,version,title`,
      {
        headers: {
          Authorization: `Basic ${AUTH_HEADER}`,
        },
      }
    );

    let html = data.body?.storage?.value || "";
    const version = data.version.number;
    const title = data.title;

    // 2. Пошук потрібного client_id прямо в raw HTML (HTML entities)
    const escapedClientId = he.encode(targetClientId);

    const clientIdPattern = new RegExp(
      `(&quot;client_id&quot;\\s*:\\s*)&quot;${escapedClientId}&quot;`
    );
    const clientIdMatch = html.match(clientIdPattern);

    if (!clientIdMatch) {
      return res.status(404).json({ message: "client_id not found in HTML" });
    }

    const startIndex = clientIdMatch.index;
    const restHtml = html.slice(startIndex);

    // Від цієї точки знайти client_secret поруч
    const secretPattern = /&quot;client_secret&quot;\s*:\s*&quot;[^&]*&quot;/;
    const secretMatch = restHtml.match(secretPattern);

    if (!secretMatch) {
      return res.status(400).json({
        message: "client_secret not found near the client_id",
      });
    }

    const fullSecretMatch = secretMatch[0];

    // Виправлена заміна: замінюємо тільки значення, залишаючи ключ
    const updatedSecret = fullSecretMatch.replace(
      /(&quot;client_secret&quot;\s*:\s*)&quot;[^&]*&quot;/,
      `$1&quot;${he.encode(newClientSecretRaw)}&quot;`
    );

    // 3. Заміна в HTML
    const updatedHtml =
      html.slice(0, startIndex) +
      restHtml.replace(fullSecretMatch, updatedSecret);

    // 4. Оновити сторінку
    const updateRes = await axios.put(
      `https://e-health-ua.atlassian.net/wiki/rest/api/content/${PAGE_ID}`,
      {
        id: PAGE_ID,
        type: "page",
        title,
        version: { number: version + 1 },
        body: {
          storage: {
            value: updatedHtml,
            representation: "storage",
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${AUTH_HEADER}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      message: "client_secret updated successfully",
      url: `https://e-health-ua.atlassian.net${updateRes.data._links.webui}`,
    });
  } catch (error) {
    console.error(
      "Error updating Confluence:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Failed to update Confluence page" });
  }
});

module.exports = router;
