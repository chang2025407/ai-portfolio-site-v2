(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 900px)");
  const compact = window.matchMedia("(max-width: 520px)");
  let observer;
  let catchUpHandler;

  const all = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const one = (selector, scope = document) => scope.querySelector(selector);
  const prepared = new Set();
  const registrations = [];

  function prepare(element, type = "up", duration) {
    if (!element) return null;
    element.classList.add("qfc-motion-item", `qfc-motion-${type}`);
    if (duration) element.style.setProperty("--qfc-motion-duration", `${duration}ms`);
    prepared.add(element);
    return element;
  }

  function register(trigger, items, delays) {
    if (!trigger) return;
    const nodes = items.filter(Boolean);
    if (!nodes.length) return;
    registrations.push({ trigger, nodes, delays });
  }

  function showNode(node, delay = 0) {
    node.style.setProperty("--qfc-motion-delay", `${Math.max(0, delay)}ms`);
    requestAnimationFrame(() => node.classList.add("is-visible"));
  }

  function showRegistration(registration) {
    if (registration.shown) return;
    registration.shown = true;
    registration.nodes.forEach((node, index) => {
      const delay = typeof registration.delays === "function"
        ? registration.delays(index, registration.nodes.length)
        : registration.delays?.[index] || 0;
      showNode(node, delay);
    });
    observer?.unobserve(registration.trigger);
  }

  function showEverything() {
    observer?.disconnect();
    if (catchUpHandler) window.removeEventListener("scroll", catchUpHandler);
    prepared.forEach((node) => node.classList.add("is-visible"));
    root.classList.remove("qfc-motion-ready");
  }

  function setupMotion() {
    const hero = one(".qfc-hero");
    const heroItems = [
      prepare(one(".qfc-kicker", hero), "up", 360),
      prepare(one("h1", hero), "up", 520),
      prepare(one(".qfc-question", hero), "up", 420),
      prepare(one(".qfc-lead", hero), "up", 420),
      prepare(one(".qfc-meta", hero), "up", 420),
      prepare(one(".qfc-hero__space", hero), "scale", 660),
      ...all(".qfc-hero__screens img", hero).map((node) => prepare(node, "right", 480)),
      prepare(one(".qfc-hero__visual > p", hero), "fade", 300),
    ];
    const heroDelays = compact.matches
      ? [0, 45, 115, 115, 175, 70, 230, 230, 310]
      : [0, 60, 145, 200, 265, 80, 260, 340, 430];
    register(hero, heroItems, heroDelays);

    const friction = one("#friction");
    register(friction, [
      prepare(one(".qfc-section__head", friction), "up"),
      prepare(one(".qfc-problem__intro", friction), "up"),
      ...all(".qfc-friction-grid article", friction).map((node) => prepare(node, "up", 380)),
    ], compact.matches ? [0, 45, 105, 150, 195] : [0, 70, 160, 240, 320]);
    const evidenceStrip = one(".qfc-evidence-strip", friction);
    register(evidenceStrip, [prepare(evidenceStrip, compact.matches ? "fade" : "clip", 520)], [0]);

    const opportunity = one(".qfc-opportunity");
    register(opportunity, [
      prepare(one(".qfc-section__head", opportunity), "up"),
      prepare(one(".qfc-large-copy", opportunity), "up"),
      ...all(".qfc-principles article", opportunity).map((node) => prepare(node, "left", 400)),
    ], compact.matches ? [0, 45, 100, 140, 180] : [0, 70, 150, 240, 330]);
    const journeySource = one(".qfc-journey-source", opportunity);
    register(journeySource, [prepare(journeySource, "fade", 520)], [0]);

    const journey = one("#journey");
    register(journey, [
      prepare(one(".qfc-section__head", journey), "up"),
      prepare(one(".qfc-section__lead", journey), "up"),
    ], [0, 70]);
    const journeyList = one(".qfc-service-journey", journey);
    const journeyNodes = all("li", journeyList).map((node) => prepare(node, mobile.matches ? "up" : "left", 400));
    register(journeyList, journeyNodes, (index) => compact.matches ? Math.floor(index / 2) * 65 : index * 75);
    const journeyMedia = one(".qfc-journey-media", journey);
    const journeyScreens = all(".qfc-journey-media__screens img", journeyMedia).map((node) => prepare(node, "up", 440));
    const handoff = prepare(one(".qfc-journey-media > div:last-child", journeyMedia), "right", 420);
    register(journeyMedia, [...journeyScreens, handoff], (index) => compact.matches
      ? (index < 2 ? 0 : index < 4 ? 75 : 160)
      : index < 4 ? index * 70 : 400);

    const spatial = one("#spatial");
    register(spatial, [prepare(one(".qfc-section__head", spatial), "up")], [0]);
    const spatialHero = one(".qfc-spatial__hero", spatial);
    register(spatialHero, [
      prepare(one("img", spatialHero), "scale", 620),
      prepare(one("aside", spatialHero), mobile.matches ? "up" : "right", 460),
    ], mobile.matches ? [0, 70] : [0, 120]);
    const spatialGrid = one(".qfc-spatial__grid", spatial);
    register(spatialGrid, all("figure", spatialGrid).map((node) => prepare(node, "up", 440)), compact.matches ? [0, 55] : [0, 90]);

    const digital = one("#digital");
    register(digital, [
      prepare(one(".qfc-section__head", digital), "up"),
      prepare(one(".qfc-digital__intro", digital), "up"),
    ], [0, 70]);
    const uiGrid = one(".qfc-ui-grid", digital);
    const uiCards = all("figure", uiGrid).map((node) => prepare(node, "up", 440));
    register(uiGrid, uiCards, compact.matches ? [0, 70, 70, 150, 150] : [0, 90, 180, 270, 360]);

    const testing = one("#testing");
    register(testing, [prepare(one(".qfc-section__head", testing), "up", 480)], [0]);
    const testingGrid = one(".qfc-testing__grid", testing);
    const testingImage = prepare(one("figure", testingGrid), "up", 480);
    const evidenceNodes = all(".qfc-evidence-chain article", testingGrid).map((node) => prepare(node, "left", 360));
    const unvalidated = prepare(one(".qfc-testing__notes aside", testingGrid), "fade", 320);
    register(testingGrid, [testingImage, ...evidenceNodes, unvalidated], compact.matches
      ? [0, 60, 120, 180, 260]
      : [0, 90, 210, 330, 470]);

    const outcome = one("#outcome");
    register(outcome, [
      prepare(one(".qfc-section__head", outcome), "up", 480),
      ...all(".qfc-outcome__grid article", outcome).map((node) => prepare(node, "up", 380)),
      prepare(one("blockquote", outcome), "fade", 420),
    ], compact.matches ? [0, 70, 70, 70, 165] : [0, 90, 150, 210, 330]);

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      prepared.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        registrations
          .filter((registration) => registration.trigger === entry.target)
          .forEach(showRegistration);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -12% 0px" });

    registrations.forEach((registration) => observer.observe(registration.trigger));
    root.classList.add("qfc-motion-ready");

    requestAnimationFrame(() => {
      registrations
        .filter((registration) => registration.trigger === hero)
        .forEach(showRegistration);
    });

    catchUpHandler = () => {
      registrations.forEach((registration) => {
        if (!registration.shown && registration.trigger.getBoundingClientRect().top < window.innerHeight * 1.08) {
          showRegistration(registration);
        }
      });
    };
    window.addEventListener("scroll", catchUpHandler, { passive: true });
    catchUpHandler();
  }

  try {
    setupMotion();
    reducedMotion.addEventListener?.("change", (event) => {
      if (event.matches) showEverything();
    });
  } catch (error) {
    console.error("Quiet Fitness Cabin motion failed safely.", error);
    showEverything();
  }
})();
