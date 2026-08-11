import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4192";
const OUT = path.resolve("visual-audit-v2-final-polish-readability");
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
  send(method, params = {}) { const id = ++this.id; return new Promise((resolve, reject) => { const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 25000); this.pending.set(id, { resolve, reject, timer }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  on(method, fn) { this.events.set(method, [...(this.events.get(method) || []), fn]); }
  once(method) { return new Promise((resolve) => { const fn = (params) => { this.events.set(method, (this.events.get(method) || []).filter((item) => item !== fn)); resolve(params); }; this.on(method, fn); }); }
  close() { this.ws.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), `readability-${port}-`));
  const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
  for (let i = 0; i < 90; i += 1) {
    try { const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const target = targets.find((item) => item.type === "page"); if (target) return { chrome, target }; } catch {}
    await sleep(100);
  }
  chrome.kill(); throw new Error("Chrome target unavailable");
}
async function evaluate(cdp, expression) { const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Runtime evaluation failed"); return result.result.value; }
async function screenshot(cdp, name, full = false) { const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: full }); await writeFile(path.join(OUT, name), Buffer.from(result.data, "base64")); }
async function setup(cdp, width, height) { await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Network.enable"), cdp.send("Emulation.setDeviceMetricsOverride", { width, height, mobile: width < 901, screenWidth: width, screenHeight: height, deviceScaleFactor: 1 }), cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 })]); }
async function navigate(cdp, url) { const loaded = cdp.once("Page.loadEventFired"); await cdp.send("Page.navigate", { url: `${BASE}${url}` }); await loaded; await sleep(650); }
async function waitImages(cdp) { await evaluate(cdp, "(async()=>{const images=[...document.images].filter(i=>!i.closest('details:not([open])'));await Promise.race([Promise.all(images.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true})}))),new Promise(r=>setTimeout(r,12000))])})()"); }
async function reveal(cdp, height) { const total = await evaluate(cdp, "document.documentElement.scrollHeight"); for (let y = 0; y < total; y += Math.max(380, Math.round(height * .7))) { await evaluate(cdp, `scrollTo(0,${y})`); await sleep(80); } await waitImages(cdp); await evaluate(cdp, "scrollTo(0,0)"); await sleep(300); }

const textMetricsExpression = `(() => {
  const label=(node)=>{const section=node.closest('section');if(!section)return node.closest('footer')?'Footer':node.closest('header')?'Header':'Other';if(section.id)return section.id;const c=[...section.classList].find(x=>/hero|problem|opportunity|journey|spatial|workshop|digital|testing|outcome|appendix/.test(x));return c||'Section'};
  const candidates=[...document.querySelectorAll('section p,section span,section i,section dt,section figcaption,section a,footer span,footer strong,footer a,details summary')];
  return candidates.filter(n=>!n.closest('details:not([open])')).map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect(),text=(n.textContent||'').trim().replace(/\\s+/g,' ');return{section:label(n),tag:n.tagName,className:typeof n.className==='string'?n.className:'',text:text.slice(0,180),fontSize:parseFloat(s.fontSize),fontSizeCss:s.fontSize,lineHeight:s.lineHeight,fontWeight:s.fontWeight,letterSpacing:s.letterSpacing,color:s.color,width:Math.round(r.width),height:Math.round(r.height),top:Math.round(r.top+scrollY),visible:s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>.5&&r.width>0&&r.height>0}}).filter(x=>x.visible&&x.text&&x.fontSize<=11.5);
})()`;

async function audit({ key, url, width, height, port, smallTarget }) {
  const { chrome, target } = await launch(port); const cdp = new Cdp(target.webSocketDebuggerUrl);
  try {
    await cdp.open(); await setup(cdp, width, height); await navigate(cdp, url); await reveal(cdp, height);
    const zoom = await evaluate(cdp, "({devicePixelRatio,visualViewportScale:visualViewport?.scale||1,innerWidth,innerHeight,outerWidth,outerHeight})");
    const initialSmallText = await evaluate(cdp, textMetricsExpression);
    const appendix = await evaluate(cdp, "(()=>{const d=document.querySelector('details.qfc-appendix,details.clj-appendix');if(!d)return null;d.open=true;return{open:d.open}})()");
    if (appendix) { await waitImages(cdp); await sleep(250); }
    const appendixSmallText = appendix ? await evaluate(cdp, textMetricsExpression) : [];
    if (appendix) await evaluate(cdp, "document.querySelector('details.qfc-appendix,details.clj-appendix').open=false");
    await reveal(cdp, height);
    await screenshot(cdp, `${key}-${width}-readable-audit.png`, true);
    await evaluate(cdp, `document.querySelector(${JSON.stringify(smallTarget)})?.scrollIntoView({block:'start',behavior:'instant'})`);
    await sleep(350);
    await screenshot(cdp, `${key}-small-text-${width}.png`);
    return { viewport: { width, height }, zoom, smallText: initialSmallText, appendixSmallText: appendixSmallText.filter(x=>x.section.toLowerCase().includes('outcome')||x.className.includes('appendix')||x.tag==='FIGCAPTION') };
  } finally { cdp.close(); chrome.kill(); }
}

await mkdir(OUT, { recursive: true });
const server = spawn("python", ["-m", "http.server", "4192", "--bind", "127.0.0.1", "--directory", "dist"], { stdio: "ignore", windowsHide: true });
await sleep(800);
try {
  const results = [];
  results.push(await audit({ key: "case02", url: "/cases/quiet-fitness-cabin.html", width: 1440, height: 900, port: 12450, smallTarget: ".qfc-hero__visual" }));
  results.push(await audit({ key: "case02", url: "/cases/quiet-fitness-cabin.html", width: 390, height: 844, port: 12451, smallTarget: ".qfc-hero__visual" }));
  results.push(await audit({ key: "case03", url: "/cases/connected-long-journey.html", width: 1440, height: 900, port: 12452, smallTarget: "#testing" }));
  results.push(await audit({ key: "case03", url: "/cases/connected-long-journey.html", width: 390, height: 844, port: 12453, smallTarget: "#testing" }));
  await writeFile(path.join(OUT, "readability-audit.json"), JSON.stringify({ generatedAt: new Date().toISOString(), browserZoom: "100%", results }, null, 2));
  console.log(JSON.stringify(results.map(r=>({viewport:r.viewport,zoom:r.zoom,smallTextCount:r.smallText.length,minFont:Math.min(...r.smallText.map(x=>x.fontSize)),sections:[...new Set(r.smallText.map(x=>x.section))]})),null,2));
} finally { server.kill(); }
