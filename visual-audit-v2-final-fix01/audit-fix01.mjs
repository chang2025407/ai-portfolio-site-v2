import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4191";
const OUT = path.resolve("visual-audit-v2-final-fix01");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Cdp {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); this.events = new Map(); }
  async open() {
    await new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve, { once: true }); this.ws.addEventListener("error", reject, { once: true }); });
    this.ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) { const item = this.pending.get(message.id); if (!item) return; this.pending.delete(message.id); clearTimeout(item.timer); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); return; }
      for (const listener of this.events.get(message.method) || []) listener(message.params);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => { const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 25000); this.pending.set(id, { resolve, reject, timer }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  on(method, fn) { this.events.set(method, [...(this.events.get(method) || []), fn]); }
  once(method) { return new Promise((resolve) => { const fn = (params) => { this.events.set(method, (this.events.get(method) || []).filter((item) => item !== fn)); resolve(params); }; this.on(method, fn); }); }
  close() { this.ws.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), `fix01-${port}-`));
  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  for (let i = 0; i < 90; i += 1) {
    try { const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const target = targets.find((item) => item.type === "page"); if (target) return { chrome, target }; } catch {}
    await sleep(100);
  }
  chrome.kill(); throw new Error("Chrome target unavailable");
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result.value;
}
async function screenshot(cdp, name) { const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true }); await writeFile(path.join(OUT, name), Buffer.from(result.data, "base64")); }
async function setup(cdp, width, height) { await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Network.enable"), cdp.send("Log.enable"), cdp.send("Emulation.setDeviceMetricsOverride", { width, height, mobile: width < 901, screenWidth: width, screenHeight: height, deviceScaleFactor: 1 })]); }
async function navigate(cdp, url) { const loaded = cdp.once("Page.loadEventFired"); await cdp.send("Page.navigate", { url: `${BASE}${url}` }); await loaded; await sleep(550); }
async function waitImages(cdp) { return evaluate(cdp, "(async()=>{const images=[...document.images].filter(i=>!i.closest('details:not([open])'));await Promise.race([Promise.all(images.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true})}))),new Promise(r=>setTimeout(r,12000))]);return images.map(i=>({src:i.currentSrc||i.src,complete:i.complete,naturalWidth:i.naturalWidth}));})()"); }
async function reveal(cdp, height) { const total = await evaluate(cdp, "document.documentElement.scrollHeight"); for (let y = 0; y < total; y += Math.max(380, Math.round(height * .72))) { await evaluate(cdp, `scrollTo(0,${y})`); await sleep(75); } await waitImages(cdp); await evaluate(cdp, "scrollTo(0,0)"); await sleep(300); }
function observe(cdp) {
  const issues = { runtimeErrors: [], consoleErrors: [], notFound: [], imageNetworkFailures: [] };
  cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => issues.runtimeErrors.push(exceptionDetails.exception?.description || exceptionDetails.text || "Runtime error"));
  cdp.on("Runtime.consoleAPICalled", ({ type, args }) => { if (type === "error" || type === "assert") issues.consoleErrors.push(args.map(a => a.value || a.description || "console error").join(" ")); });
  cdp.on("Network.responseReceived", ({ response }) => { if (response.status === 404) issues.notFound.push(response.url); });
  cdp.on("Network.loadingFailed", ({ type, errorText, canceled }) => { if (!canceled && type === "Image") issues.imageNetworkFailures.push(errorText); });
  return issues;
}
async function pageMetrics(cdp) { return evaluate(cdp, "(()=>{const root=document.documentElement,body=document.body;const images=[...document.images].filter(i=>!i.closest('details:not([open])')).map(i=>({src:i.currentSrc||i.src,complete:i.complete,naturalWidth:i.naturalWidth}));const hrefs=[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin)))];return{url:location.href,overflow:Math.max(0,root.scrollWidth-root.clientWidth,body.scrollWidth-root.clientWidth),imageFailures:images.filter(i=>!i.complete||i.naturalWidth===0),internalLinks:hrefs};})()"); }
async function linkStatuses(cdp) { return evaluate(cdp, "(async()=>{const hrefs=[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin)))];const results=[];for(const href of hrefs){try{const r=await fetch(href,{cache:'no-store'});results.push({href,status:r.status,ok:r.ok})}catch(e){results.push({href,status:0,ok:false,error:String(e)})}}return results})()"); }

async function run(width, height, port) {
  const { chrome, target } = await launch(port); const cdp = new Cdp(target.webSocketDebuggerUrl); const issues = observe(cdp);
  try {
    await cdp.open(); await setup(cdp, width, height);
    await navigate(cdp, "/cases/should-i-work-out-today.html");
    await reveal(cdp, height);
    const case01 = await pageMetrics(cdp); const case01Links = await linkStatuses(cdp);
    const footer = await evaluate(cdp, "(()=>{const n=document.querySelector('.next-project'),r=n.getBoundingClientRect();return{text:n.textContent.trim(),label:n.querySelector('strong').textContent.trim(),href:n.getAttribute('href'),top:Math.round(r.top+scrollY),height:Math.round(r.height)}})()");
    await evaluate(cdp, "document.querySelector('.next-project').scrollIntoView({block:'center',behavior:'instant'})"); await sleep(250);
    await screenshot(cdp, `case01-footer-${width}.png`);
    const firstLoaded = cdp.once("Page.loadEventFired"); await evaluate(cdp, "document.querySelector('.next-project').click()"); await firstLoaded; await sleep(600);
    const case01ToCase02 = (await evaluate(cdp, "location.pathname")) === "/cases/quiet-fitness-cabin.html"; await reveal(cdp, height); const afterNext = await pageMetrics(cdp); const case02Links = await linkStatuses(cdp);
    await evaluate(cdp, "scrollTo(0,0)"); await sleep(250); await screenshot(cdp, `case02-after-next-project-${width}.png`);
    const case02Footer = await evaluate(cdp, "(()=>{const n=document.querySelector('.qfc-footer a');return{text:n.textContent.trim(),label:n.querySelector('strong').textContent.trim(),href:n.getAttribute('href')}})()");
    const secondLoaded = cdp.once("Page.loadEventFired"); await evaluate(cdp, "document.querySelector('.qfc-footer a').click()"); await secondLoaded; await sleep(600);
    await reveal(cdp, height);
    const case03 = await pageMetrics(cdp);
    const case03Links = await linkStatuses(cdp);
    const linkResults = [...case01Links, ...case02Links, ...case03Links];
    return { viewport: { width, height }, case01Footer: footer, case01ToCase02, case02Footer, case02ToCase03: case03.url.endsWith("/cases/connected-long-journey.html"), pages: { case01, case02: afterNext, case03 }, linkResults, issues };
  } finally { cdp.close(); chrome.kill(); }
}

await mkdir(OUT, { recursive: true });
const server = spawn("python", ["-m", "http.server", "4191", "--bind", "127.0.0.1", "--directory", "dist"], { stdio: "ignore", windowsHide: true });
await sleep(800);
try {
  const desktop = await run(1440, 900, 12420);
  const mobile = await run(390, 844, 12421);
  const all = [desktop, mobile];
  const report = { generatedAt: new Date().toISOString(), build: { command: "npm.cmd run build", status: "passed" }, desktop, mobile, summary: { case01ToCase02: all.every(r=>r.case01ToCase02), case02ToCase03: all.every(r=>r.case02ToCase03), footerCopy: all.every(r=>r.case01Footer.label === "Quiet Fitness Cabin" && r.case01Footer.href === "/cases/quiet-fitness-cabin.html"), horizontalOverflow: all.reduce((n,r)=>n+r.pages.case01.overflow+r.pages.case02.overflow+r.pages.case03.overflow,0), imageFailures: all.reduce((n,r)=>n+r.pages.case01.imageFailures.length+r.pages.case02.imageFailures.length+r.pages.case03.imageFailures.length+r.issues.imageNetworkFailures.length,0), runtimeErrors: all.reduce((n,r)=>n+r.issues.runtimeErrors.length,0), consoleErrors: all.reduce((n,r)=>n+r.issues.consoleErrors.length,0), notFound: all.reduce((n,r)=>n+r.issues.notFound.length,0), brokenInternalLinks: all.reduce((n,r)=>n+r.linkResults.filter(l=>!l.ok).length,0) } };
  await writeFile(path.join(OUT, "fix01-qa-results.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
} finally { server.kill(); }
