function parseDateYYYYMMDD(s) {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
    return { error: `Invalid date format: ${s} (expected YYYY-MM-DD)` };

  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  if (Number.isNaN(dt.getTime())) return { error: `Invalid date value: ${s}` };
  return dt;
}

module.exports = { parseDateYYYYMMDD };
