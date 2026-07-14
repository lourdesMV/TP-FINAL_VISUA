// ─── CAPÍTULO 0: LÍNEA DE TIEMPO HORIZONTAL — GSAP + ScrollTrigger ───
// Requiere: gsap.min.js y ScrollTrigger.min.js cargados ANTES de este archivo.

(function () {
  gsap.registerPlugin(ScrollTrigger);

  const years = ["1918", "1919", "1923", "1929", "1932", "1933"];
  const track = document.getElementById("thTrack");
  const section = document.getElementById("thPin");
  const wrap = document.getElementById("thLineWrap");
  const fill = document.getElementById("thLineFill");
  const counter = document.getElementById("thCounter");

  if (!track || !section || !wrap) return;

  function buildRail() {
    wrap.querySelectorAll(".th-dot, .th-yr").forEach((el) => el.remove());
    const n = years.length;
    years.forEach((yr, i) => {
      const pct = (i / (n - 1)) * 100;

      const dot = document.createElement("div");
      dot.className = "th-dot";
      dot.style.left = pct + "%";
      dot.dataset.i = i;
      wrap.appendChild(dot);

      const label = document.createElement("div");
      label.className = "th-yr";
      label.style.left = pct + "%";
      label.textContent = yr;
      label.dataset.i = i;
      wrap.appendChild(label);
    });
  }

  function setupScroll() {
    const n = years.length;
    const getDistance = () => track.scrollWidth - window.innerWidth;

    return gsap.to(track, {
      x: () => -getDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + getDistance(),
        scrub: true,
        pin: true,
        anticipatePin: 0,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;
          fill.style.width = progress * 100 + "%";
          const activeIdx = Math.min(n - 1, Math.round(progress * (n - 1)));
          document.querySelectorAll(".th-dot, .th-yr").forEach((el) => {
            el.classList.toggle("active", Number(el.dataset.i) === activeIdx);
          });
          if (counter) {
            counter.textContent =
              String(activeIdx + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
          }
        },
      },
    });
  }

  buildRail();
  const st = setupScroll();

  window.addEventListener("resize", () => {
    buildRail();
    ScrollTrigger.refresh();
  });
})();
