// Theme audit: launch headless Chrome via CDP, screenshot each page in each theme at mobile viewport.
// Usage: node scripts/theme-audit.mjs [--themes a,b] [--pages /,/game] [--out .theme-audit]
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";

const argv = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const THEMES = (argv.themes || "dark,light,twilight,sunset-edgar,teal-classic,throwback-1995,playoff-push").split(",");
const PAGES = (argv.pages || "/,/schedule,/stats,/roster,/history").split(",");
const OUT = argv.out || ".theme-audit";

mkdirSync(OUT, { recursive: true });

const userDataDir = join(tmpdir(), `trident-cdp-${Date.now()}`);
mkdirSync(userDataDir, { recursive: true });

const chromeArgs = [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDataDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--disable-gpu",
  "--hide-scrollbars",
  "about:blank",
];

console.log(`launching chrome at port ${PORT}...`);
const chrome = spawn(CHROME, chromeArgs, { stdio: "ignore", detached: false });

async function fetchJson(path) {
  const res = await fetch(`http://localhost:${PORT}${path}`);
  return res.json();
}

async function waitForChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const v = await fetchJson("/json/version");
      return v;
    } catch {
      await wait(250);
    }
  }
  throw new Error("Chrome did not become ready");
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", () => resolve());
      this.ws.addEventListener("error", (e) => reject(e));
    });
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id != null) {
        const p = this.pending.get(msg.id);
        if (p) {
          this.pending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error.message));
          else p.resolve(msg.result);
        }
      } else if (msg.method) {
        const ls = this.listeners.get(msg.method);
        if (ls) ls.forEach((fn) => fn(msg.params));
      }
    });
  }
  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(fn);
    return () => this.listeners.get(method).delete(fn);
  }
  once(method) {
    return new Promise((resolve) => {
      const off = this.on(method, (params) => {
        off();
        resolve(params);
      });
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }
}

async function run() {
  const version = await waitForChrome();
  console.log(`chrome ready: ${version.Browser}`);
  const cdp = new CDP(version.webSocketDebuggerUrl);
  await cdp.ready;

  for (const theme of THEMES) {
    for (const page of PAGES) {
      const safePath = page.replace(/[^a-z0-9]+/gi, "_") || "_root";
      const file = join(OUT, `${theme}__${safePath}.png`);
      console.log(`-> ${theme} ${page}`);

      // Create a new browser target (tab)
      const { targetId } = await cdp.send("Target.createTarget", {
        url: "about:blank",
      });
      const { sessionId } = await cdp.send("Target.attachToTarget", {
        targetId,
        flatten: true,
      });

      const session = (m, p) => cdp.send(m, p, sessionId);

      await session("Page.enable");
      await session("Runtime.enable");
      await session("Network.enable");

      // Mobile viewport — iPhone 13/14 Pro: 390x844 @3x DPR
      await session("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        mobile: true,
        screenOrientation: { type: "portraitPrimary", angle: 0 },
      });
      await session("Emulation.setUserAgentOverride", {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      });

      // Inject localStorage theme BEFORE the page loads.
      await session("Page.addScriptToEvaluateOnNewDocument", {
        source: `
          try {
            window.localStorage.setItem("trident:theme", ${JSON.stringify(theme)});
            // Pre-stamp the document attribute so first paint already has the right tokens.
            document.documentElement.dataset.theme = ${JSON.stringify(theme)};
          } catch (e) {}
        `,
      });

      // Navigate
      const url = `${ORIGIN}${page}`;
      const navP = session("Page.navigate", { url });
      const loadEvent = new Promise((resolve) => {
        const unsub = cdp.on("Page.loadEventFired", (params) => {
          // Only react to events for our session — CDP routes them via sessionId field on the *outer* message; our `on` listens flat.
          // We just resolve on the first load event after navigate; good enough for one tab at a time.
          unsub();
          resolve(params);
        });
      });
      await navP;
      await Promise.race([loadEvent, wait(15000)]);

      // Settle: give React/effects time, then wait for fonts.
      await wait(800);
      await session("Runtime.evaluate", {
        expression: "document.fonts ? document.fonts.ready.then(() => true) : true",
        awaitPromise: true,
      }).catch(() => {});

      // Capture full-page screenshot at mobile viewport (cap height to keep file small).
      const { contentSize } = await session("Page.getLayoutMetrics");
      const captureHeight = Math.min(Math.round(contentSize.height), 4000);

      await session("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: captureHeight,
        deviceScaleFactor: 2,
        mobile: true,
        screenOrientation: { type: "portraitPrimary", angle: 0 },
      });

      const { data } = await session("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      writeFileSync(file, Buffer.from(data, "base64"));

      // Pull a quick computed-style probe so we can flag readability issues.
      const { result } = await session("Runtime.evaluate", {
        expression: `(() => {
          const probe = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const cs = getComputedStyle(el);
            return {
              tag: el.tagName,
              text: (el.textContent || '').slice(0, 60).trim(),
              fontSize: cs.fontSize,
              color: cs.color,
              bg: cs.backgroundColor,
            };
          };
          const overlines = Array.from(document.querySelectorAll('.label-overline')).slice(0, 5).map((el) => {
            const cs = getComputedStyle(el);
            return { text: el.textContent.trim().slice(0, 40), fontSize: cs.fontSize, color: cs.color };
          });
          const muteds = Array.from(document.querySelectorAll('.text-muted, [class*="text-muted"], .text-secondary, [class*="text-slate-400"], [class*="text-slate-500"]')).slice(0, 8).map((el) => {
            const cs = getComputedStyle(el);
            return { text: el.textContent.trim().slice(0, 40), fontSize: cs.fontSize, color: cs.color, cls: el.className.toString().slice(0, 80) };
          });
          const tableCells = Array.from(document.querySelectorAll('td, .stat-line, .stat-value')).slice(0, 5).map((el) => {
            const cs = getComputedStyle(el);
            return { text: el.textContent.trim().slice(0, 40), fontSize: cs.fontSize, color: cs.color };
          });
          return {
            theme: document.documentElement.dataset.theme,
            bodyBg: getComputedStyle(document.body).backgroundColor,
            bodyColor: getComputedStyle(document.body).color,
            overlines, muteds, tableCells,
            overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            scrollW: document.documentElement.scrollWidth,
            innerW: document.documentElement.clientWidth,
          };
        })()`,
        returnByValue: true,
      });
      writeFileSync(
        join(OUT, `${theme}__${safePath}.json`),
        JSON.stringify(result.value, null, 2),
      );

      await cdp.send("Target.closeTarget", { targetId });
    }
  }

  cdp.ws.close();
  chrome.kill();
  await wait(500);
  try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  console.log(`done. screenshots and probes in ${OUT}`);
}

run().catch((err) => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});
