# 📽️ PROYECTOR PRO v1

**Calculadora de Distancias para Proyectores Epson Pro**

Aplicación web gratuita y sin dependencias que calcula la distancia de proyección ideal según el lente, el ancho de pantalla y el modelo de proyector. Diseñada para crecer: agregar nuevos modelos Epson es tan simple como añadir una entrada al objeto `PROJECTORS` en `calculator.js`.

---

## ✨ Características

- 🔭 **Selector de modelo** — preparado para múltiples proyectores Epson Pro
- 🔍 **Lentes dinámicos** — la lista de lentes se actualiza automáticamente al cambiar el modelo
- 📐 **Conversión de unidades** — ingresa el ancho en metros, pies o pulgadas
- 📺 **Diagonal → Ancho** — calcula el ancho automáticamente desde la diagonal y la relación de aspecto (16:9, 4:3, 16:10)
- 📏 **Resultados en metros y pies** simultáneamente
- 🖼️ **Diagrama SVG** — representación visual de la distancia calculada
- 📱 **Responsive** — funciona en móvil y escritorio
- ⚡ **Sin dependencias** — solo HTML + CSS + JS puro

---

## 🚀 Cómo usar

1. Descarga o clona este repositorio.
2. Abre `index.html` en cualquier navegador moderno — no necesitas servidor.
3. **Selecciona el modelo** de proyector (ej. Epson Pro L1405U).
4. **Selecciona el lente** que vas a utilizar.
5. Ingresa el **ancho de pantalla** (o la diagonal + relación de aspecto para calcularlo automáticamente).
6. Haz clic en **"Calcular distancia"**.
7. Los resultados muestran la distancia mínima y máxima en metros y pies, y el diagrama se actualiza visualmente.

---

## 🔦 Modelos soportados

| Modelo | Estado |
|---|---|
| Epson Pro L1405U | ✅ Incluido |
| Más modelos... | 🔜 Próximamente |

---

## 🔬 Lentes — Epson Pro L1405U

| Modelo de lente | Tipo | Throw Ratio mín | Throw Ratio máx |
|---|---|---|---|
| ELPLM08 | Estándar    | 1.57 | 2.56 |
| ELPLX01 | Ultra Corto | 0.35 | 0.35 (fijo) |
| ELPLU03 | Corto       | 0.65 | 0.75 |
| ELPLM09 | Medio       | 1.44 | 2.32 |
| ELPLL08 | Largo       | 4.21 | 7.07 |

---

## 📐 Fórmula

```
Distancia = Throw Ratio × Ancho de pantalla
```

- **Distancia mínima** = Throw Ratio mínimo × Ancho
- **Distancia máxima** = Throw Ratio máximo × Ancho
- Los lentes de ratio fijo (ej. ELPLX01) tienen un único valor.

**Conversión diagonal → ancho:**

```
Ancho = Diagonal × (ratio_ancho / √(ratio_ancho² + ratio_alto²))
```

---

## 🗂️ Estructura del proyecto

```
proyector-pro/
├── index.html       ← App principal
├── styles.css       ← Estilos responsivos
├── calculator.js    ← Lógica y datos de proyectores
└── README.md        ← Esta documentación
```

---

## ➕ Agregar un nuevo modelo

En `calculator.js`, añade una entrada al objeto `PROJECTORS`:

```js
const PROJECTORS = {
  "L1405U": { /* ... */ },

  // Nuevo modelo:
  "L1500U": {
    name: "Epson Pro L1500U",
    lenses: [
      { model: "ELPLM15", name: "Estándar", min: 1.35, max: 2.20 },
      // ...
    ]
  }
};
```

El selector de modelo y la lista de lentes se actualizarán automáticamente.

---

## 📄 Licencia

MIT © xtmultimedia
