import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://127.0.0.1:5180/";
const OUTPUT = path.resolve("tmp/current-homepage-qa");
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

class CdpClient {
  constructor(url) { this.socket = new WebSocket(url); this.id = 0; this.pending = new Map(); this.listeners = new Map(); }
  async open() {
    await new Promise((resolve, reject) => { this.socket.addEventListener("open", resolve, { once: true }); this.socket.addEventListener("error", reject, { once: true }); });
    this.socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
        return;
      }
      for (const handler of this.listeners.get(message.method) || []) handler(message.params);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, handler) { this.listeners.set(method, [...(this.listeners.get(method) || []), handler]); }
  once(method) { return new Promise((resolve) => this.on(method, resolve)); }
  close() { this.socket.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), `homepage-qa-${port}-`));
  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const target = targets.find((item) => item.type === "page");
      if (target) return { chrome, target };
    } catch { /* Chrome is starting. */ }
    await sleep(100);
  }
  chrome.kill();
  throw new Error("Chrome debugging target unavailable");
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function screenshot(client, name, fullPage = false) {
  const image = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: fullPage });
  await writeFile(path.join(OUTPUT, name), Buffer.from(image.data, "base64"));
}

async function loadPage(client, width, height, mobile, reducedMotion = false) {
  await Promise.all([
    client.send("Page.enable"), client.send("Runtime.enable"), client.send("Network.enable"), client.send("Log.enable"),
    client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height }),
    client.send("Emulation.setEmulatedMedia", { media: "screen", features: reducedMotion ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] }),
  ]);
  const loaded = client.once("Page.loadEventFired");
  await client.send("Page.navigate", { url: BASE_URL });
  await loaded;
  await sleep(reducedMotion ? 120 : 1200);
}

async function revealLazyImages(client) {
  const { height, total } = await evaluate(client, "({height:innerHeight,total:document.body.scrollHeight})");
  for (let y = 0; y < total; y += Math.max(360, height * 0.8)) {
    await evaluate(client, `window.scrollTo(0,${Math.round(y)})`);
    await sleep(80);
  }
  await sleep(250);
}

function browserIssues(client, issues) {
  client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => issues.js.push(exceptionDetails.text || "Runtime exception"));
  client.on("Runtime.consoleAPICalled", ({ type, args }) => {
    if (type === "error" || type === "assert") issues.js.push(args.map((arg) => arg.value || arg.description || "console error").join(" "));
  });
  client.on("Network.responseReceived", ({ response, type }) => { if (response.status === 404) issues.notFound.push({ url: response.url, type }); });
  client.on("Network.loadingFailed", ({ type, errorText }) => { if (type === "Image") issues.images.push(errorText); });
}

async function linkChecks(client) {
  const hrefs = await evaluate(client, "[...new Set([...document.querySelectorAll('.home-v2 a[href]')].map((link) => link.href))]");
  return Promise.all(hrefs.map(async (href) => {
    if (href.startsWith("mailto:")) return { href, status: "mailto", ok: true };
    const response = await fetch(href, { signal: AbortSignal.timeout(5000) });
    return { href, status: response.status, ok: response.ok };
  }));
}

async function runViewport({ name, width, height, mobile, port }) {
  const { chrome, target } = await launch(port);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  const issues = { js: [], images: [], notFound: [] };
  try {
    await client.open(); browserIssues(client, issues); await loadPage(client, width, height, mobile);
    await screenshot(client, `${name}-hero.png`);
    await revealLazyImages(client);
    const firstProjectY = await evaluate(client, "Math.max(0,document.querySelector('.project-chapter').getBoundingClientRect().top+scrollY-72)");
    await evaluate(client, `window.scrollTo(0,${Math.round(firstProjectY)})`); await sleep(650);
    await screenshot(client, `${name}-projects.png`);
    const pageState = await evaluate(client, `(() => ({
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth, document.body.scrollWidth - document.documentElement.clientWidth),
      imageFailures: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
      motifWidth: Math.round(document.querySelector('.hero-v4-visual')?.getBoundingClientRect().width || 0),
      heroWidth: Math.round(document.querySelector('.home-hero').getBoundingClientRect().width),
      indices: [...document.querySelectorAll('.chapter-index')].map((node) => { const index=node.getBoundingClientRect(); const image=node.parentElement.querySelector('.project-visual').getBoundingClientRect(); return { id:node.textContent.trim(), x:Math.round(index.left-image.left), y:Math.round(index.top-image.top) }; })
    }))()`);
    await evaluate(client, "window.scrollTo(0,0)"); await sleep(100);
    await screenshot(client, `${name}-full.png`, true);
    let menu = null;
    if (mobile) {
      await evaluate(client, "document.querySelector('.menu-button').click()"); await sleep(250);
      menu = await evaluate(client, `(() => { const button=document.querySelector('.menu-button'); const nav=document.querySelector('.mobile-nav'); return { expanded:button.getAttribute('aria-expanded'), hidden:nav.getAttribute('aria-hidden'), visible:getComputedStyle(nav).visibility, opacity:getComputedStyle(nav).opacity, overflow:Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth) }; })()`);
      await evaluate(client, "document.querySelector('.menu-button').click()");
    }
    return { ...pageState, menu, links: await linkChecks(client), issues };
  } finally { client.close(); chrome.kill(); }
}

async function runReducedMotion() {
  const { chrome, target } = await launch(9473);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  try {
    await client.open(); await loadPage(client, 1440, 900, false, true);
    await screenshot(client, "1440-reduced-motion.png");
    return { emulated: "prefers-reduced-motion: reduce", screenshot: "1440-reduced-motion.png" };
  } finally { client.close(); chrome.kill(); }
}

const desktop = await runViewport({ name: "1440", width: 1440, height: 900, mobile: false, port: 9471 });
const mobile = await runViewport({ name: "390", width: 390, height: 844, mobile: true, port: 9472 });
const reducedMotion = await runReducedMotion();
await writeFile(path.join(OUTPUT, "qa-results.json"), `${JSON.stringify({ desktop, mobile, reducedMotion }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ desktop, mobile, reducedMotion }, null, 2)}\n`);
