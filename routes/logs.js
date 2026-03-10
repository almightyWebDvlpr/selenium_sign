const express = require("express");
const { MongoClient } = require("mongodb");
const { requireEnv } = require("../utils/env");

const router = express.Router();

const mongoUri = requireEnv("MONGODB_URI");
const mongoClient = new MongoClient(mongoUri, { useUnifiedTopology: true });

router.get("/logs", async (req, res) => {
  const messageQuery = req.query.message;

  try {
    await mongoClient.connect();
    const db = mongoClient.db("postman_logs");
    const logsCollection = db.collection("demo");

    const query = messageQuery
      ? { message: { $regex: messageQuery, $options: "i" } }
      : {};

    const cursor = logsCollection.find(query).sort({ timestamp: -1 }).limit(100);

    const logs = await cursor.toArray();
    const total = await logsCollection.countDocuments(query);

    res.json({ logs, total, count: logs.length });
  } catch (err) {
    console.error("Failed to fetch logs:", err);
    res.status(500).send("Error fetching logs");
  }
});

module.exports = router;
