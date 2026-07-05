# El éxodo judío desde Alemania · 1933–1939

Visualización narrativa (*scrollytelling*) del éxodo de refugiados judíos desde
Alemania entre 1933 y 1939, construida con **D3.js** (mapa y rutas) y
**GSAP ScrollTrigger** (sincronización con el scroll).

## Cómo funciona la narrativa

- Al comenzar solo se ve **Alemania** destacada en color cálido (ámbar).
- A medida que haces scroll, cada sección de texto va **dibujando** una ruta
  desde Alemania hacia el país de destino (animación de trazo, no aparición
  instantánea).
- El **grosor** de cada línea es proporcional al número de refugiados.
- Cuando una ruta termina de dibujarse, aparecen el **nombre del país** y la
  **cantidad de refugiados**.
- El mapa permanece **fijo (sticky)** mientras el texto avanza al costado.
- Al final del recorrido se ven **todas las rutas simultáneamente**.

## Estructura

```
exodo-refugiados/
├── index.html        # Estructura de la página
├── styles.css        # Estilo minimalista y oscuro
├── main.js           # Mapa, rutas, animaciones con scroll y DATOS EDITABLES (CSV_REFUGIADOS)
├── data/
│   ├── world-atlas.js        # Mapa mundial + tabla ISO3, incrustado como JS (se carga con <script>)
│   ├── refugiados.csv        # Copia de referencia de los datos (ya no se lee en runtime)
│   ├── countries-110m.json   # Fuente original del mapa mundial (TopoJSON, World Atlas)
│   └── iso3-to-numeric.json  # Fuente original de la tabla ISO3 → código numérico
└── lib/              # Librerías vendorizadas (funciona sin conexión)
    ├── d3.min.js
    ├── topojson-client.min.js
    ├── gsap.min.js
    └── ScrollTrigger.min.js
```

## Cómo ejecutarlo

Los datos están incrustados directamente en el JS (no se usa `fetch`), así
que el mapa funciona igual abriendo `index.html` con doble clic, con Live
Server o publicado en GitHub Pages. No hace falta servidor local.

## Cómo agregar o quitar destinos

1. Editá la constante **`CSV_REFUGIADOS`** al inicio de `main.js` (mismas
   columnas de siempre: `Destino,ISO3,Refugiados`). Usá el código **ISO3**
   del país (p. ej. `USA`, `FRA`, `ARG`). El mapa y las rutas se generan
   automáticamente y el grosor se reescala solo.
2. *(Opcional)* Añadí un texto histórico para ese país en el diccionario
   `NOTAS` dentro de `main.js`, usando su ISO3 como clave.
3. *(Opcional)* Si además querés mantener actualizado `data/refugiados.csv`
   como referencia legible, reflejá ahí el mismo cambio — ese archivo ya no
   se lee en tiempo de ejecución.

No hace falta tocar nada más: los pasos de la narrativa se construyen a partir
de `CSV_REFUGIADOS`.

## Si necesitás regenerar `data/world-atlas.js`

Ese archivo es simplemente `countries-110m.json` e `iso3-to-numeric.json`
combinados en un objeto `window.EXODO_WORLD_ATLAS`, para poder cargarlos con
un `<script>` en vez de `fetch`. Si alguna vez reemplazás el mapa mundial,
regenéralo con Node:

```js
const fs = require("fs");
const topo = JSON.parse(fs.readFileSync("data/countries-110m.json", "utf8"));
const isoMap = JSON.parse(fs.readFileSync("data/iso3-to-numeric.json", "utf8"));
fs.writeFileSync("data/world-atlas.js",
  `window.EXODO_WORLD_ATLAS = { topo: ${JSON.stringify(topo)}, isoMap: ${JSON.stringify(isoMap)} };\n`);
```

## Personalización rápida

- **Colores**: variables CSS en `:root` dentro de `styles.css`
  (`--origin` para Alemania, `--route` para las rutas, fondo, etc.).
- **Velocidad de dibujo** de las rutas: `CONFIG.duracionRuta` en `main.js`.
- **Grosor mínimo/máximo** de línea: `CONFIG.anchoLinea` en `main.js`.

## Nota sobre los datos

Las cantidades son **estimaciones históricas** del período 1933–1939 y buscan
transmitir la escala y la distribución del éxodo, no cifras oficiales exactas.
