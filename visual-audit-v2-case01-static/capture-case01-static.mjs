import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = "http://127.0.0.1:4173/cases/should-i-work-out-today.html";
const output = path.resolve("visual-audit-v2-case01-static");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Cdp {
  constructor(ws) { this.ws = new WebSocket(ws); this.id = 0; this.pending = new Map(); this.listeners = new Map(); }
  async open() {
    await new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve, { once: true }); this.ws.addEventListener("error", reject, { once: true }); });
    this.ws.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (message.id) { const item = this.pending.get(message.id); if (!item) return; this.pending.delete(message.id); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); return; } (this.listeners.get(message.method) || []).forEach((fn) => fn(message.params)); });
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 20000); this.pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  once(method) { return new Promise((resolve) => { this.listeners.set(method, [...(this.listeners.get(method) || []), resolve]); }); }
  close() { this.ws.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), "case01-static-"));
  const chrome = spawn(chromePath, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--remote-allow-origins=*", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  for (let i = 0; i < 60; i += 1) { try { const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const page = pages.find((item) => item.type === "page"); if (page) return { chrome, page }; } catch {} await sleep(100); }
  throw new Error("Chrome CDP target did not start");
}

async function value(cdp, expression) { const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
async function capture(cdp, file, clip) { const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, ...(clip ? { clip } : {}) }); await writeFile(path.join(output, file), Buffer.from(result.data, "base64")); }
async function clipFor(cdp, selector) { return value(cdp, `(() => { const e=document.querySelector(${JSON.stringify(selector)}); const r=e.getBoundingClientRect(); return { x:Math.max(0,r.left), y:r.top + scrollY, width:r.width, height:r.height, scale:1 }; })()`); }
async function setup(cdp, width, height, mobile) {
  await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Network.enable"), cdp.send("Log.enable"), cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile })]);
  const loaded = cdp.once("Page.loadEventFired"); await cdp.send("Page.navigate", { url }); await loaded; await sleep(700);
  const total = await value(cdp, "document.body.scrollHeight"); for (let y = 0; y < total; y += Math.max(500, height * .8)) { await value(cdp, `scrollTo(0,${y})`); await sleep(90); } await value(cdp, "scrollTo(0,0)"); await sleep(350);
}

await mkdir(output, { recursive: true });
const { chrome, page } = await launch(9248); const cdp = new Cdp(page.webSocketDebuggerUrl); await cdp.open();
const errors = []; const failed = [];
cdp.listeners.set("Runtime.exceptionThrown", [(event) => errors.push(event.exceptionDetails?.text || "runtime exception")]);
cdp.listeners.set("Network.loadingFailed", [(event) => failed.push(event.errorText || "network failure")]);
await setup(cdp, 1440, 960, false);
await capture(cdp, "case01-v2-desktop-full.png");
for (const [file, selector] of [["case01-v2-hero.png", ".case-hero"], ["case01-v2-system.png", "#system"], ["case01-v2-critical-decisions.png", "#decisions"], ["case01-v2-core-experience.png", "#experience"], ["case01-v2-testing.png", "#testing"]]) await capture(cdp, file, await clipFor(cdp, selector));
const desktop = await value(cdp, "({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.body.scrollHeight,closed:!document.querySelector('.appendix').open,images:[...document.images].filter(i=>i.currentSrc&&i.naturalWidth===0).map(i=>i.currentSrc),v14:[...document.images].filter(i=>i.currentSrc.includes('/v14/')).length})");
await setup(cdp, 390, 844, true); await capture(cdp, "case01-v2-mobile-full.png");
const mobile = await value(cdp, "({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.body.scrollHeight,closed:!document.querySelector('.appendix').open,images:[...document.images].filter(i=>i.currentSrc&&i.naturalWidth===0).map(i=>i.currentSrc),v14:[...document.images].filter(i=>i.currentSrc.includes('/v14/')).length})");
await writeFile(path.join(output, "audit-results.json"), JSON.stringify({ desktop, mobile, runtimeErrors: errors, networkFailures: failed }, null, 2));
console.log(JSON.stringify({ desktop, mobile, runtimeErrors: errors.length, networkFailures: failed.length }, null, 2));
cdp.close(); chrome.kill();
