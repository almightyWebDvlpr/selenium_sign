const express = require("express");
const { saveHtmlFile, savePdfFile, saveDocxFile } = require("../utils/fileHelpers");

const router = express.Router();

router.post("/save-html/:filenameBase", async (req, res) => {
  try {
    const filenameBase = req.params.filenameBase || "output";
    let html = typeof req.body === "string" ? req.body : JSON.stringify(req.body, null, 2);

    await saveHtmlFile(html, filenameBase);
    await savePdfFile(html, filenameBase);
    await saveDocxFile(html, filenameBase);

    res.status(200).send(`Files saved with base name "${filenameBase}"`);
  } catch (error) {
    console.error("Error saving files:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
