const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "..",
  "shared",
  "india-states-districts.json",
);

function clean() {
  const raw = fs.readFileSync(filePath, "utf8");
  const obj = JSON.parse(raw);
  if (!obj.states || !Array.isArray(obj.states)) {
    console.error("Invalid file format");
    process.exit(1);
  }

  const cleaned = obj.states.map((s) => {
    const name = (s.name || "").trim();
    const districts = Array.isArray(s.districts)
      ? s.districts.map((d) => (d || "").trim()).filter(Boolean)
      : [];

    // dedupe (case-insensitive) preserving normalized casing
    const seen = new Map();
    for (const d of districts) {
      const key = d.toLowerCase();
      if (!seen.has(key)) seen.set(key, d);
    }
    const unique = Array.from(seen.values()).sort((a, b) => a.localeCompare(b));

    return { name, districts: unique };
  });

  // merge states with same name (if any) by combining districts
  const merged = [];
  const map = new Map();
  for (const s of cleaned) {
    const key = s.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name: s.name, districts: Array.from(s.districts) });
    } else {
      const existing = map.get(key);
      const all = existing.districts.concat(s.districts);
      // dedupe again
      const seen = new Map();
      for (const d of all) {
        const k = d.toLowerCase();
        if (!seen.has(k)) seen.set(k, d);
      }
      existing.districts = Array.from(seen.values()).sort((a, b) =>
        a.localeCompare(b),
      );
      map.set(key, existing);
    }
  }

  for (const v of map.values()) merged.push(v);

  // sort merged array by state name A->Z
  merged.sort((a, b) => a.name.localeCompare(b.name));

  const out = { states: merged };
  fs.writeFileSync(filePath, JSON.stringify(out, null, 2), "utf8");
  console.log("Cleaned and wrote", filePath);
}

clean();
