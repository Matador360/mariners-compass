// Verify theme picker is fully visible after opening from the mobile "More" sheet.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9334;
const ORIGIN = "http://localhost:3000";
const OUT = ".picker-audit";
mkdirSync(OUT, { recursive: true });

const userDataDir = join(tmpdir(), `trident-picker-${Date.now()}`);
mkdirSync(userDataDir, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-gpu",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function fetchJson(p) {
  return (await fetch(`http://localhost:${PORT}${p}`)).json();
}
async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try { return await fetchJson("/json/version"); } catch { await wait(250); }
  }
  throw new Error("chrome didn't start");
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((res) => this.ws.addEventListener("open", () => res()));
    this.ws.addEventListener("message", (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id != null) {
        const p = this.pending.get(m.id);
        if (p) {
          this.pending.delete(m.id);
          m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
        }
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}

async function run() {
  const v = await waitForChrome();
  const cdp = new CDP(v.webSocketDebuggerUrl);
  await cdp.ready;

  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const s = (m, p) => cdp.send(m, p, sessionId);

  await s("Page.enable");
  await s("Runtime.enable");
  await s("Emulation.setDeviceMetricsOverride", {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
    screenOrientation: { type: "portraitPrimary", angle: 0 },
  });
  await s("Emulation.setUserAgentOverride", {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  });
  await s("Page.addScriptToEvaluateOnNewDocument", {
    source: `try { window.localStorage.setItem("trident:theme", "dark"); document.documentElement.dataset.theme = "dark"; } catch(e){}`,
  });

  await s("Page.navigate", { url: `${ORIGIN}/` });
  await wait(2500);
  await s("Runtime.evaluate", { expression: "document.fonts ? document.fonts.ready : true", awaitPromise: true });

  // Open mobile "More" sheet by tapping the menu button (filter to visible buttons —
  // the desktop nav has a "More" button too but is display:none at mobile width).
  const opened = await s("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const more = btns.find(b => /^\\s*More\\s*$/.test((b.textContent || '').trim()));
      if (!more) return { ok: false, reason: 'no More button' };
      more.click();
      return { ok: true, rect: more.getBoundingClientRect() };
    })()`,
    returnByValue: true,
  });
  console.log("open more sheet:", opened.result.value);
  await wait(500);

  // Open the theme picker inside the sheet (filter to visible).
  const pickerOpen = await s("Runtime.evaluate", {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button[aria-haspopup="listbox"]')).filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const themeBtn = btns.find(b => /Theme:/.test(b.getAttribute('aria-label') || ''));
      if (!themeBtn) return { ok: false, reason: 'no theme button', candidates: btns.length };
      const rect = themeBtn.getBoundingClientRect();
      themeBtn.click();
      return { ok: true, rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }, vh: window.innerHeight };
    })()`,
    returnByValue: true,
  });
  console.log("open theme picker:", pickerOpen.result.value);
  await wait(400);

  // Capture geometry of the popover after it opens.
  const popover = await s("Runtime.evaluate", {
    expression: `(() => {
      const lb = document.querySelector('[role="listbox"][aria-label="Choose theme"]');
      if (!lb) return { ok: false, reason: 'no popover' };
      const r = lb.getBoundingClientRect();
      const cs = getComputedStyle(lb);
      const allItems = lb.querySelectorAll('[role="option"]');
      const visibleItems = Array.from(allItems).filter((el) => {
        const er = el.getBoundingClientRect();
        return er.bottom <= window.innerHeight && er.top >= 0;
      }).length;
      return {
        ok: true,
        top: r.top, bottom: r.bottom, height: r.height,
        viewportHeight: window.innerHeight,
        belowViewport: r.bottom > window.innerHeight,
        aboveViewport: r.top < 0,
        totalItems: allItems.length,
        visibleItems,
        maxHeight: cs.maxHeight,
        overflowY: cs.overflowY,
      };
    })()`,
    returnByValue: true,
  });
  console.log("popover:", popover.result.value);

  // Screenshot the result.
  const { data } = await s("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `theme-picker-mobile.png`), Buffer.from(data, "base64"));
  console.log(`screenshot: ${OUT}/theme-picker-mobile.png`);

  cdp.ws.close();
  chrome.kill();
  await wait(300);
  try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
}

run().catch((err) => { console.error(err); chrome.kill(); process.exit(1); });
