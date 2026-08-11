import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4174";
const URL = `${BASE}/cases/quiet-fitness-cabin.html`;
const OUT = path.resolve("visual-audit-v2-round2-2-case02-fix");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Cdp {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); this.events = new Map(); }
  async open() {
    await new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve, { once: true }); this.ws.addEventListener("error", reject, { once: true }); });
    this.ws.addEventListener("message", ({ data }) => { const message = JSON.parse(data); if (message.id) { const pending = this.pending.get(message.id); if (!pending) return; this.pending.delete(message.id); clearTimeout(pending.timer); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); return; } for (const listener of this.events.get(message.method) || []) listener(message.params); });
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 20000); this.pending.set(id, { resolve, reject, timer }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, listener) { this.events.set(method, [...(this.events.get(method) || []), listener]); }
  once(method) { return new Promise((resolve) => { const listener = (params) => { this.events.set(method, (this.events.get(method) || []).filter((item) => item !== listener)); resolve(params); }; this.on(method, listener); }); }
  close() { this.ws.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), `case02-appendix-${port}-`));
  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  for (let i = 0; i < 70; i += 1) { try { const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const target = targets.find((item) => item.type === "page"); if (target) return { chrome, target }; } catch {} await sleep(100); }
  chrome.kill(); throw new Error("Chrome unavailable");
}

async function evaluate(cdp, expression) { const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime error"); return result.result.value; }
async function screenshot(cdp, name, clip) { const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true, clip: { ...clip, scale: 1 } }); await writeFile(path.join(OUT, name), Buffer.from(result.data, "base64")); }

async function run(width, height) {
  const { chrome, target } = await launch(width === 1440 ? 11431 : 11432);
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  const issues = { js: [], images: [], notFound: [] };
  cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => issues.js.push(exceptionDetails.text || "runtime error"));
  cdp.on("Runtime.consoleAPICalled", ({ type }) => { if (type === "error" || type === "assert") issues.js.push("console error"); });
  cdp.on("Network.responseReceived", ({ response }) => { if (response.status === 404) issues.notFound.push(response.url); });
  cdp.on("Network.loadingFailed", ({ type, errorText }) => { if (type === "Image") issues.images.push(errorText); });
  try {
    await cdp.open();
    await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Network.enable"), cdp.send("Emulation.setDeviceMetricsOverride", { width, height, mobile: width < 901, screenWidth: width, screenHeight: height, deviceScaleFactor: 1 })]);
    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: URL }); await loaded; await sleep(700);
    await evaluate(cdp, "document.querySelector('.qfc-appendix').open = true; scrollTo(0, document.querySelector('.qfc-appendix').getBoundingClientRect().top + scrollY - 100)");
    await sleep(1200);
    const data = await evaluate(cdp, `(() => { const appendix = document.querySelector('.qfc-appendix'); const r = appendix.getBoundingClientRect(); const iaFigure = [...appendix.querySelectorAll('figure')].find((figure) => figure.querySelector('figcaption')?.textContent.includes('Early information architecture')); const ia = iaFigure.querySelector('img'); const ir = ia.getBoundingClientRect(); const style = getComputedStyle(ia); const images = [...appendix.querySelectorAll('img')].map((img) => ({ src: img.currentSrc || img.src, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, renderedWidth: Math.round(img.getBoundingClientRect().width), renderedHeight: Math.round(img.getBoundingClientRect().height), objectFit: getComputedStyle(img).objectFit })); return { overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - document.documentElement.clientWidth), appendix: { top: Math.round(r.top + scrollY), height: Math.round(r.height) }, imageCount: images.length, images, earlyInformationArchitecture: { src: ia.currentSrc || ia.src, renderedContent: style.content, naturalWidth: ia.naturalWidth, naturalHeight: ia.naturalHeight, renderedWidth: Math.round(ir.width), renderedHeight: Math.round(ir.height), objectFit: style.objectFit, height: style.height, complete: ia.complete, rightEdge: Math.round(ir.right) }, links: [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.href))] }; })()`);
    const clip = await evaluate(cdp, "(() => { const r = document.querySelector('.qfc-appendix').getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top + scrollY), width: innerWidth, height: Math.min(8000, Math.ceil(r.height)) }; })()");
    await screenshot(cdp, `case02-${width}-appendix-fixed.png`, clip);
    data.links = await evaluate(cdp, `Promise.all(${JSON.stringify(data.links)}.map(async (href) => { try { const r = await fetch(href); return { href, status: r.status, ok: r.ok }; } catch (error) { return { href, status: String(error), ok: false }; } }))`);
    return { viewport: { width, height }, data, issues };
  } finally { cdp.close(); chrome.kill(); }
}

const server = spawn("python", ["-m", "http.server", "4174", "--bind", "127.0.0.1", "--directory", "dist"], { stdio: "ignore", windowsHide: true });
await sleep(700);
const report = { desktop: await run(1440, 900), mobile: await run(390, 844), generatedAt: new Date().toISOString() };
await writeFile(path.join(OUT, "appendix-qa-results.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
server.kill();
