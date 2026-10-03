/**
 * Regenerates the artwork for the journey "works" panels.
 *
 *   bun scripts/works/build.ts            # rebuild every work in content/journey/works.json
 *   bun scripts/works/build.ts fastcut    # rebuild only the given slug(s)
 *
 * For each entry in works.json it produces public/journey/works/<slug>.jpg
 * (1600x1000, sRGB JPEG, <= 350 KB) and refreshes `videoTitle` / `tweetText`
 * in works.json from the live sources:
 *
 *   kind "youtube" -> highest-res thumbnail (maxres -> sd -> hq), letterbox bars
 *                     trimmed, whole frame centred on a blurred copy of itself
 *                     (darkened for vertical/short thumbnails).
 *   kind "x"       -> tweet card rendered from X's public syndication JSON
 *                     (the endpoint react-tweet uses) through an HTML template.
 *                     An X Article is drawn as its cover image over its title.
 *   kind "web"     -> 1440x900 screenshot of `captureUrl ?? url`, placed in a
 *                     browser-window frame on a solid background.
 *
 * Adding a work = append an object to works.json and run this script.
 * Optional per-work fields used only by this script:
 *   captureUrl  (web)   page to screenshot when it differs from the click target
 *   frameLabel  (web)   text shown in the frame's address pill (default: url host)
 *   settleMs    (web)   extra wait after load before the screenshot (default 6000)
 *   hideMedia   (x)     draw the post as text only, without its photo or video
 *   youtubeFit  (youtube) "contain" (default: whole frame on a blurred copy) or "cover" (crop to 16:10)
 *
 * Needs Google Chrome (override with CHROME_PATH) and `sharp` (already in node_modules).
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const ROOT = resolve(__dirname, "../..");
const DATA = join(ROOT, "content/journey/works.json");
const OUT_DIR = join(ROOT, "public/journey/works");
const W = 1600;
const H = 1000;
const MAX_BYTES = 350 * 1024;
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

type Work = {
  slug: string;
  year: string;
  date: string | null;
  kind: "youtube" | "x" | "web";
  url: string;
  image: string;
  title: string;
  subtitle: string;
  source: string;
  videoTitle?: string;
  tweetText?: string;
  captureUrl?: string;
  frameLabel?: string;
  settleMs?: number;
  youtubeFit?: "contain" | "cover";
  hideMedia?: boolean;
};

// ---------------------------------------------------------------- utilities

async function fetchBuffer(url: string): Promise<Buffer | null> {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function dataUri(buf: Buffer, mime = "image/jpeg") {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function decodeEntities(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Encode to a 1600x1000 sRGB JPEG under MAX_BYTES, stepping quality down if needed. */
async function writeJpeg(input: Buffer, slug: string) {
  const base = sharp(input).resize(W, H, { fit: "cover" }).removeAlpha().toColourspace("srgb");
  let out: Buffer = Buffer.alloc(0);
  for (let q = 85; q >= 60; q -= 5) {
    out = await base.clone().jpeg({ quality: q, mozjpeg: true, chromaSubsampling: "4:2:0" }).toBuffer();
    if (out.length <= MAX_BYTES) break;
  }
  const file = join(OUT_DIR, `${slug}.jpg`);
  writeFileSync(file, out);
  return { file, kb: Math.round(out.length / 1024) };
}

// ------------------------------------------------------- headless Chrome/CDP

class Chrome {
  private proc!: ChildProcess;
  private profile!: string;
  private port = 0;

  async start() {
    this.profile = mkdtempSync(join(tmpdir(), "works-chrome-"));
    this.proc = spawn(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--mute-audio",
        "--remote-debugging-port=0",
        `--user-data-dir=${this.profile}`,
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    this.port = await new Promise<number>((ok, fail) => {
      let buf = "";
      const t = setTimeout(() => fail(new Error("Chrome did not start")), 20000);
      this.proc.stderr!.on("data", (d: Buffer) => {
        buf += d.toString();
        const m = buf.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
        if (m) {
          clearTimeout(t);
          ok(Number(m[1]));
        }
      });
    });
  }

  stop() {
    this.proc?.kill("SIGKILL");
    try {
      rmSync(this.profile, { recursive: true, force: true });
    } catch {}
  }

  /** Load `url` in a fresh tab at width x height (DPR 1) and return a PNG of the viewport. */
  async screenshot(url: string, width: number, height: number, settleMs: number): Promise<Buffer> {
    const target = (await (
      await fetch(`http://127.0.0.1:${this.port}/json/new?about:blank`, { method: "PUT" })
    ).json()) as { id: string; webSocketDebuggerUrl: string };
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise<void>((ok, fail) => {
      ws.onopen = () => ok();
      ws.onerror = () => fail(new Error("CDP socket error"));
    });
    let nextId = 1;
    const pending = new Map<number, (v: unknown) => void>();
    const listeners = new Map<string, () => void>();
    ws.onmessage = (ev: MessageEvent) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)!(msg.result ?? msg.error);
        pending.delete(msg.id);
      } else if (msg.method && listeners.has(msg.method)) {
        listeners.get(msg.method)!();
      }
    };
    const send = (method: string, params: object = {}) =>
      new Promise<any>((ok) => {
        const id = nextId++;
        pending.set(id, ok);
        ws.send(JSON.stringify({ id, method, params }));
      });
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    try {
      await send("Page.enable");
      // Archived pages (web.archive.org id_ snapshots) ship a CSP that blocks the site's own CDN.
      await send("Page.setBypassCSP", { enabled: true });
      await send("Network.setUserAgentOverride", { userAgent: UA });
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await send("Emulation.setScrollbarsHidden", { hidden: true });
      const loaded = new Promise<void>((ok) => listeners.set("Page.loadEventFired", ok));
      await send("Page.navigate", { url });
      await Promise.race([loaded, sleep(45000)]);
      // let fonts, lazy images and entrance animations finish
      await send("Runtime.evaluate", {
        expression: "document.fonts ? document.fonts.ready.then(() => true) : true",
        awaitPromise: true,
      });
      await sleep(settleMs);
      // Hide images that never loaded so they don't show as broken-image glyphs.
      await send("Runtime.evaluate", {
        expression:
          "document.querySelectorAll('img').forEach(i => { if (i.complete && i.naturalWidth === 0) i.style.visibility = 'hidden'; })",
      });
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        clip: { x: 0, y: 0, width, height, scale: 1 },
        captureBeyondViewport: false,
      });
      if (!shot?.data) throw new Error(`screenshot failed for ${url}`);
      return Buffer.from(shot.data, "base64");
    } finally {
      ws.close();
      await fetch(`http://127.0.0.1:${this.port}/json/close/${target.id}`).catch(() => {});
    }
  }

  /** Render an HTML string at 1600x1000. */
  async renderHtml(html: string, tmp: string, name: string) {
    const file = join(tmp, `${name}.html`);
    writeFileSync(file, html);
    return this.screenshot(pathToFileURL(file).href, W, H, 800);
  }
}

// ------------------------------------------------------------------ YouTube

function youtubeId(url: string) {
  const u = new URL(url);
  if (u.hostname === "youtu.be") return u.pathname.slice(1);
  const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);
  return m ? m[1] : u.searchParams.get("v");
}

async function buildYoutube(work: Work) {
  const id = youtubeId(work.url);
  if (!id) throw new Error(`no video id in ${work.url}`);
  const oembed = await fetchJson<{ title: string }>(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
  );
  if (oembed?.title) work.videoTitle = oembed.title;
  else console.warn(`  ! oEmbed failed for ${id} (private or removed?)`);

  let thumb: Buffer | null = null;
  let quality = "";
  for (const q of ["maxresdefault", "sddefault", "hqdefault"]) {
    thumb = await fetchBuffer(`https://i.ytimg.com/vi/${id}/${q}.jpg`);
    if (thumb) {
      quality = q;
      console.log(`  thumbnail: ${q}`);
      break;
    }
  }
  if (!thumb) throw new Error(`no thumbnail for ${id} (video private or removed)`);

  // Trim letterbox / pillarbox bars (sd/hq thumbnails are 4:3 with black bars; shorts are pillarboxed).
  // A regular maxres thumbnail is already 16:9 edge to edge, so leave dark edges on those alone.
  const needsTrim = quality !== "maxresdefault" || /\/shorts\//.test(work.url);
  const trimmed = !needsTrim
    ? null
    : await sharp(thumb)
    .trim({ background: "#000000", threshold: 24 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => null);
  const content = trimmed && trimmed.info.width > 200 && trimmed.info.height > 200 ? trimmed.data : thumb;
  const meta = await sharp(content).metadata();
  const aspect = meta.width! / meta.height!;

  if (aspect >= 1.3 && work.youtubeFit === "cover") {
    return sharp(content).resize(W, H, { fit: "cover", position: "centre" }).png().toBuffer();
  }
  const fg = await sharp(content).resize({ height: H, width: W, fit: "inside" }).png().toBuffer();
  const fgMeta = await sharp(fg).metadata();
  if (aspect >= 1.3) {
    // Show the whole 16:9 frame (thumbnail text often runs to the edges); the thin bands above and
    // below are a blurred mirror of the frame's own edges, so colours stay continuous.
    const padY = H - fgMeta.height!;
    const padX = W - fgMeta.width!;
    const bg = await sharp(fg)
      .extend({
        top: Math.floor(padY / 2),
        bottom: Math.ceil(padY / 2),
        left: Math.floor(padX / 2),
        right: Math.ceil(padX / 2),
        extendWith: "mirror",
      })
      .blur(20)
      .png()
      .toBuffer();
    return sharp(bg).composite([{ input: fg, gravity: "center" }]).png().toBuffer();
  }
  // Vertical / square (shorts): centre on a blurred, darkened copy of itself.
  const bg = await sharp(content)
    .resize(W, H, { fit: "cover" })
    .blur(48)
    .modulate({ brightness: 0.45 })
    .png()
    .toBuffer();
  return sharp(bg).composite([{ input: fg, gravity: "center" }]).png().toBuffer();
}

// ------------------------------------------------------------------------ X

type Syndication = {
  text: string;
  created_at: string;
  display_text_range?: [number, number];
  note_tweet?: { id: string };
  entities?: {
    urls?: { url: string; display_url: string }[];
    media?: { url: string }[];
  };
  user: { name: string; screen_name: string; profile_image_url_https: string; is_blue_verified?: boolean };
  mediaDetails?: { type: string; media_url_https: string }[];
  /** Present when the post is an X Article: only its title, opening and cover are public. */
  article?: {
    title: string;
    preview_text?: string;
    cover_media?: { media_info?: { original_img_url?: string } };
  };
};

function tweetId(url: string) {
  const m = url.match(/status\/(\d+)/);
  if (!m) throw new Error(`no tweet id in ${url}`);
  return m[1];
}

async function fetchTweet(id: string): Promise<Syndication> {
  const token = ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
  for (const t of [token, "a", ""]) {
    const data = await fetchJson<Syndication & { __typename?: string }>(
      `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${t}`,
    );
    if (data?.text) return data;
  }
  throw new Error(`X syndication unreachable for ${id}; refusing to invent tweet text`);
}

function tweetBodyText(t: Syndication) {
  let text = t.text;
  for (const m of t.entities?.media ?? []) text = text.split(m.url).join("");
  for (const u of t.entities?.urls ?? []) text = text.split(u.url).join(u.display_url);
  text = decodeEntities(text).trim();
  // Long ("note") tweets only expose the first ~280 chars publicly; show it the way X does.
  const truncated = Boolean(t.note_tweet);
  return { text: truncated ? `${text}…` : text, truncated };
}

const X_LOGO = `<svg viewBox="0 0 24 24" width="52" height="52" fill="#e7e9ea"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
const BADGE = `<svg viewBox="0 0 22 22" width="40" height="40"><path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>`;

/** An X Article: the cover across the top, then who wrote it and the title. */
async function buildArticle(work: Work, t: Syndication, chrome: Chrome, tmp: string) {
  const article = t.article!;
  work.tweetText = article.title;
  const avatar = await fetchBuffer(t.user.profile_image_url_https.replace("_normal", "_400x400"));
  const coverUrl = article.cover_media?.media_info?.original_img_url;
  const cover = coverUrl ? await fetchBuffer(`${coverUrl}?name=large`) : null;
  const opening = (article.preview_text ?? "").split("\n")[0].trim();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; background: #000; overflow: hidden; }
  body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", sans-serif;
         color: #e7e9ea; -webkit-font-smoothing: antialiased; }
  .card { position: absolute; inset: 0; padding: 64px 96px; display: flex; flex-direction: column; justify-content: center; gap: 44px; }
  .cover { width: 100%; height: 500px; border-radius: 28px; object-fit: cover; border: 2px solid #2f3336; display: block; }
  .head { display: flex; align-items: center; gap: 22px; }
  .avatar { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; flex: none; }
  .name { font-size: 36px; font-weight: 700; display: flex; align-items: center; gap: 10px; line-height: 1.1; }
  .handle { font-size: 30px; color: #71767b; margin-top: 4px; }
  .x { margin-left: auto; }
  .title { font-size: 66px; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
  .opening { font-size: 36px; line-height: 1.35; color: #8b98a5; }
  </style></head><body><div class="card">
    ${cover ? `<img class="cover" src="${dataUri(cover)}">` : ""}
    <div class="head">
      ${avatar ? `<img class="avatar" src="${dataUri(avatar)}">` : ""}
      <div><div class="name">${esc(t.user.name)}${t.user.is_blue_verified ? BADGE : ""}</div>
      <div class="handle">@${esc(t.user.screen_name)}</div></div>
      <div class="x">${X_LOGO}</div>
    </div>
    <div class="title">${esc(article.title)}</div>
    ${cover || !opening ? "" : `<div class="opening">${esc(opening)}</div>`}
  </div></body></html>`;
  return chrome.renderHtml(html, tmp, work.slug);
}

async function buildTweet(work: Work, chrome: Chrome, tmp: string) {
  const t = await fetchTweet(tweetId(work.url));
  if (t.article) return buildArticle(work, t, chrome, tmp);
  const { text, truncated } = tweetBodyText(t);
  work.tweetText = text;

  const avatar = await fetchBuffer(t.user.profile_image_url_https.replace("_normal", "_400x400"));
  const mediaUrl = work.hideMedia ? undefined : t.mediaDetails?.[0]?.media_url_https;
  const media = mediaUrl ? await fetchBuffer(`${mediaUrl}?name=large`) : null;
  const mediaMeta = media ? await sharp(media).metadata() : null;
  const isVideo = t.mediaDetails?.[0]?.type === "video" || t.mediaDetails?.[0]?.type === "animated_gif";

  const date = new Date(t.created_at);
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  // Paragraphs get a half-line gap instead of a full blank line so long tweets fit.
  const bodyHtml = text
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p>${esc(para)
          .replace(/(^|\s)(@\w+|#\w+)/g, '$1<span class="link">$2</span>')
          .replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  const longText = text.length > 160;
  const vertical = mediaMeta ? mediaMeta.height! > mediaMeta.width! : false;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; background: #000; overflow: hidden; }
  body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", sans-serif;
         color: #e7e9ea; -webkit-font-smoothing: antialiased; }
  .card { position: absolute; inset: 0; padding: 84px 96px; display: flex; gap: 72px; align-items: center; }
  .col { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .head { display: flex; align-items: center; gap: 26px; margin-bottom: 44px; }
  .avatar { width: 112px; height: 112px; border-radius: 50%; object-fit: cover; flex: none; }
  .name { font-size: 42px; font-weight: 700; display: flex; align-items: center; gap: 10px; line-height: 1.1; }
  .handle { font-size: 34px; color: #71767b; margin-top: 6px; }
  .x { margin-left: auto; align-self: flex-start; }
  .text { font-size: ${longText ? 44 : 56}px; line-height: 1.3; letter-spacing: -0.005em; word-wrap: break-word; }
  .text p + p { margin-top: 0.6em; }
  .more { color: #1d9bf0; font-size: ${longText ? 40 : 48}px; margin-top: 10px; }
  .link { color: #1d9bf0; }
  .meta { margin-top: 44px; font-size: 32px; color: #71767b; }
  .media { flex: none; position: relative; border-radius: 28px; overflow: hidden; border: 2px solid #2f3336;
           ${vertical ? "height: 832px; width: 468px;" : "width: 700px; height: 394px;"} }
  .media img { width: 100%; height: 100%; object-fit: cover; object-position: center ${vertical ? "top" : "center"}; display: block; }
  .play { position: absolute; left: 50%; top: 50%; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%;
          background: #1d9bf0; border: 6px solid #fff; display: grid; place-items: center; }
  .play:after { content: ""; margin-left: 10px; border-left: 40px solid #fff; border-top: 24px solid transparent; border-bottom: 24px solid transparent; }
  </style></head><body><div class="card">
    <div class="col">
      <div class="head">
        ${avatar ? `<img class="avatar" src="${dataUri(avatar)}">` : ""}
        <div><div class="name">${esc(t.user.name)}${t.user.is_blue_verified ? BADGE : ""}</div>
        <div class="handle">@${esc(t.user.screen_name)}</div></div>
        ${media ? "" : `<div class="x">${X_LOGO}</div>`}
      </div>
      <div class="text">${bodyHtml}</div>
      ${truncated ? `<div class="more">Show more</div>` : ""}
      <div class="meta">${time} · ${day}</div>
    </div>
    ${media ? `<div class="media"><img src="${dataUri(media)}">${isVideo ? `<div class="play"></div>` : ""}</div>` : ""}
  </div></body></html>`;
  return chrome.renderHtml(html, tmp, work.slug);
}

// ---------------------------------------------------------------------- web

async function buildWeb(work: Work, chrome: Chrome, tmp: string) {
  const target = work.captureUrl ?? work.url;
  const shot = await chrome.screenshot(target, 1440, 900, work.settleMs ?? 6000);
  const label = work.frameLabel ?? new URL(work.url).host.replace(/^www\./, "");
  // Window: 1408x880 screenshot + 44px title bar = 924 tall, centred on 1600x1000.
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #0d0d0e;
               font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; }
  .win { position: absolute; left: 96px; top: 38px; width: 1408px; border-radius: 16px; overflow: hidden;
         background: #1f1f22; box-shadow: 0 30px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.09); }
  .bar { height: 44px; display: flex; align-items: center; padding: 0 18px; position: relative; }
  .dot { width: 14px; height: 14px; border-radius: 50%; margin-right: 9px; background: #4a4a4f; }
  .url { position: absolute; left: 50%; transform: translateX(-50%); height: 28px; min-width: 360px; padding: 0 22px;
         border-radius: 8px; background: #2c2c30; color: #a1a1a8; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .shot { display: block; width: 1408px; height: 880px; }
  </style></head><body>
  <div class="win"><div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span>
  <div class="url">${esc(label)}</div></div><img class="shot" src="${dataUri(shot, "image/png")}"></div>
  </body></html>`;
  return chrome.renderHtml(html, tmp, work.slug);
}

// --------------------------------------------------------------------- main

async function main() {
  const works = JSON.parse(readFileSync(DATA, "utf8")) as Work[];
  const only = process.argv.slice(2);
  const todo = only.length ? works.filter((w) => only.includes(w.slug)) : works;
  if (only.length && todo.length !== only.length) {
    const missing = only.filter((s) => !works.some((w) => w.slug === s));
    throw new Error(`unknown slug(s): ${missing.join(", ")}`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "works-build-"));
  const chrome = new Chrome();
  await chrome.start();
  const failures: string[] = [];
  try {
    for (const work of todo) {
      console.log(`${work.slug} (${work.kind})`);
      try {
        const png =
          work.kind === "youtube"
            ? await buildYoutube(work)
            : work.kind === "x"
              ? await buildTweet(work, chrome, tmp)
              : await buildWeb(work, chrome, tmp);
        const { kb } = await writeJpeg(png, work.slug);
        work.image = `/journey/works/${work.slug}.jpg`;
        console.log(`  -> public${work.image} (${kb} KB)`);
      } catch (err) {
        failures.push(work.slug);
        console.error(`  ! ${(err as Error).message}`);
      }
    }
  } finally {
    chrome.stop();
    rmSync(tmp, { recursive: true, force: true });
  }
  writeFileSync(DATA, `${JSON.stringify(works, null, 2)}\n`);
  if (failures.length) {
    console.error(`\nFailed: ${failures.join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
