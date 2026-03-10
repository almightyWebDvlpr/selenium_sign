function badRequest(res, msg) {
  return res.status(400).json({ error: msg });
}

function validatePatientBase(req, res, next) {
  const data = req.body;

  if (!data?.patientId) return badRequest(res, 'patientId is required');
  if (!data?.environment) return badRequest(res, 'environment is requiredd');
  if (!data?.type) return badRequest(res, 'type is required (PERSON|PREPERSON)');
  if (!['PERSON', 'PREPERSON'].includes(data.type))
    return badRequest(res, 'type must be PERSON or PREPERSON');

  next();
}

function validateEpisodeUpsert(req, res, next) {
  const { patientId } = req.params;
  const data = req.body?.data;

  if (!patientId) return badRequest(res, 'patientId is required');
  if (!data?.id) return badRequest(res, 'data.id is required');

  next();
}

function validateCompositionAttach(req, res, next) {
  const data = req.body;

  if (!data?.patientId) return badRequest(res, 'patientId is required');
  if (!data?.episodeId) return badRequest(res, 'episodeId is required');
  if (!data?.compositionId) return badRequest(res, 'compositionId is required');

  next();
}

module.exports = {
  validatePatientBase,
  validateEpisodeUpsert,
  validateCompositionAttach,
};
