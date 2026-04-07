/**
 * ProYector Pro — calculator.js
 * Lógica de cálculo de distancias de proyección para proyectores Epson Pro.
 * Arquitectura escalable: agregar nuevos modelos solo requiere una entrada en PROJECTORS.
 */

// ── Base de datos de proyectores y lentes ────────────────────────────────────
const PROJECTORS = {
  "L1405U": {
    name: "Epson Pro L1405U",
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

// ── Conversiones de unidad ────────────────────────────────────────────────────

/** Convierte un valor de cualquier unidad a metros */
function toMeters(value, unit) {
  if (unit === "ft") return value * 0.3048;
  if (unit === "in") return value * 0.0254;
  return value; // ya en metros
}

/** Formatea una distancia en metros con dos representaciones: m y ft */
function formatDistances(meters) {
  const ft = meters / 0.3048;
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
    displayWidth = (widthM / 0.3048).toFixed(3);
  } else if (widthUnit === "in") {
    displayWidth = (widthM / 0.0254).toFixed(2);
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

  // Validación
  if (isNaN(widthRaw) || widthRaw <= 0) {
    alert("Por favor ingresa un ancho de pantalla válido y mayor a cero.");
    return;
  }

  const lens    = PROJECTORS[modelKey].lenses[lensIndex];
  const widthM  = toMeters(widthRaw, widthUnit);
  const minDist = lens.min * widthM;
  const maxDist = lens.max * widthM;
  const isFixed = lens.min === lens.max;

  // Mostrar resultados
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

  // Actualizar diagrama
  updateDiagram(minDist, maxDist, isFixed);
}

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  populateModels();
});
