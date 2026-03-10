const express = require("express");
const { MongoClient } = require("mongodb");
const { requireEnv } = require("../utils/env");

const router = express.Router();

/* =====================================================
   Mongo configuration
===================================================== */

const MONGO_URI = requireEnv("MONGODB_URI");

const DB_NAME = "postman_logs";
const COLLECTION_NAME = "care_teams";

const client = new MongoClient(MONGO_URI);

let collection;

/* =====================================================
   Init Mongo (singleton connection)
===================================================== */

async function initMongo() {
    if (collection) return collection;

    await client.connect();
    const db = client.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);

    // ✅ UNIQUE only by careTeamId
    await collection.createIndex({ careTeamId: 1 }, { unique: true });

    console.log("✅ Mongo connected → care_teams collection ready");
    return collection;
}

/* =====================================================
   POST /api/care-teams
===================================================== */

router.post("/care-teams", async (req, res) => {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({ error: "Missing data object" });
        }

        const {
            careTeamId,
            legal_entity_id,
            name,
            author_employee_id,
            email,
            phones,
            note,
            category,
            team_status,
            status_reason,
            period_start,
            period_end,
            environment,
        } = data;

        console.log("📥 Received care team data:", data);

        if (!careTeamId || !category) {
            return res.status(400).json({
                error: "careTeamId and category are required",
            });
        }

        const careTeams = await initMongo();

        // 🔍 Check if care team already exists
        const existing = await careTeams.findOne({ careTeamId });

        if (existing) {
            return res.status(200).json({
                message: "Care team already exists",
                duplicated: true,
                item: existing,
            });
        }

        const document = {
            careTeamId,
            legal_entity_id,
            author_employee_id,
            name: name || null,
            email,
            phones: Array.isArray(phones) ? phones : [],
            note,
            category,
            team_status,
            status_reason,
            period_start,
            period_end,
            environment: environment || "unknown",
            createdAt: new Date(),
        };

        console.log("📝 Saving care team:", document);

        const result = await careTeams.insertOne(document);

        return res.status(201).json({
            message: "Care team created",
            duplicated: false,
            mongoId: result.insertedId,
            item: document,
        });
    } catch (err) {
        // 🧨 Duplicate key (careTeamId)
        if (err.code === 11000) {
            return res.status(409).json({
                error: "Care team with this careTeamId already exists",
            });
        }

        console.error("❌ Failed to save care team:", err);
        return res.status(500).json({ error: "Failed to save care team" });
    }
});




/* =====================================================
   POST /api/care-teams/participants
===================================================== */
router.post("/care-teams/participants", async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) return res.status(400).json({ error: "Missing data object" });

        const { care_team_id, id, member_id, member_type, role, status, period_start, period_end, status_reason } = data;

        if (!care_team_id || !id || !member_id || !role) {
            return res.status(400).json({ error: "care_team_id, id, member_id, role are required" });
        }

        const careTeams = await initMongo();

        // 1. Знаходимо команду
        const team = await careTeams.findOne({ careTeamId: care_team_id });
        if (!team) return res.status(404).json({ error: "Care team not found" });

        // 2. Перевіряємо, чи вже існує учасник з такою ж роллю для цього member_id
        const roleExists = team.participants?.some(
            p => p.member_id === member_id && p.role === role
        );
        if (roleExists) {
            return res.status(409).json({
                error: `Participant with member_id "${member_id}" already has role "${role}" in this team`
            });
        }

        // 3. Перевіряємо, чи існує participant.id (унікальний для масиву)
        const idExists = team.participants?.some(p => p.id === id);
        if (idExists) {
            return res.status(409).json({ error: `Participant with id "${id}" already exists in this team` });
        }

        // 4. Додаємо учасника
        const participant = {
            id,
            member_id,
            member_type,
            role,
            status,
            period_start,
            period_end,
            status_reason,
            addedAt: new Date()
        };

        await careTeams.updateOne(
            { careTeamId: care_team_id },
            { $push: { participants: participant } }
        );

        // 5. Автоматичне оновлення статусу команди
        const updatedTeam = await careTeams.findOne({ careTeamId: care_team_id });
        const participants = updatedTeam.participants || [];

        const managerCount = participants.filter(p => p.role === "care_team_manager").length;
        const otherCount = participants.filter(p => p.role !== "care_team_manager").length;

        let newStatus = updatedTeam.team_status || "draft";

        if (participants.length >= 3 && managerCount >= 1 && otherCount >= 2) {
            newStatus = "active";
            if (newStatus !== updatedTeam.team_status) {
                await careTeams.updateOne(
                    { careTeamId: care_team_id },
                    { $set: { team_status: newStatus, updatedAt: new Date() } }
                );
            }
        }

        return res.status(201).json({
            message: "Participant added to care team",
            participant,
            status: newStatus
        });

    } catch (err) {
        console.error("❌ Failed to add participant:", err);
        return res.status(500).json({ error: "Failed to add participant" });
    }
});




/* =====================================================
   PATCH /care-teams/:id
===================================================== */


router.patch("/care-teams/:id", async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) return res.status(400).json({ error: "Missing data object" });

        const { id, email, note, phones } = data;

        if (!id) return res.status(400).json({ error: "id is required" });

        const careTeams = await initMongo();

        // Знаходимо команду
        const team = await careTeams.findOne({ careTeamId: id });
        if (!team) return res.status(404).json({ error: "Care team not found" });

        // Перевірка статусу
        if (!["draft", "active", "suspended"].includes(team.team_status)) {
            return res.status(403).json({
                error: "Care team can be updated only in draft or active status",
                team_status: team.team_status,
            });
        }


        // Формуємо об’єкт для оновлення
        const updateFields = {};
        if (email !== undefined) updateFields.email = email;
        if (note !== undefined) updateFields.note = note;
        if (phones !== undefined) updateFields.phones = phones;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: "Nothing to update" });
        }

        updateFields.updatedAt = new Date();

        // Оновлюємо документ
        await careTeams.updateOne(
            { careTeamId: id },
            { $set: updateFields }
        );

        const updatedTeam = await careTeams.findOne({ careTeamId: id });

        return res.status(200).json({
            message: "Care team updated successfully",
            team: updatedTeam
        });

    } catch (err) {
        console.error("❌ Failed to update care team:", err);
        return res.status(500).json({ error: "Failed to update care team" });
    }
});





/* =====================================================
   PATCH /care-teams/:id/status
===================================================== */


router.patch("/care-teams/:id/status", async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) return res.status(400).json({ error: "Missing data object" });

        const { id,
            team_status,
            status_reason,
            period_end } = data;

        if (!id) return res.status(400).json({ error: "id is required" });

        const careTeams = await initMongo();

        // Знаходимо команду
        const team = await careTeams.findOne({ careTeamId: id });
        if (!team) return res.status(404).json({ error: "Care team not found" });

        // Формуємо об’єкт для оновлення
        const updateFields = {};
        if (team_status !== undefined) updateFields.team_status = team_status;
        if (status_reason !== undefined) updateFields.status_reason = status_reason;
        if (period_end !== undefined) updateFields.period_end = period_end;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: "Nothing to update" });
        }

        updateFields.updatedAt = new Date();

        // Оновлюємо документ
        await careTeams.updateOne(
            { careTeamId: id },
            { $set: updateFields }
        );

        const updatedTeam = await careTeams.findOne({ careTeamId: id });

        return res.status(200).json({
            message: "Care team updated successfully",
            team: updatedTeam
        });

    } catch (err) {
        console.error("❌ Failed to update care team:", err);
        return res.status(500).json({ error: "Failed to update care team" });
    }
});





/* =====================================================
   GET /care-teams & search by query params
===================================================== */
router.get("/care-teams", async (req, res) => {
    try {
        const {
            environment,
            name,
            category,
            author_employee_id,
            legal_entity_id,
            member_id,
            status: team_status
        } = req.query;

        const query = {};

        if (environment) query.environment = environment;
        if (category) query.category = category;
        if (name) query.name = { $regex: name, $options: "i" };
        if (author_employee_id) query.author_employee_id = author_employee_id;
        if (legal_entity_id) query.legal_entity_id = legal_entity_id;
        if (team_status) query.team_status = team_status;
        if (member_id) query["participants.member_id"] = member_id;

        const careTeams = await initMongo();
        const items = await careTeams.find(query).sort({ createdAt: -1 }).toArray();

        if (!items.length) {
            return res.status(404).json({
                error: "Care teams not found",
                message: "No care teams match the given search criteria"
            });
        }

        return res.json({
            items,
            total: items.length,
            count: items.length
        });
    } catch (err) {
        console.error("❌ Failed to fetch care teams:", err);
        return res.status(500).json({
            error: "Failed to fetch care teams"
        });
    }
});








/* =====================================================
   GET /api/care-teams/:id
===================================================== */

router.get("/care-teams/:id", async (req, res) => {
    try {
        const careTeams = await initMongo();

        const item = await careTeams.findOne({
            careTeamId: req.params.id,
        });

        if (!item) {
            return res.status(404).json({ error: "Care team not found" });
        }

        return res.json(item);
    } catch (err) {
        console.error("❌ Failed to fetch care team:", err);
        return res.status(500).json({ error: "Failed to fetch care team" });
    }
});



/* =====================================================
   GET /api/care-teams/:id/participants
===================================================== */
router.get("/care-teams/:id/participants", async (req, res) => {
    try {
        const careTeams = await initMongo();
        const team = await careTeams.findOne({ careTeamId: req.params.id });
        if (!team) return res.status(404).json({ error: "Care team not found" });

        return res.json({ total: team.participants?.length || 0, participants: team.participants || [] });
    } catch (err) {
        console.error("❌ Failed to fetch participants:", err);
        return res.status(500).json({ error: "Failed to fetch participants" });
    }
});



/* =====================================================
   GET /api/care-teams/:id/participants/:participantId
===================================================== */
router.get("/care-teams/:id/participants/:participantId", async (req, res) => {
    try {
        const careTeams = await initMongo();
        const team = await careTeams.findOne({ careTeamId: req.params.id });
        if (!team) return res.status(404).json({ error: "Care team not found" });

        const participant = team.participants?.find(p => p.id === req.params.participantId);
        if (!participant) return res.status(404).json({ error: "Participant not found" });

        return res.json(participant);
    } catch (err) {
        console.error("❌ Failed to fetch participant:", err);
        return res.status(500).json({ error: "Failed to fetch participant" });
    }
});









/* =====================================================
   Health check
===================================================== */

router.get("/care-teams/health", (_req, res) => {
    res.json({ status: "ok", service: "care-teams" });
});



module.exports = router;
