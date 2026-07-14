/* @ds-bundle: {"format":3,"namespace":"DesignSystem_dd978c","components":[],"sourceHashes":{"uploads/main.js":"404a203c71df"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_dd978c = window.DesignSystem_dd978c || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// uploads/main.js
try { (() => {
const heroImage = document.querySelector('.hero__image');
const heroSection = document.querySelector('.hero');
if (heroImage && heroSection) {
  const updateHeroParallax = () => {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const heroRect = heroSection.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -heroRect.top / viewportHeight));
    const translateY = progress * 90;
    const scale = 1.08 + progress * 0.08;
    const blur = Math.max(0, 1 - progress * 0.85);
    heroImage.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
    heroImage.style.filter = `blur(${blur}px) brightness(0.72) contrast(0.95) saturate(0.75)`;
  };
  updateHeroParallax();
  window.addEventListener('scroll', updateHeroParallax, {
    passive: true
  });
  window.addEventListener('resize', updateHeroParallax);
}

// ─── Flourish scroll-driven story ────────────────────────────────────────
// Ajustar TOTAL_SLIDES al número real de slides en story/3707371
const TOTAL_SLIDES = 11;
const flourishSection = document.querySelector('.flourish-scroll');
if (flourishSection) {
  let lastSentSlide = -1;
  let playerReady = false;
  function getFlourishIframe() {
    return flourishSection.querySelector('iframe');
  }
  function sendSlide(index) {
    const iframe = getFlourishIframe();
    if (!iframe) return;

    // Utilizar el hash de la URL para cambiar de slide internamente sin recargar el iframe
    const baseSrc = iframe.src.split('#')[0];
    iframe.src = `${baseSrc}#slide-${index}`;
  }
  function getTargetSlide() {
    const rect = flourishSection.getBoundingClientRect();
    const scrolled = -rect.top;
    const scrollable = flourishSection.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    const progress = Math.max(0, Math.min(1, scrolled / scrollable));
    return Math.min(TOTAL_SLIDES - 1, Math.floor(progress * TOTAL_SLIDES));
  }
  function onFlourishScroll() {
    if (!playerReady) return;
    const slide = getTargetSlide();
    if (slide !== lastSentSlide) {
      lastSentSlide = slide;
      sendSlide(slide);
    }
  }
  function markPlayerReady() {
    if (playerReady) return;
    playerReady = true;
    // Sincroniza inmediatamente con la posición de scroll actual
    const slide = getTargetSlide();
    lastSentSlide = slide;
    sendSlide(slide);
  }

  // Flourish manda postMessages al parent al inicializarse (resize, etc.)
  // Cuando recibimos cualquier mensaje del iframe, sabemos que el player está listo
  window.addEventListener('message', event => {
    const iframe = getFlourishIframe();
    if (iframe && event.source === iframe.contentWindow) {
      markPlayerReady();
    }
  });

  // Fallback por si no llega ningún mensaje del iframe
  setTimeout(markPlayerReady, 4000);
  window.addEventListener('scroll', onFlourishScroll, {
    passive: true
  });
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "uploads/main.js", error: String((e && e.message) || e) }); }

})();
