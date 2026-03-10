const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const puppeteer = require("puppeteer");
const htmlDocx = require("html-docx-js");
const { loadEnv } = require("./env");

loadEnv();

const savePath = process.env.SIGNING_WORK_DIR || path.join(os.tmpdir(), "selenium_sign");

async function ensureSavePath() {
  await fs.mkdir(savePath, { recursive: true });
}

function getSourceFilename() {
  return process.env.SIGNING_SOURCE_FILENAME || "file-to-safe.txt";
}

exports.safeFile = async (data) => {
  await ensureSavePath();
  const filePath = path.join(savePath, getSourceFilename());
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
};

exports.saveHtmlFile = async (html, filenameBase) => {
  await ensureSavePath();
  const filePath = path.join(savePath, `_html_${filenameBase}.html`);
  await fs.writeFile(filePath, html, "utf8");
};

exports.savePdfFile = async (html, filenameBase) => {
  await ensureSavePath();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfPath = path.join(savePath, `_pdf_${filenameBase}.pdf`);
  await page.pdf({ path: pdfPath, format: "A4" });
  await browser.close();
};

exports.saveDocxFile = async (html, filenameBase) => {
  await ensureSavePath();
  const docxBlob = htmlDocx.asBlob(html);
  const arrayBuffer = await docxBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const docxPath = path.join(savePath, `_ms_word_${filenameBase}.docx`);
  await fs.writeFile(docxPath, buffer);
};

exports.getSavePath = () => savePath;
exports.getSourceFilename = getSourceFilename;
