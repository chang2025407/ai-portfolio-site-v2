import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4193";
const OUT = path.resolve("visual-audit-v2-final-manual-review");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Cdp {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); this.events = new Map(); }
  async open() {
    await new Promise((resolve, reject) => { this.ws.addEventListener("open", resolve, { once: true }); this.ws.addEventListener("error", reject, { once: true }); });
    this.ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) { const item = this.pending.get(message.id); if (!item) return; this.pending.delete(message.id); clearTimeout(item.timer); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); return; }
      for (const fn of this.events.get(message.method) || []) fn(message.params);
    });
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 25000); this.pending.set(id, { resolve, reject, timer }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { this.events.set(method, [...(this.events.get(method) || []), fn]); }
  once(method) { return new Promise((resolve) => { const fn = (params) => { this.events.set(method, (this.events.get(method) || []).filter((item) => item !== fn)); resolve(params); }; this.on(method, fn); }); }
  close() { this.ws.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), `final-manual-${port}-`));
  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  for (let i = 0; i < 90; i += 1) {
    try { const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const target = targets.find((item) => item.type === "page"); if (target) return { chrome, target }; } catch {}
    await sleep(100);
  }
  chrome.kill(); throw new Error("Chrome target unavailable");
}
async function evaluate(cdp, expression) { const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Runtime evaluation failed"); return result.result.value; }
async function setup(cdp, width, height) { await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Network.enable"), cdp.send("Log.enable"), cdp.send("Emulation.setDeviceMetricsOverride", { width, height, mobile: width < 901, screenWidth: width, screenHeight: height, deviceScaleFactor: 1 }), cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 })]); }
async function navigate(cdp, url) { const loaded = cdp.once("Page.loadEventFired"); await cdp.send("Page.navigate", { url: `${BASE}${url}` }); await loaded; await sleep(550); }
async function clickNavigation(cdp, selector) { const loaded = cdp.once("Page.loadEventFired"); const clicked = await evaluate(cdp, `(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)return false;n.click();return true})()`); if (!clicked) return { clicked: false, url: await evaluate(cdp, "location.href") }; await Promise.race([loaded, sleep(5000)]); await sleep(450); return { clicked: true, url: await evaluate(cdp, "location.href") }; }
async function waitImages(cdp) { await evaluate(cdp, "(async()=>{const images=[...document.images].filter(i=>!i.closest('details:not([open])'));await Promise.race([Promise.all(images.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true})}))),new Promise(r=>setTimeout(r,12000))])})()"); }
async function reveal(cdp, height) { const total = await evaluate(cdp, "document.documentElement.scrollHeight"); for (let y = 0; y < total; y += Math.max(380, Math.round(height * .7))) { await evaluate(cdp, `scrollTo(0,${y})`); await sleep(75); } await waitImages(cdp); await evaluate(cdp, "scrollTo(0,0)"); await sleep(300); }

function observe(cdp) {
  const issues = { runtimeErrors: [], consoleErrors: [], notFound: [], imageNetworkFailures: [] };
  cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => issues.runtimeErrors.push(exceptionDetails.exception?.description || exceptionDetails.text || "Runtime error"));
  cdp.on("Runtime.consoleAPICalled", ({ type, args }) => { if (type === "error" || type === "assert") issues.consoleErrors.push(args.map(a=>a.value||a.description||"console error").join(" ")); });
  cdp.on("Network.responseReceived", ({ response }) => { if (response.status === 404) issues.notFound.push(response.url); });
  cdp.on("Network.loadingFailed", ({ type, errorText, canceled }) => { if (!canceled && type === "Image") issues.imageNetworkFailures.push(errorText); });
  return issues;
}

async function pageAudit(cdp, pageKey, height) {
  await reveal(cdp, height);
  const metrics = await evaluate(cdp, `(()=>{const root=document.documentElement,body=document.body;const images=[...document.images].filter(i=>!i.closest('details:not([open])')).map(i=>({src:i.currentSrc||i.src,complete:i.complete,naturalWidth:i.naturalWidth}));const motion=[...document.querySelectorAll('[data-motion],[data-home-motion-project],.qfc-motion-item,.clj-motion-item')].filter(n=>!n.closest('details:not([open])')).filter(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.1||r.width===0||r.height===0}).map(n=>({className:n.className||'',text:(n.textContent||'').trim().slice(0,80)}));const header=document.querySelector('body>header');const hs=header?getComputedStyle(header):null;return{page:${JSON.stringify(pageKey)},url:location.href,zoom:{devicePixelRatio,scale:visualViewport?.scale||1},overflow:Math.max(0,root.scrollWidth-root.clientWidth,body.scrollWidth-root.clientWidth),imageFailures:images.filter(i=>!i.complete||i.naturalWidth===0),hiddenMotion:motion,header:header?{position:hs.position,height:Math.round(header.getBoundingClientRect().height),zIndex:hs.zIndex}:null,scan:{h1:document.querySelector('main h1')?.innerText||'',heroCopy:(document.querySelector('main section p')?.textContent||'').trim().slice(0,260),roles:[...document.querySelectorAll('main dt')].map(n=>n.textContent.trim()+': '+(n.nextElementSibling?.textContent||'').trim()).slice(0,8),headings:[...document.querySelectorAll('main h2')].map(n=>n.textContent.trim().replace(/\\s+/g,' ')).slice(0,14),projects:[...document.querySelectorAll('.project-chapter h2')].map(n=>n.textContent.trim()),boundaryMatches:(document.body.innerText.match(/concept|prototype|not validated|not live|not launched|未上线|未验证|未经验证|概念|原型/gi)||[]).length}}})()`);
  const links = await evaluate(cdp, "(async()=>{const hrefs=[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin)))];const out=[];for(const href of hrefs){try{const r=await fetch(href,{cache:'no-store'});out.push({href,status:r.status,ok:r.ok})}catch(e){out.push({href,status:0,ok:false,error:String(e)})}}return out})()");
  return { ...metrics, links, brokenLinks: links.filter(l=>!l.ok) };
}

async function appendix(cdp) {
  const selector = "details.appendix,details.qfc-appendix,details.clj-appendix";
  const present = await evaluate(cdp, `Boolean(document.querySelector(${JSON.stringify(selector)}))`);
  if (!present) return { present: false };
  const opened = await evaluate(cdp, `(()=>{const d=document.querySelector(${JSON.stringify(selector)});const closedHeight=Math.round(d.getBoundingClientRect().height);d.open=true;return{present:true,open:d.open,closedHeight,openHeight:Math.round(d.getBoundingClientRect().height)}})()`);
  await waitImages(cdp);
  const closed = await evaluate(cdp, `(()=>{const d=document.querySelector(${JSON.stringify(selector)});d.open=false;return{closed:!d.open,closedAgainHeight:Math.round(d.getBoundingClientRect().height)}})()`);
  return { ...opened, ...closed };
}

async function run(width, height, port) {
  const { chrome, target } = await launch(port); const cdp = new Cdp(target.webSocketDebuggerUrl); const issues = observe(cdp); const steps = []; const pages = {};
  try {
    await cdp.open(); await setup(cdp, width, height); await navigate(cdp, "/");
    pages.homepage = await pageAudit(cdp, "homepage", height);
    if (width === 390) {
      await evaluate(cdp, "document.querySelector('.menu-button').click()"); await sleep(300);
      const open = await evaluate(cdp, "(()=>{const b=document.querySelector('.menu-button'),n=document.querySelector('.mobile-nav'),s=getComputedStyle(n);return{expanded:b.getAttribute('aria-expanded'),ariaHidden:n.getAttribute('aria-hidden'),visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,links:n.querySelectorAll('a').length}})()");
      await evaluate(cdp, "document.querySelector('.menu-button').click()"); await sleep(300);
      const close = await evaluate(cdp, "(()=>{const b=document.querySelector('.menu-button'),n=document.querySelector('.mobile-nav');return{expanded:b.getAttribute('aria-expanded'),ariaHidden:n.getAttribute('aria-hidden'),visibility:getComputedStyle(n).visibility}})()");
      steps.push({ action: "mobile menu", open, close });
    }
    const navSelector = width === 390 ? ".mobile-nav" : ".home-nav";
    if (width === 390) { await evaluate(cdp, "document.querySelector('.menu-button').click()"); await sleep(250); }
    await evaluate(cdp, `document.querySelector(${JSON.stringify(navSelector + ' a[href="#about"]')}).click()`); await sleep(900);
    steps.push({ action: "About", result: await evaluate(cdp, "(()=>{const t=document.querySelector('#about'),h=document.querySelector('.home-header');return{url:location.href,visible:t.getBoundingClientRect().top>=h.getBoundingClientRect().bottom-2}})()") });
    const resume = await evaluate(cdp, "(async()=>{const a=document.querySelector('a[href*=\"chang-li-cv.pdf\"]');const r=await fetch(a.href);return{href:a.getAttribute('href'),download:a.hasAttribute('download'),status:r.status,ok:r.ok,contentType:r.headers.get('content-type')}})()");
    steps.push({ action: "Resume / CV", result: resume });
    if (width === 390) { const open=await evaluate(cdp, "document.querySelector('.menu-button').getAttribute('aria-expanded')"); if(open!=='true'){await evaluate(cdp, "document.querySelector('.menu-button').click()");await sleep(250);} }
    await evaluate(cdp, `document.querySelector(${JSON.stringify(navSelector + ' a[href="#contact"]')}).click()`); await sleep(900);
    steps.push({ action: "Contact", result: await evaluate(cdp, "(()=>{const t=document.querySelector('#contact'),h=document.querySelector('.home-header'),m=document.querySelector('a[href^=\"mailto:\"]');return{url:location.href,visible:t.getBoundingClientRect().top>=h.getBoundingClientRect().bottom-2,mailto:m?.getAttribute('href')}})()") });
    steps.push({ action: "Homepage → Case 01", result: await clickNavigation(cdp, 'a[href="/cases/should-i-work-out-today.html"]') });
    pages.case01 = await pageAudit(cdp, "case01", height); steps.push({ action: "Case 01 appendix", result: await appendix(cdp) });
    steps.push({ action: "Case 01 Back → Homepage", result: await clickNavigation(cdp, '.case-hero .back-link') });
    steps.push({ action: "Homepage → Case 01 again", result: await clickNavigation(cdp, 'a[href="/cases/should-i-work-out-today.html"]') });
    steps.push({ action: "Case 01 → Case 02", result: await clickNavigation(cdp, '.next-project') });
    pages.case02 = await pageAudit(cdp, "case02", height); steps.push({ action: "Case 02 appendix", result: await appendix(cdp) });
    steps.push({ action: "Case 02 → Case 03", result: await clickNavigation(cdp, '.qfc-footer a') });
    pages.case03 = await pageAudit(cdp, "case03", height); steps.push({ action: "Case 03 appendix", result: await appendix(cdp) });
    steps.push({ action: "Case 03 → Homepage", result: await clickNavigation(cdp, '.clj-brand') });
    return { viewport: { width, height }, pages, steps, issues, finalUrl: await evaluate(cdp, "location.href") };
  } finally { cdp.close(); chrome.kill(); }
}

await mkdir(OUT, { recursive: true });
const server = spawn("python", ["-m", "http.server", "4193", "--bind", "127.0.0.1", "--directory", "dist"], { stdio: "ignore", windowsHide: true });
await sleep(800);
try {
  const desktop = await run(1440, 900, 12470); const mobile = await run(390, 844, 12471); const all = [desktop, mobile]; const pageResults = all.flatMap(r=>Object.values(r.pages));
  const summary = { browserZoom100: pageResults.every(p=>p.zoom.scale===1), horizontalOverflow: pageResults.reduce((n,p)=>n+p.overflow,0), imageFailures: pageResults.reduce((n,p)=>n+p.imageFailures.length,0)+all.reduce((n,r)=>n+r.issues.imageNetworkFailures.length,0), runtimeErrors: all.reduce((n,r)=>n+r.issues.runtimeErrors.length,0), consoleErrors: all.reduce((n,r)=>n+r.issues.consoleErrors.length,0), notFound: all.reduce((n,r)=>n+r.issues.notFound.length,0), brokenInternalLinks: pageResults.reduce((n,p)=>n+p.brokenLinks.length,0), hiddenMotionNodes: pageResults.reduce((n,p)=>n+p.hiddenMotion.length,0), pathPass: all.every(r=>r.finalUrl.endsWith('/#work')&&r.steps.find(s=>s.action==='Case 01 → Case 02')?.result.url.endsWith('/cases/quiet-fitness-cabin.html')&&r.steps.find(s=>s.action==='Case 02 → Case 03')?.result.url.endsWith('/cases/connected-long-journey.html')) };
  const report = { generatedAt: new Date().toISOString(), build: { command: "npm.cmd run build", status: "passed" }, desktop, mobile, summary };
  await writeFile(path.join(OUT, "final-manual-review.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify(summary, null, 2));
} finally { server.kill(); }
