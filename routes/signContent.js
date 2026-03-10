const express = require("express");
const { automateSigning } = require("../automateSigning");
const { safeFile } = require("../utils/fileHelpers");
const { enqueueSigning, getQueueState } = require("../services/signingQueue.service");

const router = express.Router();

const createSignedContentHandler = (routeName) => async (req, res) => {
  try {
    const data = req.body;
    const base64Text = await enqueueSigning(async () => {
      await safeFile(data);
      return automateSigning();
    });

    if (!base64Text) {
      throw new Error("Signing completed without signed_content");
    }

    res.status(200).json({
      message: "Data received and saved successfully",
      signed_content: base64Text,
      queue: getQueueState(),
    });
  } catch (error) {
    console.error(`Error in ${routeName}:`, error);
    res.status(500).send("Internal Server Error");
  }
};

const endpoints = [
  "receive-data",
  "create-encounter-signed-content",
  "create-care-plan-signed-content",
  "create-care-plan-activity-signed-content",
  "create-service-request-signed-content",
  "create-medication-request-request-signed-content",
  "contract-request-signed-content",
  "diagnostic-report-signed-content",
  "procedure-signed-content",
  "create-composition-signed-content",
  "create-device-signed-content",
  "create-specimen-signed-content",
  "create-employee-signed-content",
  "enter-in-error-composition-signed-content",
  "confidant-person-relationship-request",
  "process-medication-dispene-signed-content",
  "reject-medication-request-signed-content",
  "complete-device-dispense-signed-content",
];

endpoints.forEach((endpoint) => {
  router.post(`/${endpoint}`, createSignedContentHandler(endpoint));
});

module.exports = router;
