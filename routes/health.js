const express = require("express");
const { getQueueState } = require("../services/signingQueue.service");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "selenium-sign",
    queue: getQueueState(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
