import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://127.0.0.1:4173/cases/should-i-work-out-today.html";
const OUT = path.resolve("visual-audit-v2-case01-motion");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Cdp {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); this.listeners = new Map(); }
  async open() { await new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve, { once: true }); this.ws.addEventListener("error", reject, { once: true }); }); this.ws.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (message.id) { const pending = this.pending.get(message.id); if (!pending) return; this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); return; } (this.listeners.get(message.method) || []).forEach((listener) => listener(message.params)); }); }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 20000); this.pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  once(method) { return new Promise((resolve) => this.listeners.set(method, [...(this.listeners.get(method) || []), resolve])); }
  close() { this.ws.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), "case01-motion-"));
  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--remote-allow-origins=*", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  for (let attempt = 0; attempt < 60; attempt += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const page = pages.find((item) => item.type === "page"); if (page) return { chrome, page }; } catch {} await sleep(100); }
  throw new Error("Chrome target unavailable");
}
async function evaluate(client, expression) { const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
async function setup(client, width, height, mobile, reduced = false) {
  await Promise.all([client.send("Page.enable"), client.send("Runtime.enable"), client.send("Network.enable"), client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile }), client.send("Emulation.setEmulatedMedia", { media: "screen", features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] })]);
  const loaded = client.once("Page.loadEventFired"); await client.send("Page.navigate", { url: URL }); await loaded; await sleep(45);
}
const summary = () => `(() => { const motion=[...document.querySelectorAll('.case-motion-item')]; const finalTransform=(e)=>['none','matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(e).transform); return { overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth), bodyOverflow:Math.max(0,document.body.scrollWidth-innerWidth), total:motion.length, hidden:motion.filter((e)=>!e.classList.contains('is-visible')).length, visuallyHidden:motion.filter((e)=>getComputedStyle(e).opacity !== '1' || !finalTransform(e)).length, images:[...document.images].filter((image)=>image.currentSrc && image.naturalWidth===0).map((image)=>image.currentSrc), appendixOpen:document.querySelector('.appendix').open, v14:[...document.images].filter((image)=>image.currentSrc.includes('/v14/')).length }; })()`;

async function runViewport({ width, height, mobile }) {
  const { chrome, page } = await launch(mobile ? 9263 : 9262); const client = new Cdp(page.webSocketDebuggerUrl); const errors = []; const failures = [];
  try {
    await client.open(); client.listeners.set("Runtime.exceptionThrown", [(event) => errors.push(event.exceptionDetails?.text || "runtime exception")]); client.listeners.set("Network.loadingFailed", [(event) => failures.push(event.errorText || "network failure")]);
    await setup(client, width, height, mobile);
    const initial = await evaluate(client, `(() => { const title=document.querySelector('.case-hero h1'); return { root:document.documentElement.className, titleOpacity:getComputedStyle(title).opacity, titleTransform:getComputedStyle(title).transform, duration:getComputedStyle(title).transitionDuration, ease:getComputedStyle(title).transitionTimingFunction }; })()`);
    await sleep(mobile ? 760 : 1150);
    const heroFinal = await evaluate(client, `(() => { const title=document.querySelector('.case-hero h1'); const visual=document.querySelector('.case-hero-visual'); return { titleOpacity:getComputedStyle(title).opacity, titleTransform:getComputedStyle(title).transform, visualOpacity:getComputedStyle(visual).opacity, visualTransform:getComputedStyle(visual).transform }; })()`);
    const total = await evaluate(client, "document.body.scrollHeight"); for (let y = 0; y < total; y += Math.max(450, height * .7)) { await evaluate(client, `scrollTo(0,${y})`); await sleep(120); } await sleep(700);
    const normalScroll = await evaluate(client, summary());
    const once = await evaluate(client, `(() => { const target=document.querySelector('#experience .experience-phase'); const before=target.querySelector('header').classList.contains('is-visible'); scrollTo(0,0); scrollTo(0,target.offsetTop-40); return { retainedBeforeRevisit:before, retainedAfterRevisit:target.querySelector('header').classList.contains('is-visible') }; })()`);
    await setup(client, width, height, mobile); await evaluate(client, "scrollTo(0,document.body.scrollHeight)"); await sleep(900); const fastScroll = await evaluate(client, summary());
    const appendix = await evaluate(client, `(() => { const appendix=document.querySelector('.appendix'); const summary=appendix.querySelector('summary'); const before=appendix.open; summary.click(); summary.focus(); return { before, after:appendix.open, summaryFocused:document.activeElement===summary, summaryOutline:getComputedStyle(summary).outline }; })()`);
    const anchors = await evaluate(client, `(() => ({ links:[...document.querySelectorAll('.case-nav-links a')].map((link)=>({hash:new URL(link.href).hash,target:Boolean(document.querySelector(new URL(link.href).hash))})), back:document.querySelector('.case-hero .back-link').getAttribute('href') }))()`);
    return { initial, heroFinal, normalScroll, fastScroll, once, appendix, anchors, runtimeErrors:errors, networkFailures:failures };
  } finally { client.close(); chrome.kill(); }
}
async function runReduced() {
  const { chrome, page } = await launch(9264); const client = new Cdp(page.webSocketDebuggerUrl); const errors = [];
  try { await client.open(); client.listeners.set("Runtime.exceptionThrown", [(event) => errors.push(event.exceptionDetails?.text || "runtime exception")]); await setup(client, 1440, 960, false, true); await sleep(80); return await evaluate(client, `(() => { const motion=[...document.querySelectorAll('.case-motion-item')]; return { media:matchMedia('(prefers-reduced-motion: reduce)').matches, scrollBehavior:getComputedStyle(document.documentElement).scrollBehavior, hidden:motion.filter((e)=>getComputedStyle(e).opacity !== '1').length, transformed:motion.filter((e)=>getComputedStyle(e).transform !== 'none').length, appendixWorks:typeof document.querySelector('.appendix').open === 'boolean', runtimeErrors:${JSON.stringify(errors)} }; })()`); } finally { client.close(); chrome.kill(); }
}

await mkdir(OUT, { recursive: true });
const report = {
  previewUrl: URL,
  recording: { available: false, reason: "Playwright/Puppeteer and FFmpeg/WebM encoding are not installed in this environment; no video was fabricated." },
  observer: { threshold: 0.15, rootMargin: "0px 0px -8% 0px", once: true, fastScrollCatchup: true },
  motion: { tokens: { fast: "180ms", base: "420ms", slow: "620ms", easing: "cubic-bezier(.22,.8,.2,1)" }, hero: "six staggered groups, 0–400ms delay", decisionProblem: "heading/content then principles at 70ms steps", system: "per-step copy then image at 80ms", criticalDecisions: "per-block heading, UI, evidence", coreExperience: "per-phase header then two screens at 90ms", testing: "reading blocks and evidence at 70ms steps" },
  desktop: await runViewport({ width: 1440, height: 960, mobile: false }),
  mobile: await runViewport({ width: 390, height: 844, mobile: true }),
  reducedMotion: await runReduced(),
};
await writeFile(path.join(OUT, "case01-motion-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
