(() => {
  const section = document.getElementById("legado-posguerra");
  const data = window.POSGUERRA_DATA;

  if (!section || !data || !Array.isArray(data.desplazados) || !Array.isArray(data.hitos)) {
    console.warn("No se pudo iniciar el capítulo de posguerra: faltan el HTML o los datos.");
    return;
  }

  const figure = document.getElementById("posguerra-figure");
  const timeline = document.getElementById("posguerra-timeline");

  const yearEl = document.getElementById("posguerra-year");
  const numberEl = document.getElementById("posguerra-number");
  const labelEl = document.getElementById("posguerra-label");
  const descriptionEl = document.getElementById("posguerra-description");

  const eventYearEl = document.getElementById("posguerra-event-year");
  const eventTitleEl = document.getElementById("posguerra-event-title");
  const eventDescriptionEl = document.getElementById("posguerra-event-description");
  const eventImpactEl = document.getElementById("posguerra-event-impact");

  const svgElement = document.getElementById("posguerra-timeline-svg");
  const steps = Array.from(section.querySelectorAll(".posguerra-step"));

  if (
    !figure ||
    !timeline ||
    !yearEl ||
    !numberEl ||
    !labelEl ||
    !descriptionEl ||
    !eventYearEl ||
    !eventTitleEl ||
    !eventDescriptionEl ||
    !eventImpactEl ||
    !svgElement
  ) {
    console.warn("Faltan elementos del capítulo de posguerra.");
    return;
  }

  const numberFormatter = new Intl.NumberFormat("es-AR");

  let currentMode = "figure";
  let currentIndex = 0;

  const setActiveStep = (activeStep) => {
    steps.forEach(step => {
      step.classList.toggle("is-active", step === activeStep);
    });
  };

  const showFigure = (index) => {
    const item = data.desplazados[index];
    if (!item) return;

    currentMode = "figure";
    currentIndex = index;

    timeline.classList.remove("is-visible");
    figure.style.display = "block";

    yearEl.textContent =
      item.inicio === item.fin
        ? String(item.inicio)
        : `${item.inicio}–${item.fin}`;

    numberEl.textContent = numberFormatter.format(item.cantidad);
    labelEl.textContent = item.label;
    descriptionEl.textContent = item.descripcion;

    figure.animate(
      [
        { opacity: 0.35, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      {
        duration: 420,
        easing: "ease-out"
      }
    );
  };

  const showTimeline = (index) => {
    const item = data.hitos[index];
    if (!item) return;

    currentMode = "timeline";
    currentIndex = index;

    figure.style.display = "none";
    timeline.classList.add("is-visible");

    eventYearEl.textContent = item.año;
    eventTitleEl.textContent = item.titulo;
    eventDescriptionEl.textContent = item.descripcion;
    eventImpactEl.textContent = item.impacto;

    updateTimeline(index);
  };

  const svg = window.d3
    ? d3.select(svgElement)
    : null;

  let xScale;
  let axisLine;
  let progressLine;
  let dots;
  let yearLabels;

  const drawTimeline = () => {
    if (!svg || !window.d3) {
      console.warn("D3 no está disponible para dibujar la línea de tiempo.");
      return;
    }

    const width = 900;
    const height = 190;
    const margin = {
      top: 55,
      right: 45,
      bottom: 45,
      left: 45
    };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const years = data.hitos.map(item => item.año);
    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    xScale = d3
      .scaleLinear()
      .domain([minYear, maxYear])
      .range([margin.left, width - margin.right]);

    const y = 95;

    axisLine = svg
      .append("line")
      .attr("class", "posguerra-timeline__axis")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", y)
      .attr("y2", y);

    progressLine = svg
      .append("line")
      .attr("class", "posguerra-timeline__progress")
      .attr("x1", margin.left)
      .attr("x2", margin.left)
      .attr("y1", y)
      .attr("y2", y);

    dots = svg
      .append("g")
      .selectAll("circle")
      .data(data.hitos)
      .join("circle")
      .attr("class", "posguerra-timeline__dot")
      .attr("cx", d => xScale(d.año))
      .attr("cy", y)
      .attr("r", 8);

    yearLabels = svg
      .append("g")
      .selectAll("text")
      .data(data.hitos)
      .join("text")
      .attr("class", "posguerra-timeline__year-label")
      .attr("x", d => xScale(d.año))
      .attr("y", y + 34)
      .text(d => d.año);
  };

  const updateTimeline = (activeIndex) => {
    if (!svg || !xScale || !progressLine || !dots) return;

    const activeItem = data.hitos[activeIndex];
    if (!activeItem) return;

    progressLine
      .transition()
      .duration(500)
      .attr("x2", xScale(activeItem.año));

    dots
      .classed("is-active", (_, index) => index === activeIndex)
      .classed("is-past", (_, index) => index < activeIndex)
      .transition()
      .duration(300)
      .attr("r", (_, index) => (index === activeIndex ? 12 : 8));

    if (yearLabels) {
      yearLabels
        .style("font-weight", (_, index) => (index === activeIndex ? "700" : "400"))
        .style("fill", (_, index) =>
          index === activeIndex
            ? "var(--posguerra-accent)"
            : "var(--posguerra-muted)"
        );
    }
  };

  drawTimeline();
  showFigure(0);

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const step = entry.target;
        const mode = step.dataset.mode;
        const index = Number(step.dataset.index);

        setActiveStep(step);

        if (mode === "figure" && Number.isInteger(index)) {
          showFigure(index);
        }

        if (mode === "timeline" && Number.isInteger(index)) {
          showTimeline(index);
        }

        if (step.classList.contains("posguerra-step--transition")) {
          figure.style.display = "none";
          timeline.classList.add("is-visible");

          eventYearEl.textContent = "1945–1951";
          eventTitleEl.textContent = "Una nueva respuesta internacional";
          eventDescriptionEl.textContent =
            "La reconstrucción de la posguerra también implicó crear nuevas instituciones y reglas.";
          eventImpactEl.textContent =
            "Justicia internacional, derechos humanos y protección de las personas refugiadas.";
        }
      });
    },
    {
      rootMargin: "-48% 0px -48% 0px",
      threshold: 0
    }
  );

  steps.forEach(step => observer.observe(step));

  window.addEventListener("resize", () => {
    if (currentMode === "timeline") {
      updateTimeline(currentIndex);
    }
  });
})();
