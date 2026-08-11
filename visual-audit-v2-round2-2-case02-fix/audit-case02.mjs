import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4176";
const URL = `${BASE}/cases/quiet-fitness-cabin.html`;
const OUT = path.resolve("visual-audit-v2-round2-2-case02");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }
  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out: ${method}`));
      }, 20000);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, listener) {
    this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
  }
  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        const all = this.listeners.get(method) || [];
        this.listeners.set(method, all.filter((item) => item !== listener));
        resolve(params);
      };
      this.on(method, listener);
    });
  }
  close() { this.ws.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), `case02-r22-${port}-`));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const target = targets.find((item) => item.type === "page");
      if (target) return { chrome, target };
    } catch {}
    await sleep(100);
  }
  chrome.kill();
  throw new Error("Chrome target unavailable");
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result.value;
}

async function screenshot(cdp, name, full = false, clip) {
  const params = { format: "png", fromSurface: true, captureBeyondViewport: full || Boolean(clip) };
  if (clip) params.clip = clip;
  const result = await cdp.send("Page.captureScreenshot", params);
  await writeFile(path.join(OUT, name), Buffer.from(result.data, "base64"));
}

function observeProblems(cdp) {
  const issues = { js: [], consoleErrors: [], imageNetworkFailures: [], notFound: [] };
  cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
    issues.js.push(exceptionDetails.exception?.description || exceptionDetails.text || "Runtime exception");
  });
  cdp.on("Runtime.consoleAPICalled", ({ type, args }) => {
    if (type === "error" || type === "assert") {
      issues.consoleErrors.push(args.map((arg) => arg.value || arg.description || "console error").join(" "));
    }
  });
  cdp.on("Network.responseReceived", ({ response }) => {
    if (response.status === 404) issues.notFound.push(response.url);
  });
  cdp.on("Network.loadingFailed", ({ type, errorText, blockedReason }) => {
    if (type === "Image") issues.imageNetworkFailures.push(blockedReason || errorText);
  });
  return issues;
}

async function setup(cdp, width, height, reduced) {
  await Promise.all([
    cdp.send("Page.enable"),
    cdp.send("Runtime.enable"),
    cdp.send("Network.enable"),
    cdp.send("Log.enable"),
    cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      mobile: width < 901,
      screenWidth: width,
      screenHeight: height,
      deviceScaleFactor: 1,
    }),
    cdp.send("Emulation.setEmulatedMedia", {
      media: "screen",
      features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [],
    }),
  ]);
}

async function revealPage(cdp, height) {
  const total = await evaluate(cdp, "document.documentElement.scrollHeight");
  for (let y = 0; y < total; y += Math.max(440, Math.round(height * 0.72))) {
    await evaluate(cdp, `scrollTo(0, ${y})`);
    await sleep(90);
  }
  await evaluate(cdp, "scrollTo(0, 0)");
  await sleep(500);
}

const metricsExpression = `(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const r = element.getBoundingClientRect();
    return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), height: Math.round(r.height), width: Math.round(r.width) };
  };
  const selectors = {
    hero: '.qfc-hero',
    friction: '#friction',
    opportunity: '.qfc-opportunity',
    journey: '#journey',
    spatial: '#spatial',
    digital: '#digital',
    testing: '#testing',
    outcome: '#outcome',
    footer: '.qfc-footer'
  };
  const sections = Object.fromEntries(Object.entries(selectors).map(([name, selector]) => [name, rect(selector)]));
  const order = Object.keys(selectors);
  const gaps = {};
  for (let i = 1; i < order.length; i += 1) {
    const previous = sections[order[i - 1]];
    const current = sections[order[i]];
    gaps[order[i - 1] + '_to_' + order[i]] = current && previous ? current.top - previous.bottom : null;
  }
  const images = [...document.images].map((image) => {
    const r = image.getBoundingClientRect();
    return {
      src: image.currentSrc || image.src,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedWidth: Math.round(r.width),
      renderedHeight: Math.round(r.height),
      visible: r.width > 0 && r.height > 0,
    };
  });
  const motionNodes = [...document.querySelectorAll('.qfc-motion-item')];
  const hiddenMotion = motionNodes.filter((node) => {
    const style = getComputedStyle(node);
    return Number(style.opacity) < 0.99 || style.visibility === 'hidden' || style.display === 'none';
  }).map((node) => node.className);
  const h1 = document.querySelector('.qfc-hero h1');
  const h1Style = getComputedStyle(h1);
  const nav = document.querySelector('.qfc-nav');
  const navStyle = getComputedStyle(nav);
  return {
    document: { width: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, height: document.documentElement.scrollHeight },
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - document.documentElement.clientWidth),
    sections,
    gaps,
    images,
    imageFailures: images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
    hiddenMotion,
    motionNodeCount: motionNodes.length,
    hero: {
      h1Text: h1.innerText,
      h1Width: Math.round(h1.getBoundingClientRect().width),
      h1Height: Math.round(h1.getBoundingClientRect().height),
      h1FontSize: h1Style.fontSize,
      h1LineHeight: h1Style.lineHeight,
      visible: getComputedStyle(document.querySelector('.qfc-hero')).visibility !== 'hidden',
      copyOpacity: getComputedStyle(document.querySelector('.qfc-hero__copy')).opacity,
      visualOpacity: getComputedStyle(document.querySelector('.qfc-hero__visual')).opacity,
    },
    header: { height: Math.round(nav.getBoundingClientRect().height), zIndex: navStyle.zIndex, background: navStyle.backgroundColor, position: navStyle.position },
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
})()`;

async function checkAnchors(cdp) {
  return evaluate(cdp, `(async () => {
    const result = [];
    const headerBottom = document.querySelector('.qfc-nav').getBoundingClientRect().bottom;
    for (const anchor of document.querySelectorAll('.qfc-nav nav a')) {
      anchor.click();
      await new Promise((resolve) => setTimeout(resolve, 650));
      const target = document.querySelector(anchor.getAttribute('href'));
      const r = target.getBoundingClientRect();
      result.push({ href: anchor.getAttribute('href'), targetTop: Math.round(r.top), headerBottom: Math.round(headerBottom), visibleBelowHeader: r.top >= headerBottom - 1 });
    }
    scrollTo(0, 0);
    return result;
  })()`);
}

async function checkLinks(cdp) {
  return evaluate(cdp, `(async () => {
    const hrefs = [...new Set([...document.querySelectorAll('a[href]')].map((anchor) => anchor.href))];
    return Promise.all(hrefs.map(async (href) => {
      if (href.startsWith('mailto:')) return { href, status: 'mailto', ok: true };
      try {
        const response = await fetch(href);
        return { href, status: response.status, ok: response.ok };
      } catch (error) {
        return { href, status: String(error), ok: false };
      }
    }));
  })()`);
}

async function captureRegion(cdp, name, selector, width) {
  const box = await evaluate(cdp, `(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top + scrollY), width: ${width}, height: Math.min(5200, Math.ceil(r.height)) }; })()`);
  await screenshot(cdp, name, false, { ...box, scale: 1 });
}

async function run({ width, height, reduced, port }) {
  const { chrome, target } = await launch(port);
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  const issues = observeProblems(cdp);
  try {
    await cdp.open();
    await setup(cdp, width, height, reduced);
    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: URL });
    await loaded;
    await sleep(60);
    const firstLoad = await evaluate(cdp, metricsExpression);
    if (!reduced) await screenshot(cdp, `case02-${width}-hero-first-load.png`);
    const anchors = await checkAnchors(cdp);
    await revealPage(cdp, height);
    const appendix = await evaluate(cdp, `(() => { const node = document.querySelector('.qfc-appendix'); node.open = true; return true; })()`);
    if (appendix) {
      await revealPage(cdp, height);
      if (width === 1440 && !reduced) {
        await captureRegion(cdp, "case02-1440-appendix-open.png", ".qfc-appendix", width);
      }
      await evaluate(cdp, "document.querySelector('.qfc-appendix').open = false; scrollTo(0, 0)");
      await sleep(350);
    }
    const metrics = await evaluate(cdp, metricsExpression);
    const links = await checkLinks(cdp);
    await screenshot(cdp, `case02-${width}${reduced ? "-reduced" : ""}-full.png`, true);
    if (width === 1440 && !reduced) {
      await captureRegion(cdp, "case02-1440-journey.png", "#journey", width);
      await captureRegion(cdp, "case02-1440-spatial.png", "#spatial", width);
      await captureRegion(cdp, "case02-1440-digital.png", "#digital", width);
      await captureRegion(cdp, "case02-1440-testing.png", "#testing", width);
    }
    if (width === 390 && !reduced) {
      await captureRegion(cdp, "case02-390-journey.png", "#journey", width);
      await captureRegion(cdp, "case02-390-digital.png", "#digital", width);
      await captureRegion(cdp, "case02-390-testing.png", "#testing", width);
    }
    return { viewport: { width, height }, reduced, firstLoad, metrics, anchors, links, issues };
  } finally {
    cdp.close();
    chrome.kill();
  }
}

const desktop = await run({ width: 1440, height: 900, reduced: false, port: 11421 });
const mobile = await run({ width: 390, height: 844, reduced: false, port: 11422 });
const reduced = await run({ width: 390, height: 844, reduced: true, port: 11423 });
const report = { desktop, mobile, reduced, generatedAt: new Date().toISOString() };
await writeFile(path.join(OUT, "qa-results.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  desktop: { overflow: desktop.metrics.overflow, imageFailures: desktop.metrics.imageFailures.length, hiddenMotion: desktop.metrics.hiddenMotion.length, js: desktop.issues.js.length + desktop.issues.consoleErrors.length, notFound: desktop.issues.notFound.length },
  mobile: { overflow: mobile.metrics.overflow, imageFailures: mobile.metrics.imageFailures.length, hiddenMotion: mobile.metrics.hiddenMotion.length, js: mobile.issues.js.length + mobile.issues.consoleErrors.length, notFound: mobile.issues.notFound.length },
  reduced: { overflow: reduced.metrics.overflow, imageFailures: reduced.metrics.imageFailures.length, hiddenMotion: reduced.metrics.hiddenMotion.length, js: reduced.issues.js.length + reduced.issues.consoleErrors.length, notFound: reduced.issues.notFound.length },
}, null, 2));
