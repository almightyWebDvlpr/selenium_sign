const fs = require("fs/promises");
const path = require("path");
const puppeteer = require("puppeteer");
const htmlDocx = require("html-docx-js");

const savePath = "/Users/serhiikurylenko/Downloads";

exports.safeFile = async (data) => {
  const filePath = path.join(savePath, "file-to-safe.txt");
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
};

exports.saveHtmlFile = async (html, filenameBase) => {
  const filePath = path.join(savePath, `_html_${filenameBase}.html`);
  await fs.writeFile(filePath, html, "utf8");
};

exports.savePdfFile = async (html, filenameBase) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfPath = path.join(savePath, `_pdf_${filenameBase}.pdf`);
  await page.pdf({ path: pdfPath, format: "A4" });
  await browser.close();
};

exports.saveDocxFile = async (html, filenameBase) => {
  const docxBlob = htmlDocx.asBlob(html);
  const arrayBuffer = await docxBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const docxPath = path.join(savePath, `_ms_word_${filenameBase}.docx`);
  await fs.writeFile(docxPath, buffer);
};
