/* ============================================================
   El éxodo judío desde Alemania · 1933–1939
   Scrollytelling con D3.js + GSAP ScrollTrigger
   ----------------------------------------------------------   Para AGREGAR o QUITAR destinos: editá CSV_REFUGIADOS más abajo
   (columnas: Destino, ISO3, Refugiados). Opcionalmente añadí
   un texto histórico en el diccionario NOTAS de abajo.

   Todo el archivo está envuelto en un IIFE para no filtrar
   variables globales: este script convive con el JS del sitio
   principal cuando el mapa va incrustado dentro de esa página.
   ============================================================ */
(function () {

gsap.registerPlugin(ScrollTrigger);

/* ---------- Configuración ---------- */
const CONFIG = {
  origenISO3: "DEU",                  // Alemania
  anchoLinea: [0.8, 9],               // grosor mínimo / máximo (px)
  duracionRuta: 1500,                 // ms de la animación de cada ruta
  zoomMaximo: 6,                      // tope de escala al hacer zoom regional
};

/* Destinos "cercanos" (Europa) a los que, al llegar su paso, se les hace
   zoom para que se vean separados en vez de amontonados sobre Alemania. */
const EUROPA_CERCANA = new Set(["FRA", "BEL", "NLD", "CHE", "CZE", "ITA", "GBR", "SWE"]);

/* Datos de refugiados por destino. Editá esta tabla directamente
   (mismas columnas que antes: Destino, ISO3, Refugiados).
   Va incrustada acá -en vez de en data/refugiados.csv- para que el mapa
   funcione al abrir el archivo directo, sin necesitar un servidor local. */
const CSV_REFUGIADOS = `Destino,ISO3,Refugiados
Estados Unidos,USA,102000
Palestina (Mandato británico),ISR,60000
Reino Unido,GBR,50000
Francia,FRA,30000
Argentina,ARG,40000
Brasil,BRA,25000
Países Bajos,NLD,30000
Bélgica,BEL,12000
Suiza,CHE,10000
Checoslovaquia,CZE,5000
Sudáfrica,ZAF,6000
Shanghái (China),CHN,18000
Australia,AUS,9000
Italia,ITA,5000
Suecia,SWE,3000
`;

const NOTAS = {
  USA: "El principal destino soñado. El sistema de cuotas —vigente desde 1924— nunca se adaptó a la crisis: exigía trámites consulares estrictos y no se pensó para resolver una emergencia humanitaria. En junio de 1941 EE.UU. cerró sus representaciones diplomáticas en Alemania y la Europa ocupada, y el ataque a Pearl Harbor paralizó la navegación transatlántica.",
  ISR: "Bajo el Mandato británico de Palestina, fue uno de los principales destinos entre 1933 y 1937, en gran parte a través del Acuerdo de Haavara y la Aliá, hasta que las autoridades británicas limitaron la admisión.",
  GBR: "El Reino Unido admitió solo a un puñado de refugiados adultos, pero sí permitió el rescate infantil del Kindertransport: casi 10.000 niños llegaron tras la Noche de los Cristales Rotos (1938).",
  FRA: "Francia fue refugio temprano y punto de tránsito hacia otros continentes, aunque muchos quedaron atrapados tras 1940.",
  ARG: "Argentina concentró la mayor comunidad de refugiados en América Latina, pese a políticas migratorias cada vez más restrictivas.",
  BRA: "Brasil recibió a miles de refugiados a pesar de las crecientes limitaciones a la entrada de judíos.",
  NLD: "Los Países Bajos, país vecino neutral, admitieron refugiados con cuentagotas y los orientaban hacia terceros países; aun así, casi 2.000 niños hallaron techo allí, entre ellos la familia de Ana Frank.",
  BEL: "Bélgica, país vecino, acogió a miles de personas que cruzaban la frontera occidental de Alemania.",
  CHE: "Suiza sirvió de refugio y de tránsito, aunque endureció sus controles fronterizos con el paso de los años.",
  CZE: "Checoslovaquia fue destino inmediato hasta que su propia anexión, en 1938–1939, volvió a poner en fuga a los refugiados.",
  ZAF: "Sudáfrica fue uno de los principales destinos entre 1933 y 1937, antes de restringir la admisión de refugiados judíos.",
  CHN: "Shanghái fue uno de los pocos puertos del mundo que no exigía visado, convirtiéndose en refugio de última instancia.",
  AUS: "Australia, en la lejana ruta del Pacífico, admitió a miles de refugiados en los años previos a la guerra.",
  ITA: "Italia funcionó como refugio y vía de tránsito mediterránea hasta el endurecimiento de sus leyes raciales en 1938.",
  SWE: "Suecia, neutral, ofreció asilo a un número menor pero significativo de refugiados en el norte de Europa.",
};

/* ---------- Utilidades ---------- */
const fmt = d3.format(",");// separador de miles

// Tabla ISO3 → id numérico y su inverso (se rellenan al cargar)
let ISO3_A_NUM = {};
let NUM_A_ISO3 = {};

// Devuelve el código ISO3 de una feature del mapa (TopoJSON usa id numérico)
function iso3De(feature) {
  return NUM_A_ISO3[String(parseInt(feature.id, 10))] || null;
}

/* ---------- Estado del mapa ---------- */
const svgEl = document.getElementById("map");
let svg, g, path, projection;
let rutas = [];          // { iso3, feature, pathEl, labelEl, dotEl, largo }
let dibujadas = new Set();
let zoomEuropa = null;   // { k, x, y }: transform que encuadra la Europa cercana
let zoomActivo = false;  // evita retransicionar si ya estamos en el mismo estado
let totalLabelEl = null; // etiqueta del total de refugiados, sobre Alemania

/* ============================================================
   Arranque: los datos ya están incrustados (sin fetch), así que
   el mapa funciona igual con doble clic, Live Server o GitHub Pages.
   ============================================================ */
(function arrancar() {
  const atlas = window.EXODO_WORLD_ATLAS;
  if (!atlas) {
    console.error("Faltan los datos del mapa mundial (data/world-atlas.js).");
    document.getElementById("map").insertAdjacentHTML("afterend",
      '<p style="color:#e88;padding:1rem">No se encontraron los datos del mapa. ' +
      'Verificá que <code>data/world-atlas.js</code> esté cargado antes de <code>main.js</code>.</p>');
    return;
  }

  ISO3_A_NUM = atlas.isoMap;
  NUM_A_ISO3 = Object.fromEntries(Object.entries(atlas.isoMap).map(([k, v]) => [v, k]));

  // TopoJSON → GeoJSON
  const geo = topojson.feature(atlas.topo, atlas.topo.objects.countries);

  // CSV incrustado → filas de datos
  const datos = d3.csvParse(CSV_REFUGIADOS, d => ({
    destino: d.Destino,
    iso3: d.ISO3,
    refugiados: +d.Refugiados,
  }));

  // Orden descendente por cantidad → narrativa de mayor a menor
  datos.sort((a, b) => b.refugiados - a.refugiados);
  iniciar(geo, datos);
})();

/* ============================================================
   Inicialización del mapa y la narrativa
   ============================================================ */
function iniciar(geo, datos) {
  const features = geo.features;
  const width = svgEl.clientWidth;
  const height = svgEl.clientHeight;

  // Proyección ajustada al mundo
  projection = d3.geoNaturalEarth1();
  path = d3.geoPath(projection);

  svg = d3.select(svgEl).attr("viewBox", `0 0 ${width} ${height}`);
  g = svg.append("g").attr("transform", "translate(0,0) scale(1)");

  // Ajustar proyección al contenedor (con un pequeño margen)
  const sphere = { type: "Sphere" };
  projection.fitExtent([[10, 10], [width - 10, height - 10]], sphere);

  // --- Capa de países ---
  const origenFeature = features.find(f => iso3De(f) === CONFIG.origenISO3);

  g.append("g").attr("class", "countries")
    .selectAll("path")
    .data(features)
    .join("path")
    .attr("d", path)
    .attr("class", f => {
      const iso = iso3De(f);
      if (iso === CONFIG.origenISO3) return "country country--origin";
      if (datos.some(d => d.iso3 === iso)) return "country country--dest";
      return "country";
    })
    .attr("data-iso3", f => iso3De(f));

  // --- Origen: Alemania destacada + etiqueta ---
  const origen = path.centroid(origenFeature);
  g.append("circle")
    .attr("class", "origin-pulse")
    .attr("cx", origen[0]).attr("cy", origen[1]).attr("r", 3.5)
    .attr("fill", "#5a0d0f");
  g.append("text")
    .attr("class", "origin-label")
    .attr("x", origen[0]).attr("y", origen[1] - 8)
    .attr("text-anchor", "middle")
    .text("Alemania");

  // Total de refugiados: visible en la intro y en el paso final, se oculta
  // mientras se recorre destino por destino (ahí manda mostrarSoloEtiqueta).
  const totalRefugiados = d3.sum(datos, d => d.refugiados);
  totalLabelEl = g.append("text")
    .attr("class", "origin-total")
    .attr("x", origen[0]).attr("y", origen[1] + 22)
    .attr("text-anchor", "middle")
    .text(`${fmt(totalRefugiados)} personas se fueron`)
    .node();

  // --- Capas de rutas y etiquetas ---
  const capaRutas = g.append("g").attr("class", "rutas");
  const capaLabels = g.append("g").attr("class", "labels");

  // Escala de grosor proporcional a la cantidad de refugiados
  const maxRef = d3.max(datos, d => d.refugiados);
  const escalaAncho = d3.scaleLinear()
    .domain([0, maxRef])
    .range(CONFIG.anchoLinea);

  // --- Construir cada ruta ---
  const puntosEuropa = [origen]; // Alemania siempre entra en el encuadre regional

  datos.forEach((d, i) => {
    const feature = features.find(f => iso3De(f) === d.iso3);
    if (!feature) {
      console.warn("No se encontró geometría para ISO3:", d.iso3, d.destino);
      return;
    }
    const destino = path.centroid(feature);
    if (EUROPA_CERCANA.has(d.iso3)) puntosEuropa.push(destino);
    const dCurva = arco(origen, destino);

    const pathEl = capaRutas.append("path")
      .attr("class", "route")
      .attr("d", dCurva)
      .attr("stroke", "#5a0d0f")
      .attr("stroke-width", escalaAncho(d.refugiados))
      .node();

    const largo = pathEl.getTotalLength();
    // Estado inicial: oculta (línea sin dibujar)
    pathEl.style.strokeDasharray = largo;
    pathEl.style.strokeDashoffset = largo;

    // Punto y etiqueta en el destino
    const dot = capaLabels.append("circle")
      .attr("class", "dest-dot")
      .attr("cx", destino[0]).attr("cy", destino[1]).attr("r", 3)
      .node();

    const alaDerecha = destino[0] >= origen[0];
    const label = capaLabels.append("text")
      .attr("class", "route-label")
      .attr("x", destino[0] + (alaDerecha ? 8 : -8))
      .attr("y", destino[1] + 4)
      .attr("text-anchor", alaDerecha ? "start" : "end");
    label.append("tspan").text(d.destino);
    label.append("tspan")
      .attr("class", "route-label__count")
      .attr("x", destino[0] + (alaDerecha ? 8 : -8))
      .attr("dy", "1.2em")
      .text(fmt(d.refugiados) + " refugiados");

    rutas.push({
      iso3: d.iso3,
      datos: d,
      pathEl,
      labelEl: label.node(),
      dotEl: dot,
      countryEl: g.select(`path[data-iso3="${d.iso3}"]`).node(),
      largo,
    });
  });

  // Transform (escala + traslado) que encuadra a Alemania y sus vecinos europeos
  zoomEuropa = calcularTransformZoom(calcularBBox(puntosEuropa), width, height);

  construirNarrativa(datos);
  configurarScroll();
}

/* ============================================================
   Zoom regional: encuadra Alemania + destinos europeos cercanos
   ============================================================ */
function calcularBBox(puntos) {
  const xs = puntos.map(p => p[0]);
  const ys = puntos.map(p => p[1]);
  return {
    x0: Math.min(...xs), x1: Math.max(...xs),
    y0: Math.min(...ys), y1: Math.max(...ys),
  };
}

function calcularTransformZoom(bbox, width, height) {
  const pad = 100; // aire alrededor de la región, en px de pantalla
  const anchoRegion = Math.max(bbox.x1 - bbox.x0, 1) + pad * 2;
  const altoRegion = Math.max(bbox.y1 - bbox.y0, 1) + pad * 2;
  const cx = (bbox.x0 + bbox.x1) / 2;
  const cy = (bbox.y0 + bbox.y1) / 2;
  const k = Math.min(width / anchoRegion, height / altoRegion, CONFIG.zoomMaximo);
  return { k, x: width / 2 - k * cx, y: height / 2 - k * cy };
}

/* Aplica (o quita) el zoom regional según el destino activo */
function actualizarZoom(idx) {
  const destinoActivo = idx >= 0 && idx < rutas.length ? rutas[idx] : null;
  const debeEstarZoomeado = !!(destinoActivo && EUROPA_CERCANA.has(destinoActivo.iso3));

  if (debeEstarZoomeado === zoomActivo) return;
  zoomActivo = debeEstarZoomeado;

  const transform = debeEstarZoomeado && zoomEuropa
    ? `translate(${zoomEuropa.x},${zoomEuropa.y}) scale(${zoomEuropa.k})`
    : "translate(0,0) scale(1)";

  g.transition().duration(900).ease(d3.easeCubicInOut).attr("transform", transform);
}

/* ============================================================
   Geometría del arco (curva entre origen y destino)
   ============================================================ */
function arco([x0, y0], [x1, y1]) {
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  // Punto medio desplazado perpendicularmente para formar el arco
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const curva = 0.18;               // intensidad del arco
  const nx = -dy / dist, ny = dx / dist;
  const cx = mx + nx * dist * curva;
  const cy = my + ny * dist * curva;
  return `M${x0},${y0} Q${cx},${cy} ${x1},${y1}`;
}

/* ============================================================
   Animación de una ruta
   ============================================================ */
function dibujarRuta(idx) {
  const r = rutas[idx];
  if (!r || dibujadas.has(idx)) return;
  dibujadas.add(idx);

  r.countryEl && r.countryEl.classList.add("is-lit");

  gsap.to(r.pathEl, {
    strokeDashoffset: 0,
    duration: CONFIG.duracionRuta / 1000,
    ease: "power2.inOut",
    onComplete: () => {
         // Al terminar de dibujarse → aparece el punto (el nombre lo maneja mostrarSoloEtiqueta)
      r.dotEl.classList.add("is-visible");
    },
  });
}

/* Muestra únicamente la etiqueta (nombre + cifra) del destino activo y
   oculta el resto, para que no se acumulen todos los nombres a la vez. */
function mostrarSoloEtiqueta(idx) {
  rutas.forEach((r, i) => {
    r.labelEl.classList.toggle("is-visible", i === idx);
  });
}

/* Atenúa todas las rutas ya dibujadas menos la del destino activo,
   para que se distinga cuál es la línea "actual" entre las anteriores. */
function resaltarRutaActiva(idx) {
  rutas.forEach((r, i) => {
    const atenuar = dibujadas.has(i) && i !== idx;
    r.pathEl.classList.toggle("is-dimmed", atenuar);
    r.dotEl.classList.toggle("is-dimmed", atenuar);
  });
}

function ocultarRuta(idx) {
  const r = rutas[idx];
  if (!r || !dibujadas.has(idx)) return;
  dibujadas.delete(idx);
  gsap.killTweensOf(r.pathEl);
  r.pathEl.style.strokeDashoffset = r.largo;
  r.labelEl.classList.remove("is-visible");
  r.dotEl.classList.remove("is-visible");
  r.pathEl.classList.remove("is-dimmed");
  r.dotEl.classList.remove("is-dimmed");
  r.countryEl && r.countryEl.classList.remove("is-lit");
}

/* ============================================================
   Narrativa: se genera a partir de los datos
   ============================================================ */
function construirNarrativa(datos) {
  const cont = document.getElementById("narrative");
  const total = d3.sum(datos, d => d.refugiados);

  // Paso de introducción: ya muestra el total antes de abrir cada destino
  cont.appendChild(crearPaso({
    clase: "exodo-step--intro",
    idx: -1,
    titulo: "Alemania, 1933",
    subtitulo: "El punto de partida",
    total,
    texto: "Con el ascenso del nazismo, la vida de la población judía en Alemania se vuelve insostenible. Comienza una huida masiva. Seguí desplazándote para descubrir hacia dónde se fueron.",
  }));

  // Un paso por destino
  datos.forEach((d, i) => {
    cont.appendChild(crearPaso({
      idx: i,
      titulo: d.destino,
      conteo: d.refugiados,
      texto: NOTAS[d.iso3] || "Uno de los destinos del éxodo judío desde Alemania.",
    }));
  });

  // Paso final
  cont.appendChild(crearPaso({
    clase: "exodo-step--final",
    idx: datos.length,
    titulo: "El mapa completo",
    subtitulo: "Un éxodo global",
    texto: "Todas las rutas juntas revelan la dimensión del éxodo: cientos de miles de personas dispersas por cuatro continentes en apenas seis años.",
    total,
  }));
}

function crearPaso({ clase = "", idx, titulo, subtitulo, conteo, total, texto }) {
  const step = document.createElement("section");
  step.className = "exodo-step " + clase;
  step.dataset.idx = idx;

  let html = '<div class="exodo-step__card">';
  html += `<h2 class="exodo-step__country">${titulo}</h2>`;
  if (subtitulo) html += `<p class="exodo-step__count">${subtitulo}</p>`;
  if (conteo != null) html += `<p class="exodo-step__count"><span class="num">${fmt(conteo)}</span> refugiados</p>`;
  if (total != null) html += `<p class="exodo-step__count">≈ <span class="num">${fmt(total)}</span> personas en total</p>`;
  html += `<p class="exodo-step__text">${texto}</p>`;
  html += "</div>";
  step.innerHTML = html;
  return step;
}

/* ============================================================
   Sincronización con el scroll (GSAP ScrollTrigger)
   ============================================================ */
function configurarScroll() {
  const steps = gsap.utils.toArray(".exodo-step");

  steps.forEach(step => {
    const idx = +step.dataset.idx;

    ScrollTrigger.create({
      trigger: step,
      start: "top center",
      end: "bottom center",
      onToggle: self => step.classList.toggle("is-active", self.isActive),
      onEnter: () => activarPaso(idx),
      onEnterBack: () => activarPaso(idx),
    });
  });

  // Recalcular al redimensionar la ventana
  window.addEventListener("resize", () => ScrollTrigger.refresh());
}

/* Determina qué rutas deben estar visibles según el paso activo */
function activarPaso(idx) {
  actualizarZoom(idx);

  // El total sobre Alemania se ve en la intro y en el cierre; mientras se
  // recorre destino por destino, cede el lugar al nombre de cada país.
  totalLabelEl.classList.toggle("is-visible", idx < 0 || idx >= rutas.length);

  if (idx < 0) {
    // Introducción: sólo Alemania → ocultar todas las rutas
    rutas.forEach((_, i) => ocultarRuta(i));
    mostrarSoloEtiqueta(-1);
    return;
  }
  if (idx >= rutas.length) {
    // Paso final: mostrar TODAS las rutas y sus nombres simultáneamente, sin atenuar ninguna
    rutas.forEach((_, i) => dibujarRuta(i));
    rutas.forEach(r => {
      r.labelEl.classList.add("is-visible");
      r.pathEl.classList.remove("is-dimmed");
      r.dotEl.classList.remove("is-dimmed");
    });
    return;
  }
  // Paso de destino: dibujar acumulativamente hasta este índice,
  // pero mostrar solo el nombre del destino actual (los anteriores se ocultan)
  // y atenuar las líneas anteriores para que predomine la actual
  rutas.forEach((_, i) => {
    if (i <= idx) dibujarRuta(i);
    else ocultarRuta(i);
  });
  mostrarSoloEtiqueta(idx);
  resaltarRutaActiva(idx);
}

})();
