const heroImage = document.querySelector('.hero__image');
const heroSection = document.querySelector('.hero');

if (heroImage && heroSection) {
	const updateHeroParallax = () => {
		const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
		const heroRect = heroSection.getBoundingClientRect();
		const progress = Math.min(1, Math.max(0, (-heroRect.top) / viewportHeight));
		const translateY = progress * 90;
		const scale = 1.08 + progress * 0.08;
		const blur = Math.max(0, 1 - progress * 0.85);

		heroImage.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
		heroImage.style.filter = `blur(${blur}px) brightness(0.72) contrast(0.95) saturate(0.75)`;
	};

	updateHeroParallax();
	window.addEventListener('scroll', updateHeroParallax, { passive: true });
	window.addEventListener('resize', updateHeroParallax);
}

// ─── Flourish scroll-driven story con HTML (Intersection Observer) ────────
// Maneja múltiples secciones .flourish-scroll de forma independiente

document.querySelectorAll('.flourish-scroll').forEach(flourishSection => {
	let playerReady = false;
	let slideActual = 0;

	function getFlourishIframe() {
		return flourishSection.querySelector('iframe');
	}

	function sendSlide(index) {
		const iframe = getFlourishIframe();
		if (!iframe || !playerReady) return;
		const baseSrc = iframe.src.split('#')[0];
		iframe.src = `${baseSrc}#slide-${index}`;
	}

	function markPlayerReady() {
		if (playerReady) return;
		playerReady = true;
		sendSlide(slideActual);
	}

	window.addEventListener('message', (event) => {
		const iframe = getFlourishIframe();
		if (iframe && event.source === iframe.contentWindow) {
			markPlayerReady();
		}
	});

	setTimeout(markPlayerReady, 3000);

	const steps = flourishSection.querySelectorAll('.step');
	const observer = new IntersectionObserver((entradas) => {
		entradas.forEach(entrada => {
			if (entrada.isIntersecting) {
				slideActual = entrada.target.getAttribute('data-slide');
				sendSlide(slideActual);
			}
		});
	}, { rootMargin: '-50% 0px -50% 0px' });

	steps.forEach(step => observer.observe(step));
});

// ─── Capítulo de la cifra: conteo 0 → 70.000.000 con el scroll ──────────
(function () {
	const TARGET = 6000000;
	const section = document.getElementById('figure');
	if (!section) return;

	const countEl = document.getElementById('count');
	const barEl = document.getElementById('bar');
	const figureEl = countEl.closest('.figure');
	const hintEl = document.getElementById('hint');
	const nf = new Intl.NumberFormat('es-AR'); // 70.000.000

	// const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	// if (reduceMotion) {
	// 	countEl.textContent = nf.format(TARGET);
	// 	figureEl.classList.add('is-complete');
	// 	return;
	// }

	const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic

	function update() {
		const rect = section.getBoundingClientRect();
		const scrollable = section.offsetHeight - window.innerHeight;
		const raw = Math.min(1, Math.max(0, -rect.top / scrollable));

		// el número cuenta en la franja central del scroll (con "aire" antes/después)
		const LEAD_IN    = 0.02;  // aire antes (era 0.12)
		const COUNT_SPAN = 0.5;  // franja de conteo (era 0.70) → más grande = más lento
		const counting = Math.min(1, Math.max(0, (raw - LEAD_IN) / COUNT_SPAN));

		const value = Math.round(ease(counting) * TARGET);

		countEl.textContent = nf.format(value);
		barEl.style.setProperty('--progress', counting);
		figureEl.classList.toggle('is-complete', counting >= 0.999);
		hintEl.style.opacity = raw > 0.05 ? '0' : '1';
	}
	update();
	window.addEventListener('scroll', update, { passive: true });
	window.addEventListener('resize', update);
})();

// Capítulo 3: Línea de tiempo

const enemyTimelineData = [
	{
		year: "1933",
		date: "30-01-1933",
		title: "Hitler es nombrado canciller",
		description: "Comienza el régimen Nazi.",
		image: "img/hitler_canciller.jpg"
	},
	{
		year: "1933",
		date: "01-04-1933",
		title: "Boicot nacional a negocios judíos",
		description: "Primer ataque coordinado del Estado contra los judíos. Ese día, los alemanes no comprarían nada en tiendas y negocios identificados por los nazis como judíos. Tampoco debían acudir a consultorios de médicos o despachos de abogados judíos.\n\nLos nazis culpaban falsamente a los judíos de los problemas económicos de Alemania y buscaban eliminar su influencia en la economía. El boicot fue presentado como el primer paso para lograrlo.",
		image: "img/boicot_negocios_judios.jpeg"
	},
	{
		year: "1933",
		date: "07-04-1933",
		title: "Ley para la Restauración del Servicio Civil Profesional",
		description: "Expulsaron a los judíos del servicio civil, lo que afectó masivamente a jueces, profesores universitarios y funcionarios del gobierno. Ese mismo mes se aprobaron restricciones drásticas contra médicos y abogados judíos.",
		image: "img/ley-servicio-civil.jpg"
	},
	{
		year: "1933",
		date: "25-04-1933",
		title: "Ley contra la Sobrecarga de las Escuelas y Universidades Alemanas",
		description: "Esta norma impuso un límite estricto que redujo drásticamente el número de estudiantes judíos admitidos en instituciones educativas de Alemania.",
		image: "img/expulsion_judios_escuelas.jpeg"
	},
	{
		year: "1935",
		date: "15-09-1935",
		title: "Leyes de Núremberg",
		description: "Los judíos dejan de ser ciudadanos alemanes. Los privaron de sus derechos políticos, prohibieron los matrimonios mixtos entre alemanes y judíos, y los definieron legalmente según la ascendencia de sus abuelos.",
		image: "img/leyes_nuremberg.jpg"
	},
	{
		year: "1938",
		date: "12-03-1938",
		title: "Anexión de Austria",
		description: "Tras la anexión de Austria en 1938, más de 180.000 judíos austríacos quedaron bajo control nazi y fueron sometidos a las mismas políticas de discriminación, despojo y exclusión que en Alemania.",
		image: "img/anexion_austria.jpg"
	},
	{
		year: "1938",
		date: "17-09-1938",
		title: "Ley de nombres y apellidos",
		description: "La normativa exigía que las personas sin nombres de pila explícitamente judíos adoptaran el segundo nombre obligatorio de “Israel” para los hombres y “Sara” para las mujeres para facilitar su identificación y segregación.",
		image: "img/ley-nombres-nazis.png"
	},
	{
		year: "1938",
		date: "05-10-1938",
		title: "Decreto sobre pasaportes judíos",
		description: "En 1938, el régimen nazi invalidó los pasaportes de los judíos. Solo podían volver a utilizarse si eran marcados con una letra “J”, facilitando su identificación y control.",
		image: "img/ley-pasaportes-judios.jpg"
	},
	{
		year: "1938",
		date: "09-11-1938 → 10-11-1938",
		title: "Kristallnacht: Noche de los Cristales Rotos",
		description: "El régimen nazi coordinó ataques contra sinagogas, comercios y hogares judíos. El ataque recibió este nombre debido a los vidrios de los aparadores hechos añicos que cubrieron las calles después de la violencia.\n\n Las fuerzas de policía no protegieron a los judíos ni a sus propiedades. Cientos de judíos murieron durante la Kristallnacht, como resultado de esta. Más de 30.000 judíos fueron arrestados y enviados a campos de concentración.",
		image: "img/noche-cristales-rotos.jpg"
	},
	{
		year: "1938",
		date: "12-11-1938",
		title: "Las multas colectivas",
		description: "Tras la Kristallnacht, el régimen nazi impuso una multa colectiva de 1.000 millones de marcos a la comunidad judía para la reparación de los daños, confiscó las indemnizaciones de seguros y prohibió a los judíos poseer negocios o trabajar de forma independiente.",
		image: "img/daños-cristales-rotos.jpg"
	},
	{
		year: "1938",
		date: "15-11-1938",
		title: "Expulsión de las escuelas públicas",
		description: "En 1938, los niños judíos fueron expulsados de las escuelas públicas alemanas y austríacas, quedando confinados a instituciones segregadas sostenidas por la propia comunidad judía.",
		image: "img/expulsion-niños-escuelas-publicas.jpg"
	},
	{
		year: "1939",
		date: "17-05-1939",
		title: "Censo de población general para registro judío",
		description: "En 1939, el régimen nazi incorporó criterios raciales al censo nacional y utilizó esa información para crear un registro detallado de la población judía bajo su control, facilitando futuras políticas de persecución y segregación.",
		image: "img/registro-judios.jpg"
	}
];

const enemyTimeline = document.querySelector("#enemyTimeline");
const enemyTimelineViewport = document.querySelector("#enemyTimelineViewport");
const enemyPrevButton = document.querySelector(".enemy-timeline-nav--prev");
const enemyNextButton = document.querySelector(".enemy-timeline-nav--next");

const enemyFocusYear = document.querySelector("#enemyFocusYear");
const enemyFocusDate = document.querySelector("#enemyFocusDate");
const enemyFocusTitle = document.querySelector("#enemyFocusTitle");
const enemyFocusDescription = document.querySelector("#enemyFocusDescription");

let enemyActiveIndex = 0;

function createEnemyTimelineEvent(event, index) {
	const article = document.createElement("article");
	article.className = "enemy-timeline-event";
	article.dataset.index = index;
	article.dataset.year = event.year;
	article.dataset.date = event.date;
	article.dataset.title = event.title;
	article.dataset.description = event.description;

	if (index === 0) {
		article.classList.add("is-active");
	}

	article.innerHTML = `
		<div class="enemy-timeline-event__media">
			<img src="${event.image}" alt="${event.title}">
		</div>

		<div class="enemy-timeline-event__dot"></div>

		<div class="enemy-timeline-event__text">
			<span class="enemy-timeline-event__year">${event.year}</span>
			<h3 class="enemy-timeline-event__title">${event.title}</h3>
		</div>
	`;

	article.addEventListener("click", () => {
		activateEnemyTimelineEvent(index, true);
	});

	article.addEventListener("mouseenter", () => {
		activateEnemyTimelineEvent(index, false);
	});

	return article;
}

function renderEnemyTimeline() {
	if (!enemyTimeline) return;

	enemyTimelineData.forEach((event, index) => {
		const eventElement = createEnemyTimelineEvent(event, index);
		enemyTimeline.appendChild(eventElement);
	});

	activateEnemyTimelineEvent(0, false);
}

function activateEnemyTimelineEvent(index, shouldScroll = false) {
	const events = Array.from(document.querySelectorAll(".enemy-timeline-event"));

	if (!events.length) return;

	enemyActiveIndex = Math.max(0, Math.min(events.length - 1, index));

	events.forEach((event, i) => {
		event.classList.toggle("is-active", i === enemyActiveIndex);
	});

	const activeEvent = enemyTimelineData[enemyActiveIndex];

	enemyFocusYear.textContent = activeEvent.year;
	enemyFocusDate.textContent = activeEvent.date;
	enemyFocusTitle.textContent = activeEvent.title;
	enemyFocusDescription.textContent = activeEvent.description;

	if (shouldScroll && enemyTimelineViewport) {
		const activeElement = events[enemyActiveIndex];

		const left =
			activeElement.offsetLeft -
			enemyTimelineViewport.clientWidth / 2 +
			activeElement.clientWidth / 2;

		enemyTimelineViewport.scrollTo({
			left,
			behavior: "smooth"
		});
	}
}

if (enemyPrevButton) {
	enemyPrevButton.addEventListener("click", () => {
		activateEnemyTimelineEvent(enemyActiveIndex - 1, true);
	});
}

if (enemyNextButton) {
	enemyNextButton.addEventListener("click", () => {
		activateEnemyTimelineEvent(enemyActiveIndex + 1, true);
	});
}

renderEnemyTimeline();

// Capitulo 6: Survey victimas

document.addEventListener("DOMContentLoaded", () => {
	const storyFrame = document.querySelector("#waffle-story");
	const scrolly = document.querySelector(".waffle-scrolly");

	const scrollItems = Array.from(
		document.querySelectorAll(".waffle-scroll-item")
	);

	const copyItems = Array.from(
		document.querySelectorAll(".waffle-copy")
	);

	if (!storyFrame || !scrolly || scrollItems.length === 0) {
		return;
	}

	const storyUrl = "https://flo.uri.sh/story/3728003/embed";

	let currentSlide = 0;
	let currentItem = null;
	let previousScrollY = window.scrollY;
	let scrollDirection = "down";
	let ticking = false;


	function changeStorySlide(slideNumber) {
		if (
			!Number.isInteger(slideNumber) ||
			slideNumber < 0 ||
			slideNumber === currentSlide
		) {
			return;
		}

		currentSlide = slideNumber;

		/*
		 * Navega el iframe existente a otra slide de la misma Story.
		 * Como solo cambia #slide-N, Flourish realiza la transición
		 * entre los estados del mismo Survey.
		 */
		window.open(
			`${storyUrl}#slide-${slideNumber}`,
			"waffleStoryFrame"
		);
	}


	function showCopy(copyToShow) {
		copyItems.forEach((copy) => {
			copy.classList.toggle(
				"is-active",
				copy === copyToShow
			);
		});

		scrolly.classList.toggle(
			"has-copy",
			Boolean(copyToShow)
		);
	}


	function activateItem(item) {
		if (!item || item === currentItem) {
			return;
		}

		currentItem = item;

		if (item.classList.contains("waffle-intro-spacer")) {
			changeStorySlide(0);
			showCopy(null);
			return;
		}

		if (item.classList.contains("waffle-copy")) {
			const slideNumber = Number(item.dataset.slide);

			changeStorySlide(slideNumber);
			showCopy(item);

			return;
		}

		if (item.classList.contains("waffle-transition")) {
			showCopy(null);

			const fromSlide = Number(item.dataset.from);
			const toSlide = Number(item.dataset.to);

			const destinationSlide =
				scrollDirection === "down"
					? toSlide
					: fromSlide;

			changeStorySlide(destinationSlide);
		}
	}


	function updateWaffleScrolly() {
		const activationPoint = window.innerHeight * 0.55;

		const activeItem = scrollItems.find((item) => {
			const rect = item.getBoundingClientRect();

			return (
				rect.top <= activationPoint &&
				rect.bottom > activationPoint
			);
		});

		activateItem(activeItem);

		ticking = false;
	}


	function handleWaffleScroll() {
		const currentScrollY = window.scrollY;

		if (currentScrollY > previousScrollY) {
			scrollDirection = "down";
		} else if (currentScrollY < previousScrollY) {
			scrollDirection = "up";
		}

		previousScrollY = currentScrollY;

		if (!ticking) {
			window.requestAnimationFrame(updateWaffleScrolly);
			ticking = true;
		}
	}


	window.addEventListener(
		"scroll",
		handleWaffleScroll,
		{ passive: true }
	);

	window.addEventListener(
		"resize",
		updateWaffleScrolly
	);

	/*
	* Al ingresar, no mostramos ningún texto:
	* primero se observa el Survey completo.
	*/
	showCopy(null);
	updateWaffleScrolly();
});

// Capitulo 7: La magnitud humana
/* ==========================================================
   DINAMARCA — SCROLL CON PAUSA PARA VER DESAPARECER LOS PUNTOS
   ========================================================== */

function initDenmarkScroll() {
	const section = document.querySelector("#denmark-scroll");

	if (!section) {
		console.warn("No se encontró #denmark-scroll");
		return;
	}

	const visibleMap = section.querySelector(
		".denmark-scroll__map--visible"
	);

	const emptyMap = section.querySelector(
		".denmark-scroll__map--empty"
	);

	const firstCard = section.querySelector(
		".denmark-scroll__card--first"
	);

	const secondCard = section.querySelector(
		".denmark-scroll__card--second"
	);

	const instruction = section.querySelector(
		".denmark-scroll__instruction"
	);

	if (!visibleMap || !emptyMap || !firstCard || !secondCard) {
		console.warn("Faltan elementos del gráfico de Dinamarca");
		return;
	}

	let ticking = false;

	function clamp(value, minimum, maximum) {
		return Math.min(Math.max(value, minimum), maximum);
	}

	function smoothstep(start, end, value) {
		if (start === end) {
			return value < start ? 0 : 1;
		}

		const normalized = clamp(
			(value - start) / (end - start),
			0,
			1
		);

		return normalized * normalized * (3 - 2 * normalized);
	}

	function updateDenmarkScroll() {
		const rectangle = section.getBoundingClientRect();

		const scrollDistance =
			section.offsetHeight - window.innerHeight;

		if (scrollDistance <= 0) {
			ticking = false;
			return;
		}

		const progress = clamp(
			-rectangle.top / scrollDistance,
			0,
			1
		);

		const isMobile = window.innerWidth <= 800;

		/* ------------------------------------------
		   1. PRIMERA TARJETA
		   Visible al principio y luego sale.
		   ------------------------------------------ */

		const firstCardExit = smoothstep(
			0.16,
			0.30,
			progress
		);

		const firstCardX = -120 * firstCardExit;

		firstCard.style.opacity =
			String(1 - firstCardExit);

		firstCard.style.visibility =
			firstCardExit >= 0.99 ? "hidden" : "visible";

		firstCard.style.transform = isMobile
			? `translate3d(${firstCardX}px, 0, 0)`
			: `translate3d(${firstCardX}px, -50%, 0)`;


		/* ------------------------------------------
		   2. DESAPARICIÓN DE LOS PUNTOS
		   Ocurre cuando no hay tarjetas encima.
		   ------------------------------------------ */

		const mapFade = smoothstep(
			0.34,
			0.60,
			progress
		);

		visibleMap.style.opacity =
			String(1 - mapFade);

		emptyMap.style.opacity =
			String(mapFade);

		visibleMap.style.pointerEvents =
			mapFade < 0.90 ? "auto" : "none";

		emptyMap.style.pointerEvents = "none";


		/* ------------------------------------------
		   3. SEGUNDA TARJETA
		   Aparece cuando los puntos ya desaparecieron.
		   ------------------------------------------ */

		const secondCardEntry = smoothstep(
			0.66,
			0.80,
			progress
		);

		const secondCardX =
			120 * (1 - secondCardEntry);

		secondCard.style.opacity =
			String(secondCardEntry);

		secondCard.style.visibility =
			secondCardEntry <= 0.01 ? "hidden" : "visible";

		secondCard.style.transform = isMobile
			? `translate3d(${secondCardX}px, 0, 0)`
			: `translate3d(${secondCardX}px, -50%, 0)`;


		/* ------------------------------------------
		   INDICACIÓN DE SCROLL
		   ------------------------------------------ */

		if (instruction) {
			const instructionOpacity = clamp(
				1 - progress * 8,
				0,
				1
			);

			instruction.style.opacity =
				String(instructionOpacity);
		}

		ticking = false;
	}

	function requestUpdate() {
		if (ticking) {
			return;
		}

		ticking = true;

		window.requestAnimationFrame(
			updateDenmarkScroll
		);
	}

	window.addEventListener(
		"scroll",
		requestUpdate,
		{ passive: true }
	);

	window.addEventListener(
		"resize",
		requestUpdate
	);

	updateDenmarkScroll();
}

/*
	Funciona tanto si main.js tiene defer
	como si se carga al final del body.
*/

if (document.readyState === "loading") {
	document.addEventListener(
		"DOMContentLoaded",
		initDenmarkScroll
	);
} else {
	initDenmarkScroll();
}


// ─── Barra de progreso de capítulos ──────────────────────────────────────

(function () {
	const nav = document.querySelector('.chapter-progress');
	if (!nav) return;

	const items = Array.from(nav.querySelectorAll('.chapter-progress__item'));
	const sections = items
		.map(item => document.querySelector(item.querySelector('.chapter-progress__link').getAttribute('href')))
		.filter(Boolean);

	if (!sections.length) return;

	// 1. Lógica del Observer (se mantiene igual, está perfecta)
	function setActive(index) {
		items.forEach((item, i) => item.classList.toggle('is-active', i === index));
	}

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const index = sections.indexOf(entry.target);
				if (index !== -1) setActive(index);
			}
		});
	}, { rootMargin: '-45% 0px -45% 0px' });

	sections.forEach(section => observer.observe(section));

	// Scroll suave solo para los clicks en la barra de navegación
	// (reemplaza a `scroll-behavior: smooth` global, que entra en conflicto con los pines de ScrollTrigger).
	items.forEach((item, i) => {
		const link = item.querySelector('.chapter-progress__link');
		if (!link) return;
		link.addEventListener('click', (e) => {
			e.preventDefault();
			sections[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});

	// 2. Lógica del Scroll optimizada con requestAnimationFrame
	let isTicking = false;

	function updateNavProgress() {
		const doc = document.documentElement;
		const scrollable = doc.scrollHeight - doc.clientHeight;
		
		// window.scrollY es más estándar en navegadores modernos
		const currentScroll = window.scrollY || doc.scrollTop; 
		const progress = scrollable > 0 ? Math.min(1, Math.max(0, currentScroll / scrollable)) : 0;
		
		nav.style.setProperty('--nav-progress', progress);
		isTicking = false; // Liberamos el lock para el próximo frame
	}

	function onScroll() {
		if (!isTicking) {
			window.requestAnimationFrame(updateNavProgress);
			isTicking = true;
		}
	}

	// Inicializamos
	updateNavProgress();
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll, { passive: true });
})();

