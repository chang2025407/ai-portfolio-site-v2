import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://127.0.0.1:4173/";
const OUTPUT_ROOT = path.resolve("visual-audit-v2-microinteraction");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CdpClient {
  constructor(url) { this.socket = new WebSocket(url); this.nextId = 1; this.pending = new Map(); this.listeners = new Map(); }
  async open() {
    await new Promise((resolve, reject) => { this.socket.addEventListener("open", resolve, { once: true }); this.socket.addEventListener("error", reject, { once: true }); });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
        return;
      }
      (this.listeners.get(message.method) || []).forEach((handler) => handler(message.params));
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      this.pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, handler) { this.listeners.set(method, [...(this.listeners.get(method) || []), handler]); }
  once(method) { return new Promise((resolve) => this.on(method, resolve)); }
  close() { this.socket.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), `microinteraction-${port}-`));
  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  let target;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      target = (await response.json()).find((item) => item.type === "page");
      if (target) break;
    } catch { /* Chrome is still starting. */ }
    await sleep(100);
  }
  if (!target) throw new Error(`Chrome target unavailable on ${port}`);
  return { chrome, target };
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function screenshot(client, file) {
  const result = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  await writeFile(file, Buffer.from(result.data, "base64"));
}

async function nodeId(client, selector) {
  const document = await client.send("DOM.getDocument", { depth: 1 });
  return (await client.send("DOM.querySelector", { nodeId: document.root.nodeId, selector })).nodeId;
}

async function forcePseudo(client, selector, forcedPseudoClasses) {
  const id = await nodeId(client, selector);
  await client.send("CSS.forcePseudoState", { nodeId: id, forcedPseudoClasses });
  return id;
}

async function hover(client, selector) {
  const point = await evaluate(client, `(() => { const rect=document.querySelector('${selector}').getBoundingClientRect(); return { x:rect.left+rect.width/2, y:rect.top+rect.height/2 }; })()`);
  await client.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
}

async function loadLazyImages(client) {
  const metrics = await evaluate(client, "({ height: innerHeight, total: document.body.scrollHeight })");
  for (let y = 0; y < metrics.total; y += Math.max(320, metrics.height * 0.8)) {
    await evaluate(client, `window.scrollTo(0, ${Math.round(y)})`);
    await sleep(90);
  }
  await evaluate(client, "window.scrollTo(0, document.body.scrollHeight)");
  await sleep(500);
}

async function setup(client, width, height, mobile, reduced = false) {
  await Promise.all([
    client.send("Page.enable"), client.send("Runtime.enable"), client.send("Network.enable"), client.send("Log.enable"), client.send("DOM.enable"), client.send("CSS.enable"),
    client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile }),
    client.send("Emulation.setEmulatedMedia", { media: "screen", features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] }),
  ]);
  const loaded = client.once("Page.loadEventFired");
  await client.send("Page.navigate", { url: BASE_URL });
  await loaded;
  await sleep(300);
}

async function commonChecks(client) {
  const links = await evaluate(client, "[...document.querySelectorAll('.project-chapter .case-entry')].map((a) => a.href)");
  const linkChecks = [];
  for (const url of links) { const response = await fetch(url); linkChecks.push({ url, status: response.status, ok: response.ok }); }
  const resume = new URL("/chang-li-cv.pdf", BASE_URL).href;
  const resumeResponse = await fetch(resume);
  return { linkChecks, resume: { url: resume, status: resumeResponse.status, ok: resumeResponse.ok }, mailto: await evaluate(client, "document.querySelector('.contact-actions .solid-link').href") };
}

async function runDesktop() {
  const directory = path.join(OUTPUT_ROOT, "desktop"); await mkdir(directory, { recursive: true });
  const { chrome, target } = await launch(9343); const client = new CdpClient(target.webSocketDebuggerUrl); const jsErrors = []; const imageFailures = [];
  try {
    await client.open();
    client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => jsErrors.push(exceptionDetails.text));
    client.on("Runtime.consoleAPICalled", ({ type, args }) => { if (type === "error" || type === "assert") jsErrors.push(args.map((arg) => arg.value || arg.description).join(" ")); });
    client.on("Network.loadingFailed", (event) => { if (event.type === "Image") imageFailures.push(event.errorText); });
    await setup(client, 1440, 900, false);
    await hover(client, ".home-nav a");
    await sleep(240);
    const navHover = await evaluate(client, `(() => { const nav=document.querySelector('.home-nav a'); return { color:getComputedStyle(nav).color, underline:getComputedStyle(nav,'::after').transform }; })()`);
    await hover(client, ".hero-actions .solid-link");
    await sleep(240);
    const ctaHover = await evaluate(client, `(() => { const cta=document.querySelector('.hero-actions .solid-link'); return { transform:getComputedStyle(cta).transform, filter:getComputedStyle(cta).filter }; })()`);
    await evaluate(client, "window.scrollTo(0, document.querySelector('[data-home-motion-project]').offsetTop - 180)");
    await sleep(500);
    await hover(client, ".project-visual");
    await sleep(450);
    await screenshot(client, path.join(directory, "microinteraction-desktop.png"));
    const styles = await evaluate(client, `(() => {
      const nav = document.querySelector('.home-nav a');
      const cta = document.querySelector('.hero-actions .solid-link');
      const visual = document.querySelector('.project-visual');
      const primary = visual.querySelector(':scope > img:first-of-type');
      const secondary = visual.querySelector('.secondary-visual');
      const caseLink = document.querySelector('.case-entry');
      return {
        ctaTransition: getComputedStyle(cta).transitionDuration,
        primaryImageTransform: getComputedStyle(primary).transform,
        secondaryImageTransform: getComputedStyle(secondary).transform,
        caseArrowTransform: getComputedStyle(caseLink.querySelector('svg')).transform,
        caseSignalLine: getComputedStyle(caseLink, '::after').transform,
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        bodyOverflow: Math.max(0, document.body.scrollWidth - document.documentElement.clientWidth),
        imageFailures: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
      };
    })()`);
    const focusStyles = [];
    for (const selector of [".home-nav a", ".hero-actions .solid-link", ".hero-actions .outline-link", ".case-entry", ".contact-actions .solid-link"]) {
      await forcePseudo(client, selector, ["focus-visible"]);
      focusStyles.push({ selector, outline: await evaluate(client, `getComputedStyle(document.querySelector('${selector}')).outline`) });
    }
    await evaluate(client, "window.scrollTo(0, document.body.scrollHeight)"); await sleep(100);
    await hover(client, ".contact-actions .solid-link"); await sleep(240);
    const footerStyle = await evaluate(client, "({ filter:getComputedStyle(document.querySelector('.contact-actions .solid-link')).filter, transform:getComputedStyle(document.querySelector('.contact-actions .solid-link')).transform })");
    return { styles: { navHover, ctaHover, ...styles }, focusStyles, footerStyle, jsErrors, imageFailures, ...(await commonChecks(client)) };
  } finally { client.close(); chrome.kill(); }
}

async function runMobile() {
  const directory = path.join(OUTPUT_ROOT, "mobile"); await mkdir(directory, { recursive: true });
  const { chrome, target } = await launch(9344); const client = new CdpClient(target.webSocketDebuggerUrl); const jsErrors = []; const imageFailures = [];
  try {
    await client.open();
    client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => jsErrors.push(exceptionDetails.text));
    client.on("Runtime.consoleAPICalled", ({ type, args }) => { if (type === "error" || type === "assert") jsErrors.push(args.map((arg) => arg.value || arg.description).join(" ")); });
    client.on("Network.loadingFailed", (event) => { if (event.type === "Image") imageFailures.push(event.errorText); });
    await setup(client, 390, 844, true);
    await evaluate(client, "document.querySelector('.menu-button').click()");
    await sleep(240);
    await screenshot(client, path.join(directory, "mobile-menu-open.png"));
    const openState = await evaluate(client, `(() => { const button=document.querySelector('.menu-button'); const nav=document.querySelector('.mobile-nav'); return { ariaExpanded:button.getAttribute('aria-expanded'), ariaHidden:nav.getAttribute('aria-hidden'), opacity:getComputedStyle(nav).opacity, transform:getComputedStyle(nav).transform, overflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth), bodyOverflow:Math.max(0,document.body.scrollWidth-document.documentElement.clientWidth) }; })()`);
    await evaluate(client, "document.querySelector('.mobile-nav a').click()"); await sleep(50);
    const closedAfterLink = await evaluate(client, "({ expanded: document.querySelector('.menu-button').getAttribute('aria-expanded'), hidden: document.querySelector('.mobile-nav').getAttribute('aria-hidden') })");
    await evaluate(client, "document.querySelector('.menu-button').click()"); await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }); await sleep(40);
    const closedAfterEscape = await evaluate(client, "document.querySelector('.menu-button').getAttribute('aria-expanded')");
    await forcePseudo(client, ".project-visual", ["hover"]);
    await forcePseudo(client, ".hero-actions .solid-link", ["active"]);
    await sleep(100);
    await loadLazyImages(client);
    const mobileStyles = await evaluate(client, `(() => { const image=document.querySelector('.project-visual > img:first-of-type'); const cta=document.querySelector('.hero-actions .solid-link'); return { imageTransform:getComputedStyle(image).transform, ctaTransform:getComputedStyle(cta).transform, imageFailures:[...document.images].filter((image)=>!image.complete||image.naturalWidth===0).map((image)=>image.currentSrc||image.src), overflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth), bodyOverflow:Math.max(0,document.body.scrollWidth-document.documentElement.clientWidth) }; })()`);
    return { openState, closedAfterLink, closedAfterEscape, mobileStyles, jsErrors, imageFailures, ...(await commonChecks(client)) };
  } finally { client.close(); chrome.kill(); }
}

async function runFocusAndReduced() {
  const directory = path.join(OUTPUT_ROOT, "reduced-motion"); await mkdir(directory, { recursive: true });
  const { chrome, target } = await launch(9345); const client = new CdpClient(target.webSocketDebuggerUrl);
  try {
    await client.open(); await setup(client, 1440, 900, false, true);
    await forcePseudo(client, ".home-nav a", ["focus-visible"]); await forcePseudo(client, ".hero-actions .solid-link", ["focus-visible"]); await forcePseudo(client, ".hero-actions .outline-link", ["focus-visible"]); await sleep(40);
    await screenshot(client, path.join(OUTPUT_ROOT, "focus-states.png"));
    await evaluate(client, "document.querySelector('.menu-button').click()");
    await loadLazyImages(client);
    const result = await evaluate(client, `(() => {
      const root=document.querySelector('.home-v2'); const title=getComputedStyle(document.querySelector('.hero-title-group')); const image=document.querySelector('.project-visual > img:first-of-type'); const caseLink=document.querySelector('.case-entry'); const nav=document.querySelector('.mobile-nav');
      return { mediaMatches:matchMedia('(prefers-reduced-motion: reduce)').matches, rootClasses:root.className, titleTransform:title.transform, ctaTransform:getComputedStyle(document.querySelector('.hero-actions .solid-link')).transform, imageTransform:getComputedStyle(image).transform, caseArrowTransform:getComputedStyle(caseLink.querySelector('svg')).transform, menuTransform:getComputedStyle(nav).transform, menuOpacity:getComputedStyle(nav).opacity, htmlScrollBehavior:getComputedStyle(document.documentElement).scrollBehavior, imageFailures:[...document.images].filter((image)=>!image.complete||image.naturalWidth===0).length, overflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth) };
    })()`);
    return result;
  } finally { client.close(); chrome.kill(); }
}

await mkdir(OUTPUT_ROOT, { recursive: true });
const report = { generatedAt:new Date().toISOString(), previewUrl:BASE_URL, videoFallbackReason:"No Playwright/Puppeteer recorder or FFmpeg/WebM encoder is available; requested evidence is provided as browser-captured PNG states.", desktop:await runDesktop(), mobile:await runMobile(), reducedMotion:await runFocusAndReduced() };
await writeFile(path.join(OUTPUT_ROOT, "audit-results.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
