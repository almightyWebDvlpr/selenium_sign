const Patient = require('../models/Patient');
const { parseRelatesTo, mapEpisodeFromEhealth } = require('../utils/helpers');
const { parseDateYYYYMMDD } = require('../middlewares/searchQuery.middleware');
const { buildEncounterPackage } = require('../utils/encounterPackage.helper');

// -------- CREATE --------
async function createPatient(data) {
  const exists = await Patient.findOne({
    environment: data.environment,
    type: data.type,
    patientId: data.patientId,
  });

  if (exists) {
    const err = new Error('Patient already exists');
    err.status = 409;
    throw err;
  }

  const patient = await Patient.create({
    ...data,
    personRequests: [
      {
        requestId: data?.requestId,
        operation: 'create',
        signedAt: new Date(),
      },
    ],
  });

  return patient;
}

// -------- UPDATE (v2 + v3) --------
async function updatePatient(data) {
  const query = {
    environment: data.environment,
    type: data.type,
    patientId: data.patientId,
  };

  const patient = await Patient.findOne(query);
  if (!patient) {
    const err = new Error('Patient not found');
    err.status = 404;
    throw err;
  }

  const payloadHasNames = Array.isArray(data?.names) && data.names.length > 0;
  const dbHasNames = Array.isArray(patient?.names) && patient.names.length > 0;

  // CASE A: v3 payload (names present) -> set names, unset legacy
  if (payloadHasNames) {
    const toSet = { ...data };
    Object.keys(toSet).forEach((k) => toSet[k] === undefined && delete toSet[k]);

    const updated = await Patient.findOneAndUpdate(
      query,
      {
        $set: toSet,
        $unset: { first_name: 1, second_name: 1, last_name: 1 },
        $push: {
          personRequests: {
            requestId: data?.requestId,
            operation: 'update',
            signedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    return updated;
  }

  // CASE B: v2 payload (no names) but DB has names -> update uk item in names
  if (dbHasNames) {
    const ukIndex = patient.names.findIndex((n) => (n?.language || '').toLowerCase() === 'uk');

    const ukPatch = {
      ...(data.first_name !== undefined ? { first_name: data.first_name } : {}),
      ...(data.second_name !== undefined ? { second_name: data.second_name } : {}),
      ...(data.last_name !== undefined ? { last_name: data.last_name } : {}),
      ...(data.no_last_name !== undefined ? { no_last_name: data.no_last_name } : {}),
      language: 'uk',
    };

    const toSet = { ...data };
    delete toSet.names;
    Object.keys(toSet).forEach((k) => toSet[k] === undefined && delete toSet[k]);

    // не сетимо плоскі поля (джерело правди = names)
    delete toSet.first_name;
    delete toSet.second_name;
    delete toSet.last_name;

    let updateDoc;

    if (ukIndex >= 0) {
      updateDoc = {
        ...(Object.keys(toSet).length ? { $set: toSet } : {}),
        $set: {
          ...(Object.keys(toSet).length ? toSet : {}),
          ...(ukPatch.first_name !== undefined
            ? { [`names.${ukIndex}.first_name`]: ukPatch.first_name }
            : {}),
          ...(ukPatch.second_name !== undefined
            ? { [`names.${ukIndex}.second_name`]: ukPatch.second_name }
            : {}),
          ...(ukPatch.last_name !== undefined
            ? { [`names.${ukIndex}.last_name`]: ukPatch.last_name }
            : {}),
          ...(ukPatch.no_last_name !== undefined
            ? { [`names.${ukIndex}.no_last_name`]: ukPatch.no_last_name }
            : {}),
          [`names.${ukIndex}.language`]: 'uk',
        },
        $push: {
          personRequests: {
            requestId: data?.requestId,
            operation: 'update',
            signedAt: new Date(),
          },
        },
      };
    } else {
      updateDoc = {
        ...(Object.keys(toSet).length ? { $set: toSet } : {}),
        $push: {
          names: ukPatch,
          personRequests: {
            requestId: data?.requestId,
            operation: 'update',
            signedAt: new Date(),
          },
        },
      };
    }

    const updated = await Patient.findOneAndUpdate(query, updateDoc, { new: true });
    return updated;
  }

  // CASE C: v2 payload, and DB has no names -> normal legacy update
  const toSet = { ...data };
  delete toSet.names;
  Object.keys(toSet).forEach((k) => toSet[k] === undefined && delete toSet[k]);

  const updated = await Patient.findOneAndUpdate(
    query,
    {
      $set: toSet,
      $push: {
        personRequests: {
          requestId: data?.requestId,
          operation: 'update',
          signedAt: new Date(),
        },
      },
    },
    { new: true }
  );

  return updated;
}

// -------- EPISODE UPSERT --------
async function upsertEpisode(patientId, episodeData) {
  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    const err = new Error('Patient not found');
    err.status = 404;
    throw err;
  }

  const episode = mapEpisodeFromEhealth(episodeData);
  const episodeId = episode.episodeId;

  const updated = await Patient.updateOne(
    { patientId, 'episodes.episodeId': episodeId },
    { $set: { 'episodes.$': episode } }
  );

  if (updated.matchedCount === 0) {
    await Patient.updateOne(
      { patientId, 'episodes.episodeId': { $ne: episodeId } },
      { $push: { episodes: episode } }
    );
  }

  return { episodeId };
}

// -------- COMPOSITION ATTACH/UPDATE --------
async function attachComposition(data) {
  const patient = await Patient.findOne({
    patientId: data.patientId,
  });

  if (!patient) {
    const err = new Error('Patient not found');
    err.status = 404;
    throw err;
  }

  const compositionDoc = {
    episodeId: data.episodeId,
    encounterId: data.encounterId ?? null,

    compositionId: data.compositionId,

    status: data.status ?? null,
    date: data.date ?? null,
    title: data.title ?? null,

    category: data.category ?? null,
    composition_type: data.composition_type ?? null,

    author: data.author ?? null,
    legal_entity: data.legal_entity ?? null,
    encounter: data.encounter ?? null,

    subject: data.subject ?? null,
    focus: data.focus ?? null,

    relatesTo: parseRelatesTo(data.relatesTo),

    event_validity_period: data.event_validity_period ?? null,
    extension: data.extension ?? null,

    sourceRequestId: data.sourceRequestId ?? null,
  };

  if (!Array.isArray(patient.compositions)) patient.compositions = [];

  const idx = patient.compositions.findIndex((c) => c.compositionId === data.compositionId);

  if (idx >= 0) patient.compositions[idx] = { ...patient.compositions[idx], ...compositionDoc };
  else patient.compositions.push(compositionDoc);

  await patient.save();

  return { composition: compositionDoc, compositionsCount: patient.compositions.length };
}

// -------- Encounter Package ATTACH/UPDATE --------
async function attachEncounterPackage(payload) {
  const { patientId, episodeId, raw } = payload;

  const patient = await Patient.findOne({ patientId });
  if (!patient) {
    const e = new Error('Patient not found');
    e.status = 404;
    throw e;
  }

  const pkg = buildEncounterPackage({ patientId, episodeId, raw });

  if (!Array.isArray(patient.encounter_packages)) patient.encounter_packages = [];

  // Upsert по encounterId + episodeId (інакше буде дубль)
  const idx = patient.encounter_packages.findIndex(
    (p) => p?.episodeId === pkg.episodeId && p?.encounter?.encounterId === pkg.encounter.encounterId
  );

  if (idx >= 0) patient.encounter_packages[idx] = { ...patient.encounter_packages[idx], ...pkg };
  else patient.encounter_packages.push(pkg);

  await patient.save();

  return { encounterPackage: pkg, count: patient.encounter_packages.length };
}

// ---------- Search Patients -----------------

// helper: "has field" check for arrays
function hasArray(field) {
  return { [`${field}.0`]: { $exists: true } };
}

function parseHas(has) {
  if (!has) return [];
  if (Array.isArray(has)) {
    return has
      .flatMap((x) => String(x).split(','))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return String(has)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function searchPatients(q) {
  const filter = {};

  // --- base filters ---
  if (q.environment) filter.environment = String(q.environment).toUpperCase();

  if (q.type) {
    const t = String(q.type).toUpperCase();
    if (!['PERSON', 'PREPERSON'].includes(t)) {
      const err = new Error('type must be PERSON or PREPERSON');
      err.status = 400;
      throw err;
    }
    filter.type = t;
  }

  if (q.patientId) filter.patientId = String(q.patientId);

  // --- createdAt range (YYYY-MM-DD) ---
  const from = q.created_from ? parseDateYYYYMMDD(String(q.created_from)) : null;
  if (from?.error) {
    const e = new Error(from.error);
    e.status = 400;
    throw e;
  }

  const to = q.created_to ? parseDateYYYYMMDD(String(q.created_to)) : null;
  if (to?.error) {
    const e = new Error(to.error);
    e.status = 400;
    throw e;
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) {
      const end = new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);
      filter.createdAt.$lte = end;
    }
  }

  // --- HAS filters (extensible) ---
  // supported:
  // has=episode
  // has=composition
  // has=encounter_package (alias: encounter)
  // has=observation / immunization / condition / procedure / diagnostic_report  (within encounter_packages)
  const has = parseHas(q.has).map((x) => x.toLowerCase());

  if (has.includes('episode')) Object.assign(filter, hasArray('episodes'));
  if (has.includes('composition')) Object.assign(filter, hasArray('compositions'));

  // encounter_package presence (alias "encounter")
  if (has.includes('encounter_package') || has.includes('encounter')) {
    Object.assign(filter, hasArray('encounter_packages'));
  }

  // entity-level filters within encounter_packages
  // (працює тільки якщо encounter_packages існує)
  // has=observation -> хоча б один пакет має observations[0]
  if (has.includes('observation'))
    Object.assign(filter, { 'encounter_packages.observations.0': { $exists: true } });
  if (has.includes('immunization'))
    Object.assign(filter, { 'encounter_packages.immunizations.0': { $exists: true } });
  if (has.includes('condition'))
    Object.assign(filter, { 'encounter_packages.conditions.0': { $exists: true } });
  if (has.includes('procedure'))
    Object.assign(filter, { 'encounter_packages.procedures.0': { $exists: true } });
  if (has.includes('diagnostic_report'))
    Object.assign(filter, { 'encounter_packages.diagnostic_reports.0': { $exists: true } });

  // --- filter by nested IDs ---
  if (q.episodeId) {
    const eid = String(q.episodeId);
    // або епізод у episodes, або пакет привʼязаний до епізоду
    filter.$and = (filter.$and || []).concat([
      { $or: [{ 'episodes.episodeId': eid }, { 'encounter_packages.episodeId': eid }] },
    ]);
  }

  if (q.compositionId) {
    filter['compositions.compositionId'] = String(q.compositionId);
  }

  if (q.encounterId) {
    const encId = String(q.encounterId);
    filter.$and = (filter.$and || []).concat([
      {
        $or: [
          { 'encounter_packages.encounter.encounterId': encId },
          // якщо encounterId зберігаєш також як плоский ключ у пакеті (опційно)
          { 'encounter_packages.encounterId': encId },
          // encounterId може бути в compositions (у тебе він там є)
          { 'compositions.encounterId': encId },
        ],
      },
    ]);
  }

  // --- filter by resource ids inside encounter_packages ---
  // observationId / conditionId / procedureId / diagnosticReportId / immunizationId

  if (q.observationId) {
    const id = String(q.observationId);
    filter.$and = (filter.$and || []).concat([{ 'encounter_packages.observations.id': id }]);
  }

  if (q.conditionId) {
    const id = String(q.conditionId);
    // condition може бути як окрема сутність, а також у encounter.diagnoses[].conditionId
    filter.$and = (filter.$and || []).concat([
      {
        $or: [
          { 'encounter_packages.conditions.id': id },
          { 'encounter_packages.encounter.diagnoses.conditionId': id },
        ],
      },
    ]);
  }

  if (q.immunizationId) {
    const id = String(q.immunizationId);
    filter.$and = (filter.$and || []).concat([{ 'encounter_packages.immunizations.id': id }]);
  }

  if (q.procedureId) {
    const id = String(q.procedureId);
    filter.$and = (filter.$and || []).concat([{ 'encounter_packages.procedures.id': id }]);
  }

  if (q.diagnosticReportId) {
    const id = String(q.diagnosticReportId);
    filter.$and = (filter.$and || []).concat([{ 'encounter_packages.diagnostic_reports.id': id }]);
  }

  // --- pagination ---
  const page = Math.max(parseInt(q.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(q.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;

  // --- projection ---
  const projection = {
    patientId: 1,
    environment: 1,
    type: 1,
    createdAt: 1,

    'episodes.episodeId': 1,

    'compositions.compositionId': 1,
    'compositions.episodeId': 1,
    'compositions.encounterId': 1,

    // encounter packages indicators
    'encounter_packages.episodeId': 1,
    'encounter_packages.encounter.encounterId': 1,
    'encounter_packages.conditions': 1, // якщо не треба — прибери
    'encounter_packages.observations': 1, // якщо не треба — прибери
    'encounter_packages.immunizations': 1,
    'encounter_packages.diagnostic_reports': 1,
    'encounter_packages.procedures': 1,

    // names/v2
    names: 1,
    first_name: 1,
    second_name: 1,
    last_name: 1,
  };

  const [items, total] = await Promise.all([
    Patient.find(filter, projection).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Patient.countDocuments(filter),
  ]);

  return { items, page, limit, total, appliedFilter: filter };
}

module.exports = {
  createPatient,
  updatePatient,
  upsertEpisode,
  attachComposition,
  attachEncounterPackage,
  searchPatients,
};
