import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const out = path.resolve("visual-audit-v2-final-integrated/homepage-390-mobile-menu.png");
const profile = await mkdtemp(path.join(os.tmpdir(), "stable-menu-"));
const server = spawn("python", ["-m", "http.server", "4190", "--bind", "127.0.0.1", "--directory", "dist"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--remote-debugging-port=12400", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
await sleep(800);

try {
  let target;
  for (let i = 0; i < 80; i += 1) {
    try { target = (await (await fetch("http://127.0.0.1:12400/json/list")).json()).find((item) => item.type === "page"); } catch {}
    if (target) break;
    await sleep(100);
  }
  if (!target) throw new Error("Chrome target unavailable");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", ({ data }) => { const message = JSON.parse(data); if (message.id) { const item = pending.get(message.id); pending.delete(message.id); item?.resolve(message.result); } });
  const send = (method, params = {}) => new Promise((resolve) => { const requestId = ++id; pending.set(requestId, { resolve }); ws.send(JSON.stringify({ id: requestId, method, params })); });
  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, mobile: true, screenWidth: 390, screenHeight: 844, deviceScaleFactor: 1 })]);
  await send("Page.navigate", { url: "http://127.0.0.1:4190/" });
  await sleep(2200);
  await send("Runtime.evaluate", { expression: "document.querySelector('.menu-button').click()" });
  await sleep(360);
  const state = await send("Runtime.evaluate", { expression: "(()=>{const b=document.querySelector('.menu-button'),n=document.querySelector('.mobile-nav'),s=getComputedStyle(n);return{expanded:b.getAttribute('aria-expanded'),ariaHidden:n.getAttribute('aria-hidden'),opacity:s.opacity,visibility:s.visibility,pointerEvents:s.pointerEvents}})()", returnByValue: true });
  const shot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await writeFile(out, Buffer.from(shot.data, "base64"));
  console.log(JSON.stringify(state.result.value));
  ws.close();
} finally {
  chrome.kill();
  server.kill();
}
