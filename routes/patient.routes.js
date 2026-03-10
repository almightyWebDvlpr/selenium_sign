const express = require("express");
const router = express.Router();

const asyncHandler = require("../middlewares/asyncHandler");
const {
  validatePatientBase,
  validateEpisodeUpsert,
  validateCompositionAttach,
} = require("../middlewares/validate.middleware");

const patientController = require("../controllers/patient.controller");

// CREATE
router.post("/", validatePatientBase, asyncHandler(patientController.create));

// UPDATE
router.put("/", validatePatientBase, asyncHandler(patientController.update));

// UPSERT EPISODE (як у тебе)
router.put(
  "/:patientId/episodes",
  validateEpisodeUpsert,
  asyncHandler(patientController.upsertEpisode),
);

// ATTACH COMPOSITION
router.post(
  "/composition",
  validateCompositionAttach,
  asyncHandler(patientController.attachComposition),
);

// routes/patient.routes.js
router.post(
  "/encounter-package",
  asyncHandler(patientController.attachEncounterPackage),
);

router.get("/search", asyncHandler(patientController.search));

module.exports = router;
