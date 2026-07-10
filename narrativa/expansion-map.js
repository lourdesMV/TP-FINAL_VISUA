(() => {
  const section = document.getElementById("expansion-nazi");
  const svgElement = document.getElementById("expansion-map");
  const data = window.EXPANSION_NAZI_DATA;

  if (!section || !svgElement || !Array.isArray(data) || !window.d3 || !window.topojson) {
    console.warn("El mapa de expansión no pudo iniciarse: faltan el HTML, los datos, D3 o TopoJSON.");
    return;
  }

  const YEARS = [1938, 1939, 1940, 1941, 1942];

  /*
    El atlas utiliza códigos numéricos ISO 3166-1.
    Los Estados históricos se aproximan con fronteras actuales:
    - Checoslovaquia -> Chequia + Eslovaquia
    - Yugoslavia -> Estados sucesores
  */
  const ISO3_TO_NUMERIC = {
    DEU: ["276"],
    AUT: ["040"],
    CZE: ["203", "703"],
    POL: ["616"],
    DNK: ["208"],
    NOR: ["578"],
    NLD: ["528"],
    BEL: ["056"],
    LUX: ["442"],
    FRA: ["250"],
    YUG: ["688", "191", "070", "705", "807", "499"],
    GRC: ["300"],
    EST: ["233"],
    LVA: ["428"],
    LTU: ["440"],
    BLR: ["112"],
    UKR: ["804"]
  };

  const YEAR_CAPTIONS = {
    1938: "La expansión territorial comenzó con la anexión de Austria.",
    1939: "La ocupación de Checoslovaquia y la invasión de Polonia llevaron la expansión hacia el este.",
    1940: "En pocos meses, Alemania ocupó gran parte de Europa occidental.",
    1941: "La ofensiva alcanzó los Balcanes, el Báltico y amplias regiones soviéticas.",
    1942: "El dominio nazi alcanzó su máxima extensión territorial en Europa."
  };

  const svg = d3.select(svgElement);
  const tooltip = document.getElementById("expansion-map-tooltip");
  const yearLabel = document.getElementById("expansion-map-year");
  const caption = document.getElementById("expansion-map-caption");
  const steps = Array.from(section.querySelectorAll(".expansion-step"));

  let countries;
  let paths;
  let currentYear = 1938;

  const activeRecordByCountry = (year) => {
    const grouped = d3.group(
      data
        .filter(d => d.year <= year)
        .sort((a, b) => d3.ascending(a.order, b.order)),
      d => d.iso3
    );

    const result = new Map();
    grouped.forEach((records, iso3) => {
      result.set(iso3, records[records.length - 1]);
    });
    return result;
  };

  const atlasState = (year) => {
    const records = activeRecordByCountry(year);
    const byNumericId = new Map();

    records.forEach((record, iso3) => {
      const numericIds = ISO3_TO_NUMERIC[iso3] || [];
      numericIds.forEach(id => byNumericId.set(id, record));
    });

    return byNumericId;
  };

  const showTooltip = (event, record) => {
    if (!record || !tooltip) return;

    const population = Number.isFinite(record.jewishPopPrewar)
      ? `<br>Población judía previa a la guerra: <b>${new Intl.NumberFormat("es-AR").format(record.jewishPopPrewar)}</b>`
      : "";

    tooltip.innerHTML = `
      <strong>${record.country}</strong>
      <span>${record.status}</span><br>
      ${record.eventShort}
      ${population}
    `;
    tooltip.hidden = false;
    moveTooltip(event);
  };

  const moveTooltip = (event) => {
    if (!tooltip || tooltip.hidden) return;
    const pad = 14;
    const box = tooltip.getBoundingClientRect();
    const x = Math.min(event.clientX + pad, window.innerWidth - box.width - pad);
    const y = Math.min(event.clientY + pad, window.innerHeight - box.height - pad);
    tooltip.style.left = `${Math.max(pad, x)}px`;
    tooltip.style.top = `${Math.max(pad, y)}px`;
  };

  const hideTooltip = () => {
    if (tooltip) tooltip.hidden = true;
  };

  const updateMap = (year) => {
    currentYear = year;
    const state = atlasState(year);

    yearLabel.textContent = year;
    caption.textContent = YEAR_CAPTIONS[year];

    steps.forEach(step => {
      step.classList.toggle("is-active", Number(step.dataset.year) === year);
    });

    paths
      .classed("is-germany", false)
      .classed("is-new", false)
      .classed("is-previous", false)
      .classed("is-interactive", false)
      .each(function(feature) {
        const record = state.get(String(feature.id).padStart(3, "0"));
        if (!record) return;

        const selection = d3.select(this);
        const isGermany = record.iso3 === "DEU";
        const isNew = record.year === year && !isGermany;

        selection
          .classed("is-germany", isGermany)
          .classed("is-new", isNew)
          .classed("is-previous", !isGermany && !isNew)
          .classed("is-interactive", true);
      });

    paths
      .on("mouseenter", function(event, feature) {
        const record = state.get(String(feature.id).padStart(3, "0"));
        showTooltip(event, record);
      })
      .on("mousemove", moveTooltip)
      .on("mouseleave", hideTooltip);
  };

  const render = (world) => {
    countries = topojson.feature(world, world.objects.countries);

    const width = 960;
    const height = 700;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const projection = d3.geoMercator()
      .fitExtent([[28, 26], [width - 28, height - 24]], {
        type: "FeatureCollection",
        features: countries.features.filter(d => {
          const [lon, lat] = d3.geoCentroid(d);
          return lon > -25 && lon < 45 && lat > 32 && lat < 72;
        })
      });

    const path = d3.geoPath(projection);

    paths = svg
      .append("g")
      .attr("aria-hidden", "true")
      .selectAll("path")
      .data(countries.features)
      .join("path")
      .attr("class", "expansion-country")
      .attr("d", path);

    updateMap(1938);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateMap(Number(entry.target.dataset.year));
        }
      });
    }, { rootMargin: "-48% 0px -48% 0px", threshold: 0 });

    steps.forEach(step => observer.observe(step));
  };

  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json")
    .then(render)
    .catch(error => {
      console.error("No se pudo cargar el atlas mundial.", error);
      const fallback = document.createElement("p");
      fallback.textContent = "No se pudo cargar el mapa. Verificá la conexión a internet.";
      fallback.style.color = "#5a0d0f";
      svgElement.replaceWith(fallback);
    });
})();
