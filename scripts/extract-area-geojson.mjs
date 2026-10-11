import fs from "fs";
import path from "path";

function loadJson(p) {
  const raw = fs.readFileSync(p, "utf8");
  const start = raw.indexOf("{");
  return JSON.parse(raw.slice(start));
}

function simplifyRing(ring, step) {
  if (ring.length <= 40) return ring;
  const out = [];
  for (let i = 0; i < ring.length - 1; i += step) out.push(ring[i]);
  const first = ring[0];
  const last = out[out.length - 1];
  if (last[0] !== first[0] || last[1] !== first[1]) out.push(first);
  return out;
}

function simplifyGeom(geom, step) {
  if (geom.type === "Polygon") {
    return { type: "Polygon", coordinates: geom.coordinates.map((r) => simplifyRing(r, step)) };
  }
  if (geom.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geom.coordinates.map((poly) => poly.map((r) => simplifyRing(r, step))),
    };
  }
  return geom;
}

function pickFeature(fc, pred) {
  const feats = fc.type === "FeatureCollection" ? fc.features : [fc];
  return feats.find((f) => pred(f.properties || {}));
}

const regionsPath =
  process.argv[2] ||
  path.join(
    process.env.USERPROFILE,
    ".cursor/projects/c-Users-rober-Documents-Coding-Davide-Apolloni-sito/agent-tools/3c57244b-6935-4d61-ac93-0e3071760ce0.txt"
  );
const provincesPath =
  process.argv[3] ||
  path.join(
    process.env.USERPROFILE,
    ".cursor/projects/c-Users-rober-Documents-Coding-Davide-Apolloni-sito/agent-tools/f69f0f1b-9591-4942-b4f1-a5ad2ff2b432.txt"
  );

const regions = loadJson(regionsPath);
const veneto = pickFeature(
  regions,
  (p) =>
    String(p.reg_name || p.name || "").toLowerCase() === "veneto" ||
    String(p.reg_istat_code || "") === "05" ||
    p.reg_istat_code_num === 5
);
if (!veneto) {
  console.error("Veneto non trovato. Props sample:", regions.features?.[0]?.properties);
  process.exit(1);
}

let trento = null;
try {
  const provinces = loadJson(provincesPath);
  trento = pickFeature(
    provinces,
    (p) =>
      String(p.prov_name || p.name || "").toLowerCase() === "trento" ||
      String(p.prov_acr || "") === "TN" ||
      String(p.prov_istat_code || "") === "022"
  );
} catch (e) {
  console.warn("Province file non parsabile:", e.message);
}

const features = [
  {
    type: "Feature",
    properties: { name: "Veneto", kind: "region" },
    geometry: simplifyGeom(veneto.geometry, 8),
  },
];

if (trento) {
  features.push({
    type: "Feature",
    properties: { name: "Provincia di Trento", kind: "province" },
    geometry: simplifyGeom(trento.geometry, 6),
  });
}

const out = {
  type: "FeatureCollection",
  name: "area_operativa",
  crs: { type: "name", properties: { name: "EPSG:4326" } },
  features,
};

const dest = path.join(process.cwd(), "public/geo/area.geojson");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out));
const kb = (fs.statSync(dest).size / 1024).toFixed(1);
console.log("Scritto", dest, kb, "KB", "trento:", Boolean(trento), "veneto props", veneto.properties);
