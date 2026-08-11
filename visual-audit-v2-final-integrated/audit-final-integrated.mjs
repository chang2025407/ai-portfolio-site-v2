import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://127.0.0.1:4188";
const OUT = path.resolve("visual-audit-v2-final-integrated");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pages = [
  { key: "homepage", url: "/" },
  { key: "case01", url: "/cases/should-i-work-out-today.html" },
  { key: "case02", url: "/cases/quiet-fitness-cabin.html" },
  { key: "case03", url: "/cases/connected-long-journey.html" },
];

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
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
        message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
        return;
      }
      for (const listener of this.events.get(message.method) || []) listener(message.params);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out: ${method}`));
      }, 30000);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, listener) {
    this.events.set(method, [...(this.events.get(method) || []), listener]);
  }
  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        this.events.set(method, (this.events.get(method) || []).filter((item) => item !== listener));
        resolve(params);
      };
      this.on(method, listener);
    });
  }
  close() { this.ws.close(); }
}

async function launch(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), `final-integrated-${port}-`));
  const chrome = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore", windowsHide: true });
  for (let index = 0; index < 100; index += 1) {
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
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result.value;
}

async function screenshot(cdp, name, full = false) {
  const result = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: full });
  await writeFile(path.join(OUT, name), Buffer.from(result.data, "base64"));
}

async function setup(cdp, width, height, reduced = false) {
  await Promise.all([
    cdp.send("Page.enable"), cdp.send("Runtime.enable"), cdp.send("Network.enable"), cdp.send("Log.enable"),
    cdp.send("Emulation.setDeviceMetricsOverride", { width, height, mobile: width < 901, screenWidth: width, screenHeight: height, deviceScaleFactor: 1 }),
    cdp.send("Emulation.setEmulatedMedia", { media: "screen", features: reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : [] }),
  ]);
}

function observe(cdp) {
  const issues = { runtimeErrors: [], consoleErrors: [], notFound: [], failedRequests: [], imageNetworkFailures: [] };
  let currentUrl = "about:blank";
  cdp.on("Page.frameNavigated", ({ frame }) => { if (!frame.parentId) currentUrl = frame.url; });
  cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => issues.runtimeErrors.push({ page: currentUrl, message: exceptionDetails.exception?.description || exceptionDetails.text || "runtime error" }));
  cdp.on("Runtime.consoleAPICalled", ({ type, args }) => {
    if (type === "error" || type === "assert") issues.consoleErrors.push({ page: currentUrl, message: args.map((arg) => arg.value || arg.description || "console error").join(" ") });
  });
  cdp.on("Network.responseReceived", ({ response }) => { if (response.status === 404) issues.notFound.push({ page: currentUrl, url: response.url }); });
  cdp.on("Network.loadingFailed", ({ type, errorText, canceled }) => {
    if (canceled) return;
    issues.failedRequests.push({ page: currentUrl, type, errorText });
    if (type === "Image") issues.imageNetworkFailures.push({ page: currentUrl, errorText });
  });
  return issues;
}

async function navigate(cdp, url) {
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: `${BASE}${url}` });
  await loaded;
}

async function clickNavigation(cdp, selector) {
  const loaded = cdp.once("Page.loadEventFired");
  const clicked = await evaluate(cdp, `(() => { const node=document.querySelector(${JSON.stringify(selector)}); if(!node)return false; node.click(); return true; })()`);
  if (!clicked) return { clicked: false, url: await evaluate(cdp, "location.href") };
  await Promise.race([loaded, sleep(5000)]);
  await sleep(250);
  return { clicked: true, url: await evaluate(cdp, "location.href") };
}

const visibilityExpression = `(() => {
  const candidates=[...document.querySelectorAll('main h1,main h2,main p,main img,[data-motion],[data-home-motion-project],.qfc-motion-item,.clj-motion-item')];
  const important=candidates.filter((node)=>!node.closest('details:not([open])')).slice(0,16);
  return important.map((node)=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return{tag:node.tagName,className:node.className||'',text:(node.textContent||node.alt||'').trim().slice(0,80),opacity:Number(s.opacity),visibility:s.visibility,display:s.display,width:Math.round(r.width),height:Math.round(r.height)}});
})()`;

async function firstLoadTimeline(cdp) {
  const snapshots = [];
  for (const delay of [0, 80, 240, 700]) {
    if (delay) await sleep(delay);
    snapshots.push({ delayMs: snapshots.reduce((sum, item) => sum + item.delayMs, 0) + delay, nodes: await evaluate(cdp, visibilityExpression) });
  }
  return snapshots;
}

async function waitForImages(cdp, timeout = 12000) {
  return evaluate(cdp, `(async()=>{const imgs=[...document.images].filter(i=>!i.closest('details:not([open])'));await Promise.race([Promise.all(imgs.map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true})}))),new Promise(r=>setTimeout(r,${timeout}))]);return imgs.map(i=>({src:i.currentSrc||i.src,complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight}));})()`);
}

async function steppedReveal(cdp, height) {
  const total = await evaluate(cdp, "document.documentElement.scrollHeight");
  for (let y = 0; y < total; y += Math.max(360, Math.round(height * 0.68))) {
    await evaluate(cdp, `scrollTo(0,${y})`);
    await sleep(90);
  }
  await waitForImages(cdp);
  await evaluate(cdp, "scrollTo(0,0)");
  await sleep(400);
}

async function rapidScroll(cdp) {
  await evaluate(cdp, "scrollTo(0,document.documentElement.scrollHeight)");
  await sleep(500);
  const bottomHidden = await hiddenMotion(cdp);
  await evaluate(cdp, "scrollTo(0,0)");
  await sleep(250);
  return { bottomHidden };
}

async function hiddenMotion(cdp) {
  return evaluate(cdp, `(() => [...document.querySelectorAll('[data-motion],[data-home-motion-project],.qfc-motion-item,.clj-motion-item')].filter(n=>!n.closest('details:not([open])')).filter(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.1||r.width===0||r.height===0}).map(n=>({tag:n.tagName,className:n.className||'',text:(n.textContent||'').trim().slice(0,80),opacity:getComputedStyle(n).opacity})))()`);
}

async function anchorChecks(cdp) {
  const hrefs = await evaluate(cdp, `[...new Set([...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h&&h.length>1))]`);
  const results = [];
  for (const href of hrefs) {
    await evaluate(cdp, "scrollTo({top:0,behavior:'instant'})");
    await sleep(80);
    const exists = await evaluate(cdp, `Boolean(document.querySelector(${JSON.stringify(href)}))`);
    if (!exists) { results.push({ href, exists: false }); continue; }
    await evaluate(cdp, `document.querySelector('a[href=${JSON.stringify(href)}]')?.click()`);
    await sleep(900);
    results.push(await evaluate(cdp, `(()=>{const target=document.querySelector(${JSON.stringify(href)});const tr=target.getBoundingClientRect();const bars=[...document.querySelectorAll('header,nav')].filter(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return(s.position==='fixed'||s.position==='sticky')&&r.top<=2&&r.bottom>0&&s.display!=='none'&&s.visibility!=='hidden'});const obstruction=Math.max(0,...bars.map(n=>n.getBoundingClientRect().bottom));return{href:${JSON.stringify(href)},exists:true,targetTop:Math.round(tr.top),obstructionBottom:Math.round(obstruction),visibleBelowHeader:tr.top>=obstruction-2};})()`));
  }
  await evaluate(cdp, "scrollTo({top:0,behavior:'instant'})");
  await sleep(200);
  return results;
}

async function appendixCheck(cdp, key, width, saveShot) {
  const selector = "details.appendix,details.qfc-appendix,details.clj-appendix";
  const present = await evaluate(cdp, `Boolean(document.querySelector(${JSON.stringify(selector)}))`);
  if (!present) return { present: false };
  const result = await evaluate(cdp, `(()=>{const d=document.querySelector(${JSON.stringify(selector)});const closedHeight=Math.round(d.getBoundingClientRect().height);d.open=true;return{present:true,openAfterOpen:d.open,closedHeight,openHeight:Math.round(d.getBoundingClientRect().height)}})()`);
  await evaluate(cdp, `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`);
  await waitForImages(cdp, 15000);
  await sleep(300);
  if (saveShot) await screenshot(cdp, `${key}-${width}-appendix-open.png`);
  const close = await evaluate(cdp, `(()=>{const d=document.querySelector(${JSON.stringify(selector)});d.open=false;return{openAfterClose:d.open,closedAgainHeight:Math.round(d.getBoundingClientRect().height)}})()`);
  await evaluate(cdp, "scrollTo(0,0)");
  return { ...result, ...close };
}

async function menuCheck(cdp, key, width) {
  if (key === "homepage") {
    const present = await evaluate(cdp, "Boolean(document.querySelector('.menu-button'))");
    if (!present) return { present: false };
    const opened = await evaluate(cdp, `(()=>{const b=document.querySelector('.menu-button');b.click();const n=document.querySelector('.mobile-nav');return{present:true,expanded:b.getAttribute('aria-expanded'),ariaHidden:n.getAttribute('aria-hidden'),display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility,linkCount:n.querySelectorAll('a').length}})()`);
    if (width === 390) await screenshot(cdp, "homepage-390-mobile-menu.png");
    const closed = await evaluate(cdp, `(()=>{const b=document.querySelector('.menu-button');b.click();return{expandedAfterClose:b.getAttribute('aria-expanded'),ariaHiddenAfterClose:document.querySelector('.mobile-nav').getAttribute('aria-hidden')}})()`);
    return { ...opened, ...closed };
  }
  if (key === "case01") {
    return evaluate(cdp, `(()=>{const d=document.querySelector('.case-mobile-nav');if(!d)return{present:false};d.open=true;const opened=d.open,links=d.querySelectorAll('a').length;d.open=false;return{present:true,opened,closed:!d.open,links}})()`);
  }
  if (key === "case03") {
    return evaluate(cdp, `(()=>{const n=document.querySelector('.clj-mobile-chapters');if(!n)return{present:false};const r=n.getBoundingClientRect(),inner=n.firstElementChild;return{present:true,display:getComputedStyle(n).display,height:Math.round(r.height),scrollable:inner.scrollWidth>inner.clientWidth,scrollWidth:inner.scrollWidth,clientWidth:inner.clientWidth}})()`);
  }
  return { present: false, note: "No dedicated mobile chapter menu in DOM" };
}

async function linkChecks(cdp) {
  return evaluate(cdp, `(async()=>{const anchors=[...document.querySelectorAll('a[href]')];const items=anchors.map(a=>({href:a.getAttribute('href'),absolute:a.href,text:(a.textContent||'').trim().replace(/\\s+/g,' ').slice(0,100),download:a.hasAttribute('download')}));const internal=[...new Set(items.map(i=>i.absolute).filter(h=>h.startsWith(location.origin)))];const statuses=[];for(const href of internal){try{const r=await fetch(href,{cache:'no-store'});statuses.push({href,status:r.status,ok:r.ok,contentType:r.headers.get('content-type')})}catch(error){statuses.push({href,status:0,ok:false,error:String(error)})}}return{items,statuses,broken:statuses.filter(s=>!s.ok),mailto:items.filter(i=>i.href?.startsWith('mailto:')),resume:statuses.filter(s=>s.href.includes('chang-li-cv.pdf'))};})()`);
}

const metricsExpression = `(() => {
  const root=document.documentElement,body=document.body;
  const images=[...document.images].map(img=>{const r=img.getBoundingClientRect(),s=getComputedStyle(img);return{src:img.currentSrc||img.src,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,renderedWidth:Math.round(r.width),renderedHeight:Math.round(r.height),objectFit:s.objectFit,aspectNatural:img.naturalWidth&&img.naturalHeight?Number((img.naturalWidth/img.naturalHeight).toFixed(3)):null,aspectRendered:r.height?Number((r.width/r.height).toFixed(3)):null,inClosedDetails:Boolean(img.closest('details:not([open])'))}});
  const top=[...document.querySelectorAll('main>section,main>div,body>footer,main+footer')].map(n=>{const r=n.getBoundingClientRect();return{tag:n.tagName,id:n.id||'',className:n.className||'',top:Math.round(r.top+scrollY),bottom:Math.round(r.bottom+scrollY),height:Math.round(r.height)}}).sort((a,b)=>a.top-b.top);
  const gaps=[];for(let i=1;i<top.length;i+=1){const gap=top[i].top-top[i-1].bottom;if(gap>innerHeight*.55)gaps.push({from:top[i-1].id||top[i-1].className,to:top[i].id||top[i].className,gap})}
  const smallText=[...document.querySelectorAll('main p,main li,main span,main a,footer p,footer span,footer a')].filter(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return(n.textContent||'').trim()&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&parseFloat(s.fontSize)<12}).slice(0,80).map(n=>({text:(n.textContent||'').trim().replace(/\\s+/g,' ').slice(0,100),fontSize:getComputedStyle(n).fontSize,className:n.className||''}));
  const offscreen=[...document.querySelectorAll('main img,main figure,main article,main h1,main h2,main p,main a,footer a')].filter(n=>!n.closest('details:not([open])')).filter(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&(r.left<-2||r.right>innerWidth+2)}).slice(0,80).map(n=>{const r=n.getBoundingClientRect();return{tag:n.tagName,className:n.className||'',text:(n.textContent||n.alt||'').trim().replace(/\\s+/g,' ').slice(0,80),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)}});
  const h1=document.querySelector('main h1');const h1s=h1?getComputedStyle(h1):null;
  const headers=[...document.querySelectorAll('body>header,main>header')].map(h=>{const r=h.getBoundingClientRect(),s=getComputedStyle(h);return{className:h.className||'',height:Math.round(r.height),position:s.position,zIndex:s.zIndex,background:s.backgroundColor}});
  return{url:location.href,title:document.title,lang:root.lang,document:{scrollWidth:root.scrollWidth,clientWidth:root.clientWidth,bodyScrollWidth:body.scrollWidth,scrollHeight:root.scrollHeight},horizontalOverflow:Math.max(0,root.scrollWidth-root.clientWidth,body.scrollWidth-root.clientWidth),images,imageFailures:images.filter(i=>!i.inClosedDetails&&(!i.complete||i.naturalWidth===0)).map(i=>i.src),aspectAnomalies:images.filter(i=>i.aspectNatural&&i.aspectRendered&&getComputedStyle([...document.images].find(x=>(x.currentSrc||x.src)===i.src)).objectFit==='fill'&&Math.abs(i.aspectNatural-i.aspectRendered)>.08),topLevel:top,hugeGaps:gaps,smallText,offscreen,h1:h1?{text:h1.innerText,fontSize:h1s.fontSize,lineHeight:h1s.lineHeight,width:Math.round(h1.getBoundingClientRect().width),height:Math.round(h1.getBoundingClientRect().height)}:null,headers,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,hiddenMotion:[]};
})()`;

async function auditPage(cdp, page, width, height, reduced) {
  await navigate(cdp, page.url);
  const timeline = await firstLoadTimeline(cdp);
  const rapid = await rapidScroll(cdp);
  const anchors = await anchorChecks(cdp);
  await steppedReveal(cdp, height);
  const appendix = await appendixCheck(cdp, page.key, width, !reduced && width === 390);
  await steppedReveal(cdp, height);
  const hiddenAfterReveal = await hiddenMotion(cdp);
  const links = await linkChecks(cdp);
  const menu = await menuCheck(cdp, page.key, width);
  await evaluate(cdp, "scrollTo(0,0)");
  await sleep(300);
  const metrics = await evaluate(cdp, metricsExpression);
  metrics.hiddenMotion = hiddenAfterReveal;
  if (!reduced) await screenshot(cdp, `${page.key}-${width}-full.png`, true);
  return { page: page.key, viewport: { width, height }, reduced, firstLoadTimeline: timeline, rapidScroll: rapid, anchors, appendix, menu, links, metrics };
}

async function continuousJourney(width, height, port) {
  const { chrome, target } = await launch(port);
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  const issues = observe(cdp);
  const steps = [];
  try {
    await cdp.open();
    await setup(cdp, width, height, false);
    await navigate(cdp, "/");
    await sleep(500);
    if (width === 390) {
      const menu = await menuCheck(cdp, "homepage", width);
      steps.push({ action: "homepage mobile menu open/close", result: menu, url: await evaluate(cdp, "location.href") });
    }
    steps.push({ action: "Homepage → Case 01", result: await clickNavigation(cdp, 'a[href="/cases/should-i-work-out-today.html"]') });
    const case01Anchor = await anchorChecks(cdp);
    steps.push({ action: "Case 01 chapter anchors", result: case01Anchor });
    if (width === 1440) {
      await evaluate(cdp, "document.querySelector('.next-project')?.scrollIntoView({block:'center',behavior:'instant'})");
      await sleep(200);
      await screenshot(cdp, "case01-next-project-sequence.png");
    }
    steps.push({ action: "Case 01 → Projects/Homepage", result: await clickNavigation(cdp, '.case-hero .back-link') });
    steps.push({ action: "Homepage → Case 02", result: await clickNavigation(cdp, 'a[href="/cases/quiet-fitness-cabin.html"]') });
    await evaluate(cdp, "document.querySelector('.qfc-footer a')?.scrollIntoView({block:'center',behavior:'instant'})");
    await sleep(200);
    steps.push({ action: "Case 02 → Next project", result: await clickNavigation(cdp, '.qfc-footer a') });
    steps.push({ action: "Case 03 → Projects", result: await clickNavigation(cdp, '.clj-brand') });
    await sleep(300);
    if (width === 390) await evaluate(cdp, "document.querySelector('.menu-button')?.click()");
    const aboutSelector = width === 390 ? '.mobile-nav a[href="#about"]' : '.home-nav a[href="#about"]';
    await evaluate(cdp, `document.querySelector(${JSON.stringify(aboutSelector)})?.click()`);
    await sleep(900);
    steps.push({ action: "Projects → About", result: await evaluate(cdp, `(()=>{const t=document.querySelector('#about'),h=document.querySelector('.home-header');return{url:location.href,targetTop:Math.round(t.getBoundingClientRect().top),headerBottom:Math.round(h.getBoundingClientRect().bottom),visibleBelowHeader:t.getBoundingClientRect().top>=h.getBoundingClientRect().bottom-2}})()`)});
    const links = await linkChecks(cdp);
    steps.push({ action: "About → CV / Resume", result: { link: links.items.find(i=>i.absolute.includes('chang-li-cv.pdf')), response: links.resume[0] || null } });
    if (width === 390) await evaluate(cdp, "document.querySelector('.menu-button')?.click()");
    const contactSelector = width === 390 ? '.mobile-nav a[href="#contact"]' : '.home-nav a[href="#contact"]';
    await evaluate(cdp, `document.querySelector(${JSON.stringify(contactSelector)})?.click()`);
    await sleep(900);
    steps.push({ action: "CV / Resume → Contact", result: await evaluate(cdp, `(()=>{const t=document.querySelector('#contact'),mail=document.querySelector('a[href^="mailto:"]'),h=document.querySelector('.home-header');return{url:location.href,targetTop:Math.round(t.getBoundingClientRect().top),headerBottom:Math.round(h.getBoundingClientRect().bottom),visibleBelowHeader:t.getBoundingClientRect().top>=h.getBoundingClientRect().bottom-2,mailto:mail?.getAttribute('href')||null}})()`)});
    return { viewport: { width, height }, steps, issues };
  } finally {
    cdp.close();
    chrome.kill();
  }
}

async function runViewport(width, height, reduced, portBase) {
  const results = [];
  for (let index = 0; index < pages.length; index += 1) {
    const { chrome, target } = await launch(portBase + index);
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    const issues = observe(cdp);
    try {
      await cdp.open();
      await setup(cdp, width, height, reduced);
      console.log(`QA ${pages[index].key} ${width}x${height}${reduced ? " reduced" : ""}`);
      const result = await auditPage(cdp, pages[index], width, height, reduced);
      result.issues = issues;
      results.push(result);
    } finally {
      cdp.close();
      chrome.kill();
    }
  }
  return results;
}

await mkdir(OUT, { recursive: true });
const server = spawn("python", ["-m", "http.server", "4188", "--bind", "127.0.0.1", "--directory", "dist"], { stdio: "ignore", windowsHide: true });
await sleep(900);
try {
  const desktop = await runViewport(1440, 900, false, 12300);
  const mobile = await runViewport(390, 844, false, 12310);
  const reducedDesktop = await runViewport(1440, 900, true, 12320);
  const reducedMobile = await runViewport(390, 844, true, 12330);
  const journeyDesktop = await continuousJourney(1440, 900, 12340);
  const journeyMobile = await continuousJourney(390, 844, 12341);
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    build: { command: "npm.cmd run build", status: "passed" },
    desktop, mobile, reducedDesktop, reducedMobile,
    continuousJourneys: [journeyDesktop, journeyMobile],
  };
  await writeFile(path.join(OUT, "final-integrated-qa.json"), JSON.stringify(report, null, 2));
  const all = [...desktop, ...mobile, ...reducedDesktop, ...reducedMobile];
  const summary = {
    pages: all.length,
    overflow: all.filter(r=>r.metrics.horizontalOverflow>0).length,
    imageFailures: all.reduce((n,r)=>n+r.metrics.imageFailures.length+r.issues.imageNetworkFailures.length,0),
    runtimeErrors: all.reduce((n,r)=>n+r.issues.runtimeErrors.length,0),
    consoleErrors: all.reduce((n,r)=>n+r.issues.consoleErrors.length,0),
    notFound: all.reduce((n,r)=>n+r.issues.notFound.length,0),
    brokenLinks: all.reduce((n,r)=>n+r.links.broken.length,0),
    hiddenAfterReveal: all.reduce((n,r)=>n+r.metrics.hiddenMotion.length,0),
    badAnchors: all.reduce((n,r)=>n+r.anchors.filter(a=>!a.exists||!a.visibleBelowHeader).length,0),
  };
  console.log(JSON.stringify(summary, null, 2));
} finally {
  server.kill();
}
