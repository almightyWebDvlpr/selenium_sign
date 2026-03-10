// Витягуємо code зі стандартних структур
const pickCode = (x) => x?.code ?? x?.coding?.[0]?.code ?? null;

// coding[] -> "code" або ["code1","code2"]
function compactCoding(coding) {
  if (!Array.isArray(coding)) return undefined;
  const codes = coding.map((c) => c?.code).filter(Boolean);
  if (!codes.length) return undefined;
  return codes.length === 1 ? codes[0] : codes;
}

// будь-що "coding" -> codes, прибрати "system", рекурсія
function compactAny(v) {
  if (v === null || v === undefined) return v;

  if (Array.isArray(v)) return v.map(compactAny);

  if (typeof v !== 'object') return v;

  // {coding:[...]} => "code"/[]
  if (Array.isArray(v.coding)) return compactCoding(v.coding);

  const out = {};
  for (const [k, val] of Object.entries(v)) {
    if (k === 'system') continue; // 🔥 викидаємо system
    if (k === 'text' && (val === null || val === '')) continue; // шум
    const cv = compactAny(val);
    if (cv !== undefined) out[k] = cv;
  }
  return out;
}

// encounter -> ТВОЯ strict-структура
function compactEncounter(encPayload) {
  const d = encPayload?.data || encPayload;

  const encounterId = d?.id;
  const cls = d?.class?.code || null;
  const status = d?.status || null;

  const period = d?.period
    ? { start: d.period.start || null, end: d.period.end || null }
    : { start: null, end: null };

  const episodeId = d?.episode?.identifier?.value || null;
  const performerId = d?.performer?.identifier?.value || null;

  const diagnoses = (d?.diagnoses || [])
    .map((x) => ({
      code: x?.code?.coding?.[0]?.code || null,
      conditionId: x?.condition?.identifier?.value || null,
      rank: x?.rank ?? null,
      role: x?.role?.coding?.[0]?.code || null,
    }))
    .filter((x) => x.code || x.conditionId);

  return {
    encounterId,
    status,
    class: cls,
    period,
    episodeId,
    performerId,
    diagnoses,
  };
}

// Точка входу: з raw робимо encounter_package doc
function buildEncounterPackage({ patientId, episodeId, raw }) {
  if (!patientId) throw new Error('patientId is required');
  if (!episodeId) throw new Error('episodeId is required');
  if (!raw?.encounter) throw new Error('raw.encounter is required');

  const encounter = compactEncounter(raw.encounter);
  if (!encounter?.encounterId) throw new Error('encounterId not found in raw.encounter');

  return {
    patientId,
    episodeId,
    encounter,

    // інші сутності: "всі ключі з data, але compact"
    conditions: (raw.conditions || []).map((x) => compactAny(x?.data || x)),
    observations: (raw.observations || []).map((x) => compactAny(x?.data || x)),
    immunizations: (raw.immunizations || []).map((x) => compactAny(x?.data || x)),
    diagnostic_reports: (raw.diagnostic_reports || []).map((x) => compactAny(x?.data || x)),
    procedures: (raw.procedures || []).map((x) => compactAny(x?.data || x)),
  };
}

module.exports = {
  compactAny,
  compactEncounter,
  buildEncounterPackage,
};
