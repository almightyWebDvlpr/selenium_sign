const express = require("express");
const router = express.Router();
const sharp = require("sharp");

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

router.post("/upload-jpeg", async (req, res) => {
  try {
    const {
      putUrl,
      requestName = "Parent Request",
      docType = "unknown.DOCUMENT",
      width = 1200,
      height = 800,
      quality = 85,
    } = req.body || {};

    if (!putUrl) return res.status(400).json({ error: "putUrl is required" });

    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    // Картинка "як документ": шапка + блоки з текстом
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${Number(width)}" height="${Number(height)}">
        <rect width="100%" height="100%" fill="#f5f7fb"/>
        <rect x="70" y="60" width="${Number(width) - 140}" height="${Number(height) - 120}" rx="28" fill="#ffffff" stroke="#dfe6f2" stroke-width="4"/>
        
        <text x="120" y="150" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#111" style="white-space: pre-wrap;">
          ${esc(docType)}
        </text>

        <text x="120" y="220" font-family="Arial, sans-serif" font-size="28" fill="#333">
          Request: ${esc(requestName)}
        </text>

        <text x="120" y="270" font-family="Arial, sans-serif" font-size="22" fill="#666">
          Generated: ${esc(now)}
        </text>

        <rect x="120" y="320" width="${Number(width) - 240}" height="4" fill="#eef2fb"/>

        <text x="120" y="400" font-family="Arial, sans-serif" font-size="26" fill="#111">
          This is a generated test JPEG for QA.
        </text>

        <text x="120" y="450" font-family="Arial, sans-serif" font-size="22" fill="#444">
          Content-Type: image/jpeg
        </text>

       <text x="120"
      y="500"
      font-family="Arial, sans-serif"
      font-size="22"
      fill="#444"
      style="white-space: pre-wrap;">
  Document type: ${esc(docType)}
</text>

        <text x="120" y="550" font-family="Arial, sans-serif" font-size="22" fill="#444">
          Source request: ${esc(requestName)}
        </text>
      </svg>
    `;

    const jpegBuffer = await sharp(Buffer.from(svg))
      .jpeg({ quality: Number(quality), mozjpeg: true })
      .toBuffer();

    const r = await fetch(putUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpegBuffer.length),
      },
      body: jpegBuffer,
    });

    const text = await r.text().catch(() => "");

    return res.status(200).json({
      success: r.ok,
      putStatus: r.status,
      putStatusText: r.statusText,
      bytesSent: jpegBuffer.length,
      responseBody: text,
      requestName,
      docType,
    });
  } catch (e) {
    console.error("upload-jpeg error:", e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
