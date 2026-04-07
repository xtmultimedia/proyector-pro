/**
 * ProYector Pro — calculator.js
 * Lógica de cálculo de distancias de proyección para proyectores Epson Pro.
 * Arquitectura escalable: agregar nuevos modelos solo requiere una entrada en PROJECTORS.
 */

// ── Base de datos de proyectores y lentes ────────────────────────────────────
const PROJECTORS = {
  "L1405U": {
    name: "Epson Pro L1405U",
    lumens: 8000,  // Lúmenes ANSI del modelo
    lenses: [
      { model: "ELPLM08", name: "Estándar",    min: 1.57, max: 2.56 },
      { model: "ELPLX01", name: "Ultra Corto", min: 0.35, max: 0.35 },
      { model: "ELPLU03", name: "Corto",       min: 0.65, max: 0.75 },
      { model: "ELPLM09", name: "Medio",       min: 1.44, max: 2.32 },
      { model: "ELPLL08", name: "Largo",       min: 4.21, max: 7.07 },
    ]
  }
  // Aquí se agregarán más modelos en el futuro
};

// Relaciones de aspecto: proporción ancho/alto
const ASPECT_RATIOS = {
  "16:9":  16 / 9,
  "4:3":   4  / 3,
  "16:10": 16 / 10
};

// Dimensiones máximas del rectángulo de pantalla dentro del viewBox SVG (300×200)
const SVG_MAX_WIDTH  = 240;
const SVG_MAX_HEIGHT = 150;

// Factores de conversión de unidades
const METERS_TO_FEET = 0.3048;
const METERS_TO_INCHES = 0.0254;

// ── Conversiones de unidad ────────────────────────────────────────────────────

/** Convierte un valor de cualquier unidad a metros */
function toMeters(value, unit) {
  if (unit === "ft") return value * METERS_TO_FEET;
  if (unit === "in") return value * METERS_TO_INCHES;
  return value; // ya en metros
}

/** Formatea una distancia en metros con dos representaciones: m y ft */
function formatDistances(meters) {
  const ft = meters / METERS_TO_FEET;
  return `${meters.toFixed(2)} m  /  ${ft.toFixed(2)} ft`;
}

// ── Población dinámica de selectores ─────────────────────────────────────────

/** Puebla el selector de modelos con todos los proyectores disponibles */
function populateModels() {
  const modelSelect = document.getElementById("model");
  modelSelect.innerHTML = "";

  Object.entries(PROJECTORS).forEach(([key, projector]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = projector.name;
    modelSelect.appendChild(opt);
  });

  // Cargar lentes del primer modelo por defecto
  updateLenses();
}

/** Actualiza el selector de lentes según el modelo seleccionado */
function updateLenses() {
  const modelKey  = document.getElementById("model").value;
  const projector = PROJECTORS[modelKey];
  const lensSelect = document.getElementById("lens");

  lensSelect.innerHTML = "";

  projector.lenses.forEach((lens, index) => {
    const opt = document.createElement("option");
    opt.value = index;

    const ratioLabel = lens.min === lens.max
      ? `${lens.min}:1 (fijo)`
      : `${lens.min}–${lens.max}:1`;

    opt.textContent = `${lens.model} — ${lens.name} (${ratioLabel})`;
    lensSelect.appendChild(opt);
  });

  // Actualizar el input de lúmenes con el valor sugerido del modelo
  updateLumens(modelKey);
}

/** Actualiza el input de lúmenes con el valor sugerido según el modelo */
function updateLumens(modelKey) {
  const lumens = PROJECTORS[modelKey].lumens;
  document.getElementById('lumens').value = lumens;
}

// ── Funciones de pantalla y luminancia ───────────────────────────────────────

/** Calcula el alto de pantalla según la relación de aspecto y el ancho en metros */
function getScreenHeight(widthMeters, aspectRatio) {
  const ratios = { "16:9": 9/16, "4:3": 3/4, "16:10": 10/16 };
  return widthMeters * (ratios[aspectRatio] || 9/16);
}

/** Calcula la luminancia en nits: lúmenes dividido entre el área de pantalla */
function calculateNits(lumens, widthM, heightM) {
  const area = widthM * heightM;
  return area > 0 ? lumens / area : 0;
}

/** Devuelve el nivel de brillo con color y texto descriptivo según los nits */
function getBrightnessLevel(nits) {
  if (nits >= 500) return { color: "#22c55e", label: "🟢 Excelente — apto para sala con luz ambiente" };
  if (nits >= 200) return { color: "#eab308", label: "🟡 Bueno — sala semi-controlada" };
  if (nits >= 100) return { color: "#f97316", label: "🟠 Aceptable — sala oscura recomendada" };
  return               { color: "#ef4444", label: "🔴 Bajo — requiere sala completamente oscura" };
}

// ── Cálculo por diagonal ──────────────────────────────────────────────────────

/**
 * Cuando el usuario ingresa una diagonal, calcula el ancho automáticamente
 * y lo pone en el campo de ancho de pantalla.
 */
function calcWidthFromDiagonal() {
  const diagVal  = parseFloat(document.getElementById("diagonal").value);
  const diagUnit = document.getElementById("diag-unit").value;
  const aspect   = document.getElementById("aspect").value;
  const widthUnit = document.getElementById("unit").value;

  if (isNaN(diagVal) || diagVal <= 0) return;

  // Convertir diagonal a metros
  const diagM = toMeters(diagVal, diagUnit);

  // Calcular ancho: ancho = diagonal * cos(atan(1/ratio)) = diagonal / sqrt(1 + (1/ratio)^2)
  const ratio = ASPECT_RATIOS[aspect];
  const widthM = diagM * ratio / Math.sqrt(ratio * ratio + 1);

  // Convertir ancho al sistema de unidades del campo de ancho
  let displayWidth;
  if (widthUnit === "ft") {
    displayWidth = (widthM / METERS_TO_FEET).toFixed(3);
  } else if (widthUnit === "in") {
    displayWidth = (widthM / METERS_TO_INCHES).toFixed(2);
  } else {
    displayWidth = widthM.toFixed(3);
  }

  document.getElementById("width").value = displayWidth;
}

// ── Diagrama SVG ──────────────────────────────────────────────────────────────

/** Actualiza el diagrama SVG con la distancia calculada */
function updateDiagram(minDist, maxDist, isFixed) {
  const wrap = document.getElementById("diagram-wrap");
  wrap.style.display = "block";

  const distLabel = isFixed
    ? `${minDist.toFixed(2)} m`
    : `${minDist.toFixed(2)} m – ${maxDist.toFixed(2)} m`;

  document.getElementById("svg-dist-label").textContent = distLabel;
}

// ── Función principal de cálculo ──────────────────────────────────────────────

function calculate() {
  // Leer valores
  const modelKey   = document.getElementById("model").value;
  const lensIndex  = parseInt(document.getElementById("lens").value, 10);
  const widthRaw   = parseFloat(document.getElementById("width").value);
  const widthUnit  = document.getElementById("unit").value;
  const lumens     = parseFloat(document.getElementById("lumens").value) || 0;
  const aspectRatio = document.getElementById("aspect").value;

  // Validación
  if (isNaN(widthRaw) || widthRaw <= 0) {
    alert("Por favor ingresa un ancho de pantalla válido y mayor a cero.");
    return;
  }

  const lens    = PROJECTORS[modelKey].lenses[lensIndex];
  const widthM  = toMeters(widthRaw, widthUnit);
  const heightM = getScreenHeight(widthM, aspectRatio);
  const minDist = lens.min * widthM;
  const maxDist = lens.max * widthM;
  const isFixed = lens.min === lens.max;

  // Mostrar resultados de distancia
  const resultDiv = document.getElementById("result");
  resultDiv.style.display = "block";

  const resMin  = document.getElementById("res-min");
  const resMax  = document.getElementById("res-max");
  const resNote = document.getElementById("res-note");

  if (isFixed) {
    resMin.innerHTML  = `<span class="result-label">Distancia fija</span><span class="result-value">${formatDistances(minDist)}</span>`;
    resMax.style.display = "none";
  } else {
    resMin.innerHTML  = `<span class="result-label">🔹 Distancia mínima</span><span class="result-value">${formatDistances(minDist)}</span>`;
    resMax.innerHTML  = `<span class="result-label">🔸 Distancia máxima</span><span class="result-value">${formatDistances(maxDist)}</span>`;
    resMax.style.display = "flex";
  }

  resNote.textContent =
    `Pantalla: ${widthRaw} ${widthUnit} de ancho · Lente: ${lens.model} (${lens.min}${isFixed ? "" : "–" + lens.max}:1)`;

  // Actualizar diagrama de distancia
  updateDiagram(minDist, maxDist, isFixed);

  // Actualizar gráfico de pantalla
  updateScreenDiagram(widthM, heightM);

  // Calcular y mostrar luminancia
  const nits = calculateNits(lumens, widthM, heightM);
  updateNitsResult(nits, lumens, widthM * heightM);
}

// ── Actualización del gráfico de pantalla ─────────────────────────────────────

/** Actualiza el SVG proporcional de pantalla con sus dimensiones en metros y pies */
function updateScreenDiagram(widthM, heightM) {
  const rect    = document.getElementById('screenRect');
  const diagram = document.getElementById('screenDiagram');
  const stats   = document.getElementById('screenStats');

  // Calcular proporciones dentro del viewBox (300×200)
  const aspect = widthM / heightM;
  let svgW, svgH;
  if (aspect >= SVG_MAX_WIDTH / SVG_MAX_HEIGHT) {
    svgW = SVG_MAX_WIDTH; svgH = SVG_MAX_WIDTH / aspect;
  } else {
    svgH = SVG_MAX_HEIGHT; svgW = SVG_MAX_HEIGHT * aspect;
  }
  const x = (300 - svgW) / 2;
  const y = (170 - svgH) / 2;

  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('width', svgW);
  rect.setAttribute('height', svgH);

  // Etiquetas de dimensiones
  document.getElementById('widthLabel').textContent =
    widthM.toFixed(2) + ' m  (' + (widthM / METERS_TO_FEET).toFixed(1) + ' ft)';
  document.getElementById('heightLabel').textContent =
    heightM.toFixed(2) + ' m  (' + (heightM / METERS_TO_FEET).toFixed(1) + ' ft)';

  const area = (widthM * heightM).toFixed(2);
  stats.innerHTML = `
    <span>Ancho: <strong>${widthM.toFixed(2)} m</strong></span>
    <span>Alto: <strong>${heightM.toFixed(2)} m</strong></span>
    <span>Área: <strong>${area} m²</strong></span>
  `;

  diagram.style.display = 'block';
}

/** Actualiza el panel de luminancia con el valor en nits y su nivel de calidad */
function updateNitsResult(nits, lumens, area) {
  const level = getBrightnessLevel(nits);
  const container = document.getElementById('nitsResult');
  const valueEl = document.getElementById('nitsValue');
  const levelEl = document.getElementById('nitsLevel');

  valueEl.innerHTML =
    `<span class="nits-number" style="color:${level.color}">${Math.round(nits)} nits</span>` +
    `<span class="nits-unit"> (cd/m²)</span>`;
  levelEl.innerHTML =
    `<span style="color:${level.color}">${level.label}</span>`;
  container.style.display = 'block';
}

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  populateModels();
});
