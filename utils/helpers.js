function parseRelatesTo(relatesToRaw) {
  if (!Array.isArray(relatesToRaw) || !relatesToRaw.length) return undefined;

  return relatesToRaw
    .map((item) => {
      const code = item?.code;
      const type = item?.targetIdentifier?.type?.coding?.[0]?.code;
      const id = item?.targetIdentifier?.value;

      if (!code || !type || !id) return null;

      return {
        code,
        target: {
          type,
          id,
        },
      };
    })
    .filter(Boolean);
}

/* ---------- MAPPING HELPERS (put here) ---------- */

function ref(obj) {
  if (!obj) return undefined;
  return {
    display_value: obj.display_value ?? null,
    value: obj.identifier?.value ?? null,
  };
}

function codingFirst(obj) {
  // для diagnosis.role, де є role.coding[0]
  const c = obj?.coding?.[0];
  if (!c) return undefined;
  return { code: c.code ?? null, system: c.system ?? null };
}

function codingFromCode(obj) {
  // для diagnosis.code.coding[0]
  const c = obj?.coding?.[0];
  if (!c) return undefined;
  return { code: c.code ?? null, system: c.system ?? null };
}

function mapDiagnosis(d) {
  return {
    code: codingFromCode(d?.code),
    condition: ref(d?.condition),
    rank: d?.rank ?? null,
    role: codingFirst(d?.role),
  };
}

function mapEpisodeFromEhealth(data) {
  return {
    episodeId: data.id,

    name: data.name ?? null,
    status: data.status ?? null,
    status_reason: data.status_reason ?? null,

    type: data.type?.code ?? null, // <-- тільки "TREATMENT"
    period: data.period
      ? { start: data.period.start ?? null, end: data.period.end ?? null }
      : undefined,

    inserted_at: data.inserted_at ?? null,
    updated_at: data.updated_at ?? null,

    care_manager: ref(data.care_manager),
    care_team: ref(data.care_team),
    managing_organization: ref(data.managing_organization),
    part_of: ref(data.part_of),

    closing_summary: data.closing_summary ?? null,
    explanatory_letter: data.explanatory_letter ?? null,

    current_diagnoses: Array.isArray(data.current_diagnoses)
      ? data.current_diagnoses.map(mapDiagnosis)
      : [],
    diagnoses_history: Array.isArray(data.diagnoses_history)
      ? data.diagnoses_history.map((h) => ({
          date: h?.date ?? null,
          diagnoses: Array.isArray(h?.diagnoses) ? h.diagnoses.map(mapDiagnosis) : [],
          evidence: ref(h?.evidence),
          is_active: h?.is_active ?? null,
        }))
      : [],

    status_history: Array.isArray(data.status_history)
      ? data.status_history.map((s) => ({
          inserted_at: s?.inserted_at ?? null,
          inserted_by: s?.inserted_by ?? null,
          status: s?.status ?? null,
          status_reason: s?.status_reason ?? null,
        }))
      : [],
  };
}

/* ---------- END MAPPING HELPERS ---------- */

module.exports = {
  parseRelatesTo,
  mapEpisodeFromEhealth,
};
