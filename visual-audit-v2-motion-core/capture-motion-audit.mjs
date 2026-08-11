import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://127.0.0.1:4173/";
const OUTPUT_ROOT = path.resolve("visual-audit-v2-motion-core");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      const handlers = this.listeners.get(message.method) || [];
      handlers.forEach((handler) => handler(message.params));
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for CDP response: ${method}`));
      }, 15000);
      this.pending.set(id, {
        resolve: (result) => { clearTimeout(timer); resolve(result); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    const handlers = this.listeners.get(method) || [];
    handlers.push(handler);
    this.listeners.set(method, handlers);
  }

  once(method, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeout);
      this.on(method, (params) => {
        clearTimeout(timer);
        resolve(params);
      });
    });
  }

  close() {
    this.socket.close();
  }
}

async function launchChrome(port) {
  const profile = await mkdtemp(path.join(os.tmpdir(), `motion-audit-${port}-`));
  const chrome = spawn(CHROME, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

  let target;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      target = targets.find((item) => item.type === "page");
      if (target) break;
    } catch {
      // Chrome is still starting.
    }
    await sleep(100);
  }
  if (!target) throw new Error(`Chrome did not expose a page target on ${port}`);
  return { chrome, target };
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function capture(client, directory, name) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(path.join(directory, `${name}.png`), Buffer.from(result.data, "base64"));
}

async function scrollTo(client, targetY, directory, prefix, stepSize, delay) {
  let currentY = await evaluate(client, "window.scrollY");
  let frame = 1;
  while (currentY < targetY) {
    currentY = Math.min(targetY, currentY + stepSize);
    await evaluate(client, `window.scrollTo(0, ${currentY})`);
    await sleep(delay);
    if (frame % 3 === 0 || currentY === targetY) {
      await capture(client, directory, `${prefix}-${String(frame).padStart(2, "0")}-${Math.round(currentY)}px`);
    }
    frame += 1;
  }
  await sleep(540);
  await capture(client, directory, `${prefix}-settled-${Math.round(targetY)}px`);
}

async function auditViewport({ name, port, width, height, mobile, throughProject }) {
  const directory = path.join(OUTPUT_ROOT, name);
  await mkdir(directory, { recursive: true });
  const { chrome, target } = await launchChrome(port);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  const jsErrors = [];
  const imageNetworkFailures = [];

  try {
    await client.open();
    client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => jsErrors.push(exceptionDetails.text));
    client.on("Runtime.consoleAPICalled", ({ type, args }) => {
      if (type === "error" || type === "assert") jsErrors.push(args.map((arg) => arg.value || arg.description).join(" "));
    });
    client.on("Network.loadingFailed", (event) => {
      if (event.type === "Image") imageNetworkFailures.push({ url: event.requestId, error: event.errorText });
    });

    await Promise.all([
      client.send("Page.enable"),
      client.send("Runtime.enable"),
      client.send("Network.enable"),
      client.send("Log.enable"),
      client.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile,
        screenWidth: width,
        screenHeight: height,
      }),
    ]);

    const loaded = client.once("Page.loadEventFired");
    await client.send("Page.navigate", { url: BASE_URL });
    await loaded;

    const start = Date.now();
    for (const at of [40, 160, 320, 520, 720, 920]) {
      await sleep(Math.max(0, at - (Date.now() - start)));
      await capture(client, directory, `load-${String(at).padStart(4, "0")}ms`);
    }

    const projectPositions = await evaluate(client, `
      [...document.querySelectorAll('[data-home-motion-project]')].map((node) => ({
        id: node.querySelector('.chapter-index')?.textContent.trim(),
        y: Math.max(0, node.getBoundingClientRect().top + scrollY - innerHeight * 0.58)
      }))
    `);
    const limit = Math.min(throughProject, projectPositions.length);
    for (let index = 0; index < limit; index += 1) {
      const project = projectPositions[index];
      await scrollTo(client, project.y, directory, `scroll-project-${project.id}`, mobile ? 72 : 110, mobile ? 70 : 65);
    }

    const links = await evaluate(client, "[...document.querySelectorAll('.project-chapter .case-entry')].map((link) => link.href)");
    const linkChecks = [];
    for (const url of links) {
      const response = await fetch(url);
      linkChecks.push({ url, status: response.status, ok: response.ok });
    }

    const pageChecks = await evaluate(client, `(() => {
      const root = document.querySelector('.home-v2');
      const images = [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src);
      const projectStates = [...document.querySelectorAll('[data-home-motion-project]')].map((node) => ({
        id: node.querySelector('.chapter-index')?.textContent.trim(),
        visibleClass: node.classList.contains('is-visible'),
        imageOpacity: getComputedStyle(node.querySelector('.project-visual')).opacity,
        copyOpacity: getComputedStyle(node.querySelector('.chapter-copy')).opacity,
      }));
      const result = {
        viewport: { width: innerWidth, height: innerHeight },
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        bodyHorizontalOverflow: Math.max(0, document.body.scrollWidth - document.documentElement.clientWidth),
        imageFailures: images,
        rootClasses: root.className,
        projectStates,
      };
      root.classList.remove('home-motion-ready', 'home-scroll-motion-ready');
      result.noMotionClassFallback = {
        titleOpacity: getComputedStyle(document.querySelector('.hero-title-group')).opacity,
        titleTransform: getComputedStyle(document.querySelector('.hero-title-group')).transform,
        projectImageOpacity: getComputedStyle(document.querySelector('.project-visual')).opacity,
        projectCopyOpacity: getComputedStyle(document.querySelector('.chapter-copy')).opacity,
      };
      return result;
    })()`);

    return { name, ...pageChecks, jsErrors, imageNetworkFailures, linkChecks, projectPositions };
  } finally {
    client.close();
    chrome.kill();
  }
}

async function auditReducedMotion() {
  const directory = path.join(OUTPUT_ROOT, "reduced-motion");
  await mkdir(directory, { recursive: true });
  const { chrome, target } = await launchChrome(9335);
  const client = new CdpClient(target.webSocketDebuggerUrl);

  try {
    await client.open();
    await Promise.all([
      client.send("Page.enable"),
      client.send("Runtime.enable"),
      client.send("Network.enable"),
      client.send("Emulation.setDeviceMetricsOverride", {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      }),
      client.send("Emulation.setEmulatedMedia", {
        media: "screen",
        features: [{ name: "prefers-reduced-motion", value: "reduce" }],
      }),
    ]);

    const loaded = client.once("Page.loadEventFired");
    await client.send("Page.navigate", { url: BASE_URL });
    await loaded;
    await sleep(80);
    await capture(client, directory, "reduced-motion-immediate");

    return await evaluate(client, `(() => {
      const title = getComputedStyle(document.querySelector('.hero-title-group'));
      const track = getComputedStyle(document.querySelector('.hero-track path'));
      const image = getComputedStyle(document.querySelector('.project-visual'));
      const copy = getComputedStyle(document.querySelector('.chapter-copy'));
      return {
        mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        rootClasses: document.querySelector('.home-v2').className,
        htmlScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        title: { opacity: title.opacity, transform: title.transform, animationName: title.animationName, animationDuration: title.animationDuration },
        track: { dasharray: track.strokeDasharray, dashoffset: track.strokeDashoffset, animationName: track.animationName },
        projectImage: { opacity: image.opacity, transform: image.transform, transitionDuration: image.transitionDuration },
        projectCopy: { opacity: copy.opacity, transform: copy.transform, transitionDuration: copy.transitionDuration },
      };
    })()`);
  } finally {
    client.close();
    chrome.kill();
  }
}

await mkdir(OUTPUT_ROOT, { recursive: true });
const desktop = await auditViewport({ name: "desktop-1440", port: 9333, width: 1440, height: 900, mobile: false, throughProject: 3 });
const mobile = await auditViewport({ name: "mobile-390", port: 9334, width: 390, height: 844, mobile: true, throughProject: 2 });
const reducedMotion = await auditReducedMotion();
const report = {
  generatedAt: new Date().toISOString(),
  previewUrl: BASE_URL,
  videoFallbackReason: "Chrome is available, but this environment has no Playwright/Puppeteer recorder and no FFmpeg/WebM encoder. Continuous browser keyframes were captured through CDP instead.",
  desktop,
  mobile,
  reducedMotion,
};
await writeFile(path.join(OUTPUT_ROOT, "audit-results.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
