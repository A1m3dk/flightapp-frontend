export function parseBoardingPass(raw, now = new Date()) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.replace(/[\r\n]+/g, "");
  if (s.length < 60 || s[0] !== "M") return null;

  const from = s.slice(30, 33);
  const to = s.slice(33, 36);
  const carrier = s.slice(36, 39).trim();
  const flightRaw = s.slice(39, 44).trim();
  const julian = parseInt(s.slice(44, 47), 10);
  const seat = s.slice(48, 52).trim().replace(/^0+/, "");

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) return null;
  if (!/^[A-Z0-9]{2,3}$/.test(carrier)) return null;
  const m = /^(\d{1,4})([A-Z]?)$/.exec(flightRaw);
  if (!m || !julian || julian < 1 || julian > 366) return null;

  const number = carrier + String(parseInt(m[1], 10)) + m[2];

  let best = null;
  const year = now.getUTCFullYear();
  for (const y of [year - 1, year, year + 1]) {
    const d = new Date(Date.UTC(y, 0, julian));
    const diff = Math.abs(d.getTime() - now.getTime());
    if (!best || diff < best.diff) best = { d, diff };
  }
  const date = best.d.toISOString().slice(0, 10);

  return { from, to, carrier, number, date, seat };
}