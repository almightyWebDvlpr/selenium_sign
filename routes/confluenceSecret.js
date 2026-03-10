// ./routes/confluenceSecret

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { requireEnv } = require("../utils/env");

const router = express.Router();

router.get("/legal-entity-secret/:id", async (req, res) => {
  const targetClientId = req.params.id;
  const PAGE_ID = "19084214273";
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

    // Зберемо всі параграфи
    const paragraphs = $("p").toArray();

    // Масив для збереження даних про заклади
    const entities = [];

    // Тимчасовий об'єкт для накопичення даних
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

      // Якщо починається новий блок (має client_id)
      if (text.includes("client_id")) {
        // Якщо currentEntity вже має client_id, то додаємо його в масив
        if (currentEntity.client_id) {
          entities.push({ ...currentEntity });
          resetCurrentEntity();
        }

        // Витягуємо client_id
        const idMatch = text.match(/client_id["']?:\s*["']?([a-f0-9\-]+)/i);
        if (idMatch) {
          currentEntity.client_id = idMatch[1];
        }

        // Витягуємо client_secret (якщо є в тому ж <p>)
        const secretMatch = text.match(/client_secret["']?:\s*["']?([^"'<\s]+)/i);
        if (secretMatch) {
          currentEntity.client_secret = secretMatch[1];
        }

        // Витягуємо email
        const emailMatch = text.match(/"email"\s*:\s*"([^"]+)"/i);
        if (emailMatch) {
          currentEntity.email = emailMatch[1];
        }

        // Аналогічно для password
        const passwordMatch = text.match(/"password"\s*:\s*"([^"]+)"/i);
        if (passwordMatch) {
          currentEntity.password = passwordMatch[1];
        }

        // redirect_uri
        const redirectUriMatch = text.match(/redirect_uri["']?:\s*["']?([^"'<\s]+)/i);
        if (redirectUriMatch) {
          currentEntity.redirect_uri = redirectUriMatch[1];
        }

        // scope
        const scopeMatch = text.match(/"scope"\s*:\s*"([^"]+)"/i);
        if (scopeMatch) {
          currentEntity.scope = scopeMatch[1];
        }
      } else {
        // Якщо це не новий client_id, але може містити client_secret або інші поля

        if (!currentEntity.client_secret) {
          const secretMatch = text.match(/client_secret["']?:\s*["']?([^"'<\s]+)/i);
          if (secretMatch) {
            currentEntity.client_secret = secretMatch[1];
          }
        }
        if (!currentEntity.email) {
          const emailMatch = text.match(/"email"\s*:\s*"([^"]+)"/i);
          if (emailMatch) {
            currentEntity.email = emailMatch[1];
          }
        }
        if (!currentEntity.password) {
          const passwordMatch = text.match(/"password"\s*:\s*"([^"]+)"/i);
          if (passwordMatch) {
            currentEntity.password = passwordMatch[1];
          }
        }
        if (!currentEntity.redirect_uri) {
          const redirectUriMatch = text.match(/redirect_uri["']?:\s*["']?([^"'<\s]+)/i);
          if (redirectUriMatch) {
            currentEntity.redirect_uri = redirectUriMatch[1];
          }
        }
        if (!currentEntity.scope) {
          const scopeMatch = text.match(/"scope"\s*:\s*"([^"]+)"/i);
          if (scopeMatch) {
            currentEntity.scope = scopeMatch[1];
          }
        }
      }
    }

    // Додамо останній entity, якщо є client_id
    if (currentEntity.client_id) {
      entities.push({ ...currentEntity });
    }

    // Знайдемо entity по client_id
    const foundEntity = entities.find(e => e.client_id === targetClientId);

    if (!foundEntity) {
      return res.status(404).json({ message: "client_id not found" });
    }

    res.json({
      client_id: foundEntity.client_id,
      client_secret: foundEntity.client_secret,
      email: foundEntity.email,
      redirect_uri: foundEntity.redirect_uri,
      scope: foundEntity.scope,
    });
  } catch (error) {
    console.error("Confluence fetch error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get data from Confluence" });
  }
});

module.exports = router;
