/**
 * Diagnostic GeoAI (§11) : données géospatiales (Open-Meteo, SoilGrids) +
 * données déclarées → aptitude par culture, score agricole, pression sur
 * l'eau, estimation économique. Chaque donnée porte sa nature et sa source
 * (règle 8 : ne jamais mélanger mesuré, déclaré et estimé).
 */
import { LEVEL_LABEL, missingData, rankCrops, type CropSuitability, type SiteData } from "./crops";
import { economicEstimate, waterPressure, type EconomicEstimate, type WaterPressure } from "./water-economics";

export const DIAGNOSTIC_VERSION = 1;

export interface DataPoint {
  label: string;
  value: string;
  nature: "mesuré" | "estimé" | "déclaré";
  source: string;
}

export interface Diagnostic {
  version: number;
  generatedAt: string;
  site: SiteData;
  dataPoints: DataPoint[];
  crops: CropSuitability[];
  agriScore: number;
  summary: string;
  waterPressure: WaterPressure | null;
  economics: EconomicEstimate[];
  recommendations: string[];
  missing: string[];
  sources: string[];
}

type Fetch = typeof fetch;
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

async function getJson(f: Fetch, url: string, ms = 15000): Promise<unknown | null> {
  try {
    const r = await f(url, { signal: AbortSignal.timeout(ms), headers: { "User-Agent": "VerdOlive/1.0 (diagnostic agricole)" } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** Climat de la dernière année complète (Open-Meteo, réanalyse ERA5). */
export async function fetchClimate(lat: number, lng: number, f: Fetch = fetch) {
  const year = new Date().getUTCFullYear() - 1;
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${year}-01-01&end_date=${year}-12-31` +
    "&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,et0_fao_evapotranspiration,shortwave_radiation_sum,wind_speed_10m_max&timezone=Africa%2FTunis";
  const j = (await getJson(f, url)) as { elevation?: number; daily?: Record<string, (number | null)[]> & { time: string[] } } | null;
  if (!j?.daily?.time?.length) return null;
  const d = j.daily;
  const nums = (k: string) => (d[k] ?? []).map((v) => (v == null ? NaN : Number(v)));
  const sum = (a: number[]) => a.filter((x) => !Number.isNaN(x)).reduce((s, x) => s + x, 0);
  const mean = (a: number[]) => {
    const v = a.filter((x) => !Number.isNaN(x));
    return v.length ? sum(v) / v.length : NaN;
  };
  const tmax = nums("temperature_2m_max");
  const tmin = nums("temperature_2m_min");
  const byMonth = (a: number[]) => {
    const m: number[][] = Array.from({ length: 12 }, () => []);
    d.time.forEach((t, i) => m[Number(t.slice(5, 7)) - 1].push(a[i]));
    return m.map(mean);
  };
  return {
    year,
    elevationM: j.elevation ?? null,
    rainMm: Math.round(sum(nums("precipitation_sum"))),
    tMean: round(mean(nums("temperature_2m_mean"))),
    tMinCold: round(Math.min(...byMonth(tmin))),
    tMaxHot: round(Math.max(...byMonth(tmax))),
    frostDays: tmin.filter((x) => x < 0).length,
    chillDays: tmin.filter((x) => x < 7).length,
    et0Mm: Math.round(sum(nums("et0_fao_evapotranspiration"))),
    radiationMJ: Math.round(mean(nums("shortwave_radiation_sum")) * 10) / 10,
    windMax: round(Math.max(...nums("wind_speed_10m_max").filter((x) => !Number.isNaN(x)))),
  };
}

/** Sol 0-30 cm (SoilGrids 250 m, ISRIC) : estimations modélisées. */
export async function fetchSoil(lat: number, lng: number, f: Fetch = fetch) {
  const url =
    `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}` +
    "&property=phh2o&property=clay&property=sand&property=soc&property=nitrogen&depth=0-5cm&depth=5-15cm&depth=15-30cm&value=mean";
  // SoilGrids limite le nombre d'appels par minute : une seconde tentative si besoin.
  const j = ((await getJson(f, url, 20000)) ?? (await new Promise((r) => setTimeout(r, 1500)).then(() => getJson(f, url, 20000)))) as { properties?: { layers?: { name: string; unit_measure: { d_factor: number }; depths: { values: { mean: number | null } }[] }[] } } | null;
  const layers = j?.properties?.layers;
  if (!layers) return null;
  const get = (name: string) => {
    const l = layers.find((x) => x.name === name);
    const vals = (l?.depths ?? []).map((dd) => dd.values.mean).filter((v): v is number => v != null);
    return vals.length ? round(vals.reduce((a, b) => a + b, 0) / vals.length / (l!.unit_measure.d_factor || 1)) : null;
  };
  const out = { ph: get("phh2o"), clayPct: get("clay"), sandPct: get("sand"), socGkg: get("soc"), nitrogenGkg: get("nitrogen") };
  return Object.values(out).some((v) => v != null) ? out : null;
}

export interface DiagnoseInput {
  lat: number;
  lng: number;
  areaHa: number;
  exploitableAreaHa: number | null;
  water: { available: boolean; yearRound: boolean; salinityGL: number | null; flowLs: number | null; flowNature: string | null };
  declaredCrops: string | null;
}

export async function diagnose(input: DiagnoseInput, f: Fetch = fetch, now = new Date()): Promise<Diagnostic> {
  const [climate, soil] = await Promise.all([fetchClimate(input.lat, input.lng, f), fetchSoil(input.lat, input.lng, f)]);
  return buildDiagnostic(input, climate, soil, now);
}

export function buildDiagnostic(
  input: DiagnoseInput,
  climate: Awaited<ReturnType<typeof fetchClimate>>,
  soil: Awaited<ReturnType<typeof fetchSoil>>,
  now = new Date(),
): Diagnostic {
  const site: SiteData = {
    rainMm: climate?.rainMm ?? null,
    tMean: climate?.tMean ?? null,
    tMinCold: climate?.tMinCold ?? null,
    tMaxHot: climate?.tMaxHot ?? null,
    frostDays: climate?.frostDays ?? null,
    chillDays: climate?.chillDays ?? null,
    et0Mm: climate?.et0Mm ?? null,
    elevationM: climate?.elevationM ?? null,
    soilPh: soil?.ph ?? null,
    clayPct: soil?.clayPct ?? null,
    sandPct: soil?.sandPct ?? null,
    water: { available: input.water.available, yearRound: input.water.yearRound, salinityGL: input.water.salinityGL, flowLs: input.water.flowLs },
  };

  const era = `Open-Meteo (réanalyse ERA5, année ${climate?.year ?? "?"})`;
  const dataPoints: DataPoint[] = [];
  const add = (label: string, v: number | null | undefined, unit: string, nature: DataPoint["nature"], source: string) => {
    if (v != null && !Number.isNaN(v)) dataPoints.push({ label, value: `${v}${unit}`, nature, source });
  };
  add("Pluie annuelle", climate?.rainMm, " mm", "estimé", era);
  add("Température moyenne", climate?.tMean, " °C", "estimé", era);
  add("Minimales du mois le plus froid", climate?.tMinCold, " °C", "estimé", era);
  add("Maximales du mois le plus chaud", climate?.tMaxHot, " °C", "estimé", era);
  add("Jours de gel", climate?.frostDays, " j", "estimé", era);
  add("Évapotranspiration (ET0)", climate?.et0Mm, " mm/an", "estimé", era);
  add("Rayonnement solaire moyen", climate?.radiationMJ, " MJ/m²/j", "estimé", era);
  add("Vent maximal", climate?.windMax, " km/h", "estimé", era);
  add("Altitude", climate?.elevationM, " m", "estimé", "Open-Meteo (modèle numérique de terrain)");
  add("pH du sol (0-30 cm)", soil?.ph, "", "estimé", "SoilGrids 250 m (ISRIC)");
  add("Argile", soil?.clayPct, " %", "estimé", "SoilGrids 250 m (ISRIC)");
  add("Sable", soil?.sandPct, " %", "estimé", "SoilGrids 250 m (ISRIC)");
  add("Azote total", soil?.nitrogenGkg, " g/kg", "estimé", "SoilGrids 250 m (ISRIC)");
  add("Carbone organique", soil?.socGkg, " g/kg", "estimé", "SoilGrids 250 m (ISRIC)");
  add("Débit d'eau", input.water.flowLs, " l/s", input.water.flowNature === "measured" ? "mesuré" : "déclaré", "Propriétaire");
  add("Salinité de l'eau", input.water.salinityGL, " g/l", "déclaré", "Propriétaire");

  const crops = rankCrops(site);
  const best = crops[0];
  const agriScore = climate ? best.score : 0;
  const area = input.exploitableAreaHa ?? input.areaHa;

  const wp = input.water.available
    ? waterPressure({ crop: best.crop, et0Mm: site.et0Mm, rainMm: site.rainMm, areaHa: area, flowLs: input.water.flowLs, yearRound: input.water.yearRound })
    : null;
  const economics = crops
    .filter((c) => c.level !== "unsuitable")
    .slice(0, 3)
    .map((c) => economicEstimate(c.crop, area, c.irrigation === "needed"));

  const recommendations: string[] = [];
  const good = crops.filter((c) => c.level === "very_good" || c.level === "good");
  if (good.length) recommendations.push(`Cultures les plus adaptées : ${good.slice(0, 3).map((c) => c.label.toLowerCase()).join(", ")}.`);
  if (wp?.level === "deficit") recommendations.push(wp.recommendation);
  if (!input.water.available && crops.some((c) => c.irrigation === "needed_missing"))
    recommendations.push("Sans eau sur le terrain, privilégier les cultures sèches adaptées ou étudier un forage autorisé.");
  if (input.water.available) recommendations.push("Irrigation goutte-à-goutte recommandée pour économiser l'eau (principe CSA 6).");
  const missing = missingData(site);

  const summary = climate
    ? `Climat ${site.rainMm! < 250 ? "aride" : site.rainMm! < 400 ? "semi-aride" : "subhumide"} (${site.rainMm} mm de pluie, ${site.tMean} °C de moyenne). ` +
      `Culture la plus adaptée : ${best.label.toLowerCase()} (${LEVEL_LABEL[best.level].toLowerCase()}, ${best.score}/100).`
    : "Données climatiques indisponibles : diagnostic partiel, à relancer.";

  return {
    version: DIAGNOSTIC_VERSION,
    generatedAt: now.toISOString(),
    site,
    dataPoints,
    crops,
    agriScore,
    summary,
    waterPressure: wp,
    economics,
    recommendations,
    missing,
    sources: [era, "SoilGrids 250 m, ISRIC (sol, estimations modélisées)", "Déclarations du propriétaire (eau)"],
  };
}
