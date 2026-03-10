const patientService = require('../services/patient.service');

async function create(req, res) {
  const patient = await patientService.createPatient(req.body);
  res.json({ success: true, patient });
}

async function update(req, res) {
  const patient = await patientService.updatePatient(req.body);
  res.json({ success: true, patient });
}

async function upsertEpisode(req, res) {
  const { patientId } = req.params;
  const result = await patientService.upsertEpisode(patientId, req.body.data);
  res.json({ success: true, ...result });
}

async function attachEncounterPackage(req, res) {
  const result = await patientService.attachEncounterPackage(req.body);
  res.json({ success: true, ...result });
}

async function attachComposition(req, res) {
  const result = await patientService.attachComposition(req.body);
  res.json({ success: true, ...result });
}

async function search(req, res) {
  try {
    const result = await patientService.searchPatients(req.query);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

module.exports = {
  create,
  update,
  upsertEpisode,
  attachComposition,
  search,
  attachEncounterPackage,
};
