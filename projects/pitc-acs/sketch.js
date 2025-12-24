/**
 * PITC × ACS Correlations (San Diego County, 2013–2025)
 *
 * Interactive p5.js choropleth:
 * - Loads simplified tract boundaries (GeoJSON)
 * - Loads year-specific CSVs containing PIT + ACS indicators by tract
 * - Computes Pearson correlation (r) between PIT total and each ACS variable by year
 *
 * UI:
 * - Variable dropdown
 * - Year slider + autoplay
 * - Hover details, legend, help overlay
 */

const CONFIG = {
  GUTTER: 24,

  GEOJSON_FILE: "sd_tracts_simplified.json",

  YEAR_FILES: {
    2013: "SD_ACS_CT_2013_PITC.csv",
    2014: "SD_ACS_CT_2014_PITC.csv",
    2018: "SD_ACS_CT_2018_PITC.csv",
    2020: "SD_ACS_CT_2020_PITC.csv",
    2024: "SD_ACS_CT_2024_PITC.csv",
    2025: "SD_ACS_CT_2025_PITC.csv",
  },

  TRACT_ID_CANDIDATES: ["tract", "TRACT", "Tract"],

  VARIABLES: {
    // PIT
    pit_total: {
      label: "Total PIT count",
      columns: ["Total_Count", "TotalCount", "totalcount", "total_count"],
    },

    // Demographics
    TotalPop:   { label: "Total population",           column: "TotalPop" },
    Female:     { label: "Female",                     column: "Female" },
    Male:       { label: "Male",                       column: "Male" },

    // Race / Ethnicity
    Asian:      { label: "Asian",                      column: "Asian" },
    NonHispA:   { label: "Non-Hispanic Asian",         column: "NonHispA" },
    White:      { label: "White",                      column: "White" },
    NonHispW:   { label: "Non-Hispanic White",         column: "NonHispW" },
    Am_Indian:  { label: "American Indian",            column: "Am_Indian" },
    Hawaii_PI:  { label: "Native Hawaiian / PI",       column: "Hawaii_PI" },
    TotalHisp:  { label: "Total Hispanic",             column: "TotalHisp" },
    NonHispB:   { label: "Non-Hispanic Black",         column: "NonHispB" },
    Black:      { label: "Black",                      column: "Black" },
    OtherRace:  { label: "Other race",                 column: "OtherRace" },

    // Education
    Bachelor:   { label: "Bachelor’s degree",          column: "Bachelor" },
    Associate:  { label: "Associate degree",           column: "Associate" },
    Master:     { label: "Master’s degree",            column: "Master" },
    HighSch:    { label: "High school",                column: "HighSch" },
    College:    { label: "Some college",               column: "College" },
    "9_12Grade":{ label: "9–12th grade",               column: "9_12Grade" },
    Less9Grade: { label: "< 9th grade",                column: "Less9Grade" },
    "25_Older": { label: "Age 25 & older",             column: "25_Older" },

    // Population structure
    Pop5Plus:   { label: "Age 5 & older",              column: "Pop5Plus" },

    // Socioeconomic
    CashAssis:  { label: "Cash assistance",            column: "CashAssis" },
    BelowPover: { label: "Below poverty",              column: "BelowPover" },
    MedianInco: { label: "Median income",              column: "MedianInco" },
    Unemployed: { label: "Unemployed",                 column: "Unemployed" },

    // Immigration / Military / Family
    BornForeig: { label: "Foreign born",               column: "BornForeig" },
    ArmedForce: { label: "Armed forces",               column: "ArmedForce" },
    WithChild:  { label: "With child",                 column: "WithChild" },

    // Family / relationships
    Married:    { label: "Married",                    column: "Married" },

    // Occupation
    Profession: { label: "Profession",                 column: "Profession" },

    // Health coverage
    insurance:  { label: "Health insurance",           column: "insurance" },
  },

  AUTOPLAY_EVERY_N_FRAMES: 30,
  TOP_CORR_ROWS: 12,

  ZOOM: { min: 1, max: 6 },
};

// Derived keys
const YEARS = Object.keys(CONFIG.YEAR_FILES);         // ["2013", ...]
const VARIABLE_KEYS = Object.keys(CONFIG.VARIABLES);  // ["pit_total", ...]

// ---------------------------
// App state
// ---------------------------

// Data
let geo = null;
let yearTables = {};        // year -> p5.Table
let values = {};            // values[varKey][year][tractId] = number|null
let maxValue = {};          // maxValue[varKey][year] = number
let tracts = [];            // [{ tractId, props, screenCoords, centroid, values }]

// Selection
let currentYear = YEARS[0] ?? "2013";
let currentVariableKey = "pit_total";

// Layout / view
let panelWidth = 320;
let mapLeft, mapRight, mapTop, mapBottom;
let scaleFactor, offsetX, offsetY;
let mapCenterX, mapCenterY;
let zoomFactor = 1;
let panX = 0, panY = 0;
let isPanning = false;
let prevMouseX = 0, prevMouseY = 0;

// UI elements
let panelDiv;
let yearSlider, playButton, variableSelect;
let legendMinSpan, legendMidSpan, legendMaxSpan, legendTitleSpan;
let infoYearSpan, infoVarSpan, infoDetailSpan;

let hoveredTract = null;
let isPlaying = false;

// Help overlay
let helpButton, helpOverlay;
let helpVisible = false;

// Correlations
let correlationMatrix = {};   // correlationMatrix[year][varKey] = r
let corrPanelDiv;
let corrContentContainer = null;

// ---------------------------
// p5 lifecycle
// ---------------------------

function preload() {
  geo = loadJSON(CONFIG.GEOJSON_FILE);

  for (const y of YEARS) {
    yearTables[y] = loadTable(CONFIG.YEAR_FILES[y], "csv", "header");
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);

  applyBasePageStyles();

  updateLayoutMetrics();
  buildValues();
  computeProjection();
  buildTracts();

  computeCorrelationMatrix();

  buildUIPanel();
  createHelpOverlay(); // created hidden
}

function draw() {
  background(5, 6, 10);

  drawTracts();
  updateLegendDOM();
  updateInfoDOM();

  if (isPlaying && frameCount % CONFIG.AUTOPLAY_EVERY_N_FRAMES === 0) {
    advanceYear();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  updateLayoutMetrics();
  computeProjection();
  buildTracts();
  resetView();

  if (panelDiv) {
    panelDiv.position(CONFIG.GUTTER, CONFIG.GUTTER);
    panelDiv.style("width", `${panelWidth}px`);
    panelDiv.style("max-height", `${height - CONFIG.GUTTER * 2}px`);
  }
}

// ---------------------------
// Styling helpers
// ---------------------------

function applyBasePageStyles() {
  const body = select("body");
  if (!body) return;

  body.style("margin", "0");
  body.style("background", "#05060A");
  body.style("font-family", "system-ui, -apple-system, BlinkMacSystemFont, sans-serif");
  body.style("color", "#F9FAFB");
}

function setStyles(el, styles) {
  for (const [k, v] of Object.entries(styles)) el.style(k, v);
  return el;
}

function makeDiv(parent, styles = {}) {
  const d = createDiv();
  if (parent) d.parent(parent);
  setStyles(d, styles);
  return d;
}

function makeSpan(text, parent, styles = {}) {
  const s = createSpan(text);
  if (parent) s.parent(parent);
  setStyles(s, styles);
  return s;
}

// ---------------------------
// Layout / view helpers
// ---------------------------

function updateLayoutMetrics() {
  panelWidth = constrain(width * 0.32, 260, 380);
}

function resetView() {
  zoomFactor = 1;
  panX = 0;
  panY = 0;
}

function advanceYear() {
  const idx = YEARS.indexOf(currentYear);
  const next = (idx + 1) % YEARS.length;
  currentYear = YEARS[next];
  if (yearSlider) yearSlider.value(next);
  renderCorrelationMatrix();
}

// ---------------------------
// Color ramp
// ---------------------------

const INFERNO_STOPS = [
  [0.001462, 0.000466, 0.013866],
  [0.391529, 0.133743, 0.511733],
  [0.865006, 0.316822, 0.226055],
  [0.988362, 0.998364, 0.644924],
];

function infernoColor(t) {
  t = constrain(t, 0, 1);

  let a, b, p;
  if (t < 0.33) {
    a = INFERNO_STOPS[0]; b = INFERNO_STOPS[1];
    p = map(t, 0.0, 0.33, 0, 1);
  } else if (t < 0.66) {
    a = INFERNO_STOPS[1]; b = INFERNO_STOPS[2];
    p = map(t, 0.33, 0.66, 0, 1);
  } else {
    a = INFERNO_STOPS[2]; b = INFERNO_STOPS[3];
    p = map(t, 0.66, 1.0, 0, 1);
  }

  return color(
    lerp(a[0] * 255, b[0] * 255, p),
    lerp(a[1] * 255, b[1] * 255, p),
    lerp(a[2] * 255, b[2] * 255, p)
  );
}

function colorForValue(v) {
  const maxVal = maxValue?.[currentVariableKey]?.[currentYear] ?? 1;
  const val = v == null ? 0 : v;
  return infernoColor(constrain(val / maxVal, 0, 1));
}

// ---------------------------
// UI
// ---------------------------

function buildUIPanel() {
  panelDiv = makeDiv(null, {
    background: "rgba(15,17,25,0.96)",
    padding: "16px 18px 14px 18px",
    "border-radius": "16px",
    "box-shadow": "0 10px 30px rgba(0,0,0,0.6)",
    width: `${panelWidth}px`,
    "font-size": "13px",
    color: "#F9FAFB",
    "backdrop-filter": "blur(8px)",
    border: "1px solid #1E293B",
    "max-height": `${height - CONFIG.GUTTER * 2}px`,
    "overflow-y": "auto",
  });

  panelDiv.position(CONFIG.GUTTER, CONFIG.GUTTER);

  // Title row + Help button
  const titleRow = makeDiv(panelDiv, {
    display: "flex",
    "align-items": "center",
    "justify-content": "space-between",
    "margin-bottom": "4px",
  });

  makeSpan("Point-in-Time Count vs ACS Variables (San Diego County)", titleRow, {
    "font-size": "18px",
    "font-weight": "600",
  });

  helpButton = createButton("Help");
  helpButton.parent(titleRow);
  setStyles(helpButton, {
    padding: "2px 10px",
    "font-size": "11px",
    "border-radius": "999px",
    border: "1px solid #374151",
    background: "#020617",
    color: "#E5E7EB",
    cursor: "pointer",
  });
  helpButton.mousePressed(toggleHelpOverlay);

  makeSpan(
    "PIT counts and ACS 5-year estimates joined by census tract.",
    panelDiv,
    {
      display: "block",
      "font-size": "12px",
      color: "#9CA3AF",
      "margin-bottom": "10px",
    }
  );

  // Variable row
  const varRow = makeDiv(panelDiv, { "margin-bottom": "10px" });
  makeSpan("Variable ", varRow, { "font-weight": "500" });

  variableSelect = createSelect();
  variableSelect.parent(varRow);
  setStyles(variableSelect, {
    "font-size": "13px",
    padding: "4px 8px",
    "border-radius": "8px",
    border: "1px solid #374151",
    background: "#020617",
    color: "#F9FAFB",
  });

  for (const key of VARIABLE_KEYS) {
    variableSelect.option(CONFIG.VARIABLES[key].label, key);
  }
  variableSelect.selected(currentVariableKey);
  variableSelect.changed(() => {
    currentVariableKey = variableSelect.value();
    renderCorrelationMatrix();
  });

  // Year slider + play
  const sliderRow = makeDiv(panelDiv, {
    "margin-top": "8px",
    display: "flex",
    "align-items": "center",
    gap: "8px",
  });

  makeSpan("Year ", sliderRow, { "font-weight": "500" });

  yearSlider = createSlider(0, YEARS.length - 1, YEARS.indexOf(currentYear));
  yearSlider.parent(sliderRow);
  yearSlider.style("width", "200px");
  yearSlider.elt.style.height = "6px";
  yearSlider.elt.style.borderRadius = "999px";
  yearSlider.elt.style.accentColor = "#F97316";
  yearSlider.input(() => {
    const idx = yearSlider.value();
    currentYear = YEARS[idx];
    renderCorrelationMatrix();
  });

  playButton = createButton("Play");
  playButton.parent(sliderRow);
  setStyles(playButton, {
    padding: "4px 10px",
    "border-radius": "999px",
    border: "1px solid #374151",
    background: "#111827",
    color: "#F9FAFB",
    "font-size": "12px",
  });
  playButton.mousePressed(() => {
    isPlaying = !isPlaying;
    playButton.elt.textContent = isPlaying ? "Pause" : "Play";
  });

  // Tick labels
  const ticksRow = makeDiv(panelDiv, {
    display: "flex",
    "justify-content": "space-between",
    width: "240px",
    "margin-left": "46px",
    "margin-top": "2px",
    "font-size": "11px",
    color: "#9CA3AF",
  });
  for (const y of YEARS) makeSpan(y, ticksRow);

  // Legend
  const legendRow = makeDiv(panelDiv, { "margin-top": "12px" });

  legendTitleSpan = makeSpan("Total PIT count", legendRow, {
    "font-size": "11px",
    "font-weight": "500",
    "text-transform": "uppercase",
    "letter-spacing": "0.04em",
    color: "#9CA3AF",
    display: "block",
    "margin-bottom": "4px",
  });

  const gradWrap = makeDiv(legendRow, {
    position: "relative",
    width: "260px",
    height: "24px",
  });

  makeDiv(gradWrap, {
    position: "absolute",
    left: "0",
    right: "0",
    bottom: "0",
    height: "14px",
    "border-radius": "999px",
    background: "linear-gradient(to right, #050316, #441074, #D5392F, #F7D04A)",
  });

  legendMinSpan = makeSpan("0", gradWrap, {
    position: "absolute",
    top: "0",
    left: "0",
    "font-size": "11px",
    color: "#9CA3AF",
  });

  legendMidSpan = makeSpan("—", gradWrap, {
    position: "absolute",
    top: "0",
    left: "50%",
    transform: "translateX(-50%)",
    "font-size": "11px",
    color: "#9CA3AF",
  });

  legendMaxSpan = makeSpan("0", gradWrap, {
    position: "absolute",
    top: "0",
    right: "0",
    "font-size": "11px",
    color: "#9CA3AF",
  });

  // Hover info
  const infoRow = makeDiv(panelDiv, {
    "margin-top": "10px",
    "padding-top": "4px",
    "border-top": "1px solid #1F2933",
  });

  infoYearSpan = makeSpan("", infoRow, { display: "block" });
  infoVarSpan = makeSpan("", infoRow, { display: "block" });
  infoDetailSpan = makeSpan("", infoRow, { display: "block" });

  // Correlation panel
  const corrTitleRow = makeDiv(panelDiv, {
    "margin-top": "12px",
    display: "flex",
    "align-items": "center",
    "justify-content": "space-between",
  });

  makeSpan("Top correlations (PIT vs ACS)", corrTitleRow, {
    "font-size": "11px",
    "font-weight": "500",
    "text-transform": "uppercase",
    "letter-spacing": "0.04em",
    color: "#9CA3AF",
  });

  makeSpan("by selected year", corrTitleRow, {
    "font-size": "10px",
    color: "#6B7280",
  });

  corrPanelDiv = makeDiv(panelDiv, { "margin-top": "4px" });

  renderCorrelationMatrix();
}

// ---------------------------
// Help overlay
// ---------------------------

function createHelpOverlay() {
  helpOverlay = makeDiv(null, {
    position: "fixed",
    inset: "0",
    background: "rgba(15,23,42,0.75)",
    "backdrop-filter": "blur(6px)",
    display: "flex",
    "align-items": "center",
    "justify-content": "center",
    "z-index": "9999",
    "font-family": "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#F9FAFB",
  });

  const card = makeDiv(helpOverlay, {
    background: "#020617",
    "border-radius": "16px",
    border: "1px solid #1E293B",
    padding: "16px 18px",
    "max-width": "420px",
    "max-height": "70vh",
    "overflow-y": "auto",
    "box-shadow": "0 20px 45px rgba(0,0,0,0.8)",
    "font-size": "13px",
  });

  const hdrRow = makeDiv(card, {
    display: "flex",
    "justify-content": "space-between",
    "align-items": "center",
    "margin-bottom": "6px",
  });

  makeSpan("How to use this map", hdrRow, { "font-size": "16px", "font-weight": "600" });

  const closeBtn = createButton("×");
  closeBtn.parent(hdrRow);
  setStyles(closeBtn, {
    width: "22px",
    height: "22px",
    "border-radius": "999px",
    border: "1px solid #374151",
    background: "#020617",
    color: "#E5E7EB",
    cursor: "pointer",
    "font-size": "14px",
  });
  closeBtn.mousePressed(toggleHelpOverlay);

  const body = makeDiv(card, { color: "#D1D5DB", "line-height": "1.4" });

  addHelpSection(body, "Map navigation", [
    "Scroll to zoom in and out.",
    "Click and drag to pan the map.",
    "Press 0 to reset zoom and pan.",
    "Move your mouse over a tract to see its value.",
  ]);

  addHelpSection(body, "Controls", [
    "Variable dropdown changes the ACS indicator shown on the map.",
    "Year slider switches between PIT count years.",
    "Play animates through the available years.",
    "The color bar shows low (left) to high (right) values for the selected variable.",
  ]);

  addHelpSection(body, "Correlations", [
    "Top correlations shows Pearson r between PIT total count and each ACS variable.",
    "Values near +1 = strong positive; near -1 = strong negative; near 0 = weak/no linear relationship.",
    "The highlighted row matches the selected variable.",
  ]);

  addHelpSection(body, "Data notes", [
    "PIT counts and ACS 5-year estimates are joined by census tract.",
    "Some years may share the same ACS vintage (e.g., 2023 ACS for 2024–2025 PIT).",
    "Tracts with missing data appear with low or no color intensity.",
  ]);

  helpOverlay.hide();
}

function addHelpSection(parent, titleText, lines) {
  const section = makeDiv(parent, { "margin-bottom": "8px" });
  makeSpan(titleText, section, {
    display: "block",
    "font-weight": "600",
    "margin-bottom": "2px",
  });

  for (const line of lines) {
    const p = createP("• " + line);
    p.parent(section);
    setStyles(p, { margin: "0 0 2px 12px", "font-size": "13px" });
  }
}

function toggleHelpOverlay() {
  helpVisible = !helpVisible;
  if (!helpOverlay) return;
  helpVisible ? helpOverlay.show() : helpOverlay.hide();
}

// ---------------------------
// Drawing
// ---------------------------

function drawTracts() {
  push();

  translate(panX, panY);
  translate(mapCenterX, mapCenterY);
  scale(zoomFactor);
  translate(-mapCenterX, -mapCenterY);

  // Fill polygons
  noStroke();
  for (const region of tracts) {
    const v = region.values?.[currentVariableKey]?.[currentYear];
    fill(colorForValue(v));
    beginShape();
    for (const pt of region.screenCoords) vertex(pt.x, pt.y);
    endShape(CLOSE);
  }

  // Hover outline
  if (hoveredTract) {
    stroke(249, 115, 22);
    strokeWeight(3 / zoomFactor);
    noFill();
    beginShape();
    for (const pt of hoveredTract.screenCoords) vertex(pt.x, pt.y);
    endShape(CLOSE);
  }

  // Base outlines
  stroke(90);
  strokeWeight(1.0 / zoomFactor);
  noFill();
  for (const region of tracts) {
    beginShape();
    for (const pt of region.screenCoords) vertex(pt.x, pt.y);
    endShape(CLOSE);
  }

  pop();
}

// ---------------------------
// Data loading / preprocessing
// ---------------------------

function findHeader(headers, candidates) {
  const lower = headers.map(h => String(h).toLowerCase());
  for (const cand of candidates) {
    const idx = lower.indexOf(String(cand).toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function findVariableColumn(headers, varKey) {
  const cfg = CONFIG.VARIABLES[varKey];

  if (Array.isArray(cfg.columns)) {
    return cfg.columns.find(c => headers.includes(c)) ?? null;
  }
  if (cfg.column && headers.includes(cfg.column)) return cfg.column;

  return null;
}

function buildValues() {
  // initialize
  values = {};
  maxValue = {};
  for (const key of VARIABLE_KEYS) {
    values[key] = {};
    maxValue[key] = {};
  }

  for (const y of YEARS) {
    const table = yearTables[y];
    const headers = table.columns || table.getColumnTitles();
    const tractCol = findHeader(headers, CONFIG.TRACT_ID_CANDIDATES) || headers[0];

    const perVarMap = {};
    const perVarMax = {};

    for (const key of VARIABLE_KEYS) {
      perVarMap[key] = {};
      perVarMax[key] = 0;
    }

    for (let r = 0; r < table.getRowCount(); r++) {
      const row = table.getRow(r);

      const tractId = canonicalTractIdFromCSV(row.getString(tractCol));
      if (tractId == null) continue;

      for (const key of VARIABLE_KEYS) {
        const colName = findVariableColumn(headers, key);

        let v = null;
        if (colName) {
          v = Number(row.getString(colName));
          if (Number.isNaN(v)) v = null;
        }

        perVarMap[key][tractId] = v;
        if (typeof v === "number" && v > perVarMax[key]) perVarMax[key] = v;
      }
    }

    for (const key of VARIABLE_KEYS) {
      values[key][y] = perVarMap[key];
      maxValue[key][y] = perVarMax[key] || 1;
    }
  }
}

// ---------------------------
// Projection + tract build
// ---------------------------

function computeProjection() {
  const features = geo?.features ?? [];

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const f of features) {
    const ring = f.geometry?.coordinates?.[0] ?? [];
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const dataWidth = maxX - minX;
  const dataHeight = maxY - minY;

  mapLeft = panelWidth + CONFIG.GUTTER * 2;
  mapRight = width - CONFIG.GUTTER;
  mapTop = CONFIG.GUTTER;
  mapBottom = height - CONFIG.GUTTER;

  const mapWidth = mapRight - mapLeft;
  const mapHeight = mapBottom - mapTop;

  scaleFactor = 0.98 * min(mapWidth / dataWidth, mapHeight / dataHeight);

  const geoCenterX = (minX + maxX) / 2;
  const geoCenterY = (minY + maxY) / 2;

  mapCenterX = (mapLeft + mapRight) / 2;
  mapCenterY = (mapTop + mapBottom) / 2;

  offsetX = mapCenterX - geoCenterX * scaleFactor;
  offsetY = mapCenterY + geoCenterY * scaleFactor;
}

function buildTracts() {
  const features = geo?.features ?? [];
  tracts = [];

  for (const f of features) {
    const props = f.properties ?? {};
    const nameStr = props.name || props.NAME || props.Name;
    const tractId = canonicalTractIdFromGeoName(nameStr);
    if (tractId == null) continue;

    const ring = f.geometry?.coordinates?.[0] ?? [];
    const screenCoords = [];

    let sumX = 0, sumY = 0;
    for (const [x, y] of ring) {
      const [sx, sy] = project(x, y);
      screenCoords.push({ x: sx, y: sy });
      sumX += sx;
      sumY += sy;
    }

    const centroid = ring.length
      ? { x: sumX / ring.length, y: sumY / ring.length }
      : { x: 0, y: 0 };

    const valueByVar = {};
    for (const key of VARIABLE_KEYS) {
      const perYear = {};
      for (const y of YEARS) {
        perYear[y] = values?.[key]?.[y]?.[tractId] ?? null;
      }
      valueByVar[key] = perYear;
    }

    tracts.push({ tractId, props, screenCoords, centroid, values: valueByVar });
  }
}

function project(x, y) {
  const sx = x * scaleFactor + offsetX;
  const sy = -y * scaleFactor + offsetY;
  return [sx, sy];
}

function canonicalTractIdFromGeoName(nameStr) {
  if (!nameStr) return null;
  let s = String(nameStr).trim().replace(".", "");
  const n = int(s);
  return Number.isNaN(n) ? null : n;
}

function canonicalTractIdFromCSV(val) {
  if (val == null) return null;
  const s = String(val).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : int(n);
}

// ---------------------------
// Correlations
// ---------------------------

function pearsonCorrelation(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i];
    sumX += x; sumY += y;
    sumX2 += x * x; sumY2 += y * y;
    sumXY += x * y;
  }

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return null;

  return num / den;
}

function computeCorrelationForYear(year, variableKey) {
  const xs = [];
  const ys = [];

  for (const t of tracts) {
    const id = t.tractId;
    const pit = values?.pit_total?.[year]?.[id];
    const other = values?.[variableKey]?.[year]?.[id];
    if (pit == null || other == null) continue;
    xs.push(pit);
    ys.push(other);
  }

  if (xs.length < 3) return null;
  return pearsonCorrelation(xs, ys);
}

function computeCorrelationMatrix() {
  correlationMatrix = {};

  for (const y of YEARS) {
    correlationMatrix[y] = {};
    for (const key of VARIABLE_KEYS) {
      if (key === "pit_total") continue;
      correlationMatrix[y][key] = computeCorrelationForYear(y, key);
    }
  }
}

// Orange (-1) -> Blue (+1) ramp for correlation cells
function corrColor(r) {
  if (r == null || Number.isNaN(r)) return "transparent";
  r = constrain(r, -1, 1);
  const t = (r + 1) / 2;

  const a = { r: 37, g: 99, b: 235 };
  const b = { r: 249, g: 115, b: 22 };

  const rr = lerp(a.r, b.r, t);
  const gg = lerp(a.g, b.g, t);
  const bb = lerp(a.b, b.b, t);

  return `rgb(${Math.round(rr)},${Math.round(gg)},${Math.round(bb)})`;
}

function renderCorrelationMatrix() {
  if (!corrPanelDiv) return;

  const corrForYear = correlationMatrix?.[currentYear] ?? {};

  let rows = [];
  for (const key of VARIABLE_KEYS) {
    if (key === "pit_total") continue;
    const r = corrForYear[key];
    if (r == null || Number.isNaN(r)) continue;
    rows.push({ key, label: CONFIG.VARIABLES[key].label, r });
  }

  rows.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  rows = rows.slice(0, CONFIG.TOP_CORR_ROWS);

  if (corrContentContainer) corrContentContainer.remove();

  corrContentContainer = createDiv();
  corrContentContainer.parent(corrPanelDiv);

  const summary = createP("");
  summary.parent(corrContentContainer);
  setStyles(summary, { "font-size": "11px", color: "#9CA3AF", margin: "0 0 4px 0" });

  summary.elt.textContent = rows.length
    ? `Top ${rows.length} correlations between PIT total and ACS variables in ${currentYear}.`
    : `Not enough data to compute correlations for ${currentYear}.`;

  const table = createDiv();
  table.parent(corrContentContainer);
  setStyles(table, {
    border: "1px solid #1F2937",
    "border-radius": "8px",
    overflow: "hidden",
  });

  const headerRow = makeDiv(table, {
    display: "flex",
    background: "#020617",
    padding: "4px 6px",
    "font-size": "11px",
  });

  makeSpan("Variable", headerRow, { flex: "1", "font-weight": "600" });
  makeSpan(`r (PIT, ${currentYear})`, headerRow, {
    "min-width": "80px",
    "text-align": "right",
    "font-weight": "600",
  });

  for (const row of rows) {
    const rowDiv = makeDiv(table, {
      display: "flex",
      padding: "3px 6px",
      "font-size": "11px",
      "border-top": "1px solid #111827",
      background: row.key === currentVariableKey ? "rgba(255,255,255,0.06)" : "transparent",
    });

    makeSpan(row.label, rowDiv, { flex: "1", "white-space": "nowrap" });

    const rSpan = makeSpan(row.r.toFixed(2), rowDiv, {
      "min-width": "80px",
      "text-align": "right",
      background: corrColor(row.r),
      padding: "1px 4px",
      "border-radius": "4px",
      color: Math.abs(row.r) > 0.6 ? "#0B1120" : "#E5E7EB",
    });

    // keep rSpan referenced to avoid lint warnings in some editors
    void rSpan;
  }
}

// ---------------------------
// DOM updates
// ---------------------------

function updateLegendDOM() {
  if (!legendMinSpan) return;

  const maxVal = maxValue?.[currentVariableKey]?.[currentYear] ?? 1;

  legendMinSpan.elt.textContent = "0";
  legendMidSpan.elt.textContent = int(maxVal / 2);
  legendMaxSpan.elt.textContent = int(maxVal);
  legendTitleSpan.elt.textContent = CONFIG.VARIABLES[currentVariableKey].label;
}

function updateInfoDOM() {
  if (!infoYearSpan) return;

  const varLabel = CONFIG.VARIABLES[currentVariableKey].label;
  infoYearSpan.elt.textContent = `Year: ${currentYear}`;
  infoVarSpan.elt.textContent = `Variable: ${varLabel}`;

  if (!hoveredTract) {
    infoDetailSpan.elt.textContent = "Move mouse over a tract";
    return;
  }

  const t = hoveredTract;
  const v = t.values?.[currentVariableKey]?.[currentYear];
  const displayVal = v == null ? 0 : v;
  const label = t.props?.name || t.props?.NAME || t.tractId;

  infoDetailSpan.elt.textContent = `Tract: ${label} — Value: ${nf(displayVal, 0, 2)}`;
}

// ---------------------------
// Interaction
// ---------------------------

function mouseMoved() {
  hoveredTract = findHoveredTract(mouseX, mouseY);
}

function mousePressed() {
  if (isInMapBounds(mouseX, mouseY)) {
    isPanning = true;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }
}

function mouseDragged() {
  if (!isPanning) return;
  panX += mouseX - prevMouseX;
  panY += mouseY - prevMouseY;
  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

function mouseReleased() {
  isPanning = false;
}

function mouseWheel(event) {
  const factor = event.delta > 0 ? 0.9 : 1.1;
  zoomFactor = constrain(zoomFactor * factor, CONFIG.ZOOM.min, CONFIG.ZOOM.max);
  return false;
}

function keyPressed() {
  if (key === "0") resetView();
}

function isInMapBounds(mx, my) {
  return mx > mapLeft && mx < mapRight && my > mapTop && my < mapBottom;
}

function findHoveredTract(mx, my) {
  if (!isInMapBounds(mx, my)) return null;

  // Undo pan
  const sx = mx - panX;
  const sy = my - panY;

  // Undo zoom around center
  const mx0 = (sx - mapCenterX) / zoomFactor + mapCenterX;
  const my0 = (sy - mapCenterY) / zoomFactor + mapCenterY;

  let closest = null;
  let bestDist = 12 / zoomFactor;

  for (const region of tracts) {
    const dx = mx0 - region.centroid.x;
    const dy = my0 - region.centroid.y;
    const d = sqrt(dx * dx + dy * dy);

    if (d < bestDist) {
      bestDist = d;
      closest = region;
    }
  }
  return closest;
}
