#!/usr/bin/env node
// tools/localize.mjs - Zero-dependency localizer for aekhw.com assets
// Features: controlled concurrency + jitter, retry, CSS nested url() handling, rewrite index.html to relative paths
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const INDEX_FILE = path.join(PROJECT_ROOT, 'index.html');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');
const HOST = 'aekhw.com';
const CONCURRENCY = Number(process.env.LOC_CONCURRENCY || 3);
const JITTER_MIN = Number(process.env.LOC_JITTER_MIN || 200);
const JITTER_MAX = Number(process.env.LOC_JITTER_MAX || 600);
const TIMEOUT_MS = Number(process.env.LOC_TIMEOUT || 15000);
const RETRIES = Number(process.env.LOC_RETRIES || 3);
// 允许的主机白名单，可通过环境变量 LOC_HOSTS 覆盖，逗号分隔
const ALLOWED_HOSTS = new Set((process.env.LOC_HOSTS || 'aekhw.com,fonts.gstatic.com,fonts.googleapis.com')
  .split(',').map(s=>s.trim()).filter(Boolean));
// 通用绝对 URL 匹配（排除引号/括号/尖括号/空白）
const ABS_URL = /https?:\/\/[^\s"'<>()]+/gi;

// --- 补回工具函数 ---
const ensureDir = async p => fs.mkdir(p, {recursive: true});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const jitter = () => JITTER_MIN + Math.floor(Math.random() * (JITTER_MAX - JITTER_MIN + 1));
const sha8 = t => crypto.createHash('md5').update(t).digest('hex').slice(0,8);
const pickSubdir = (ext) => {
  ext = (ext || '').toLowerCase();
  if (['.css'].includes(ext)) return 'css';
  if (['.js','.mjs'].includes(ext)) return 'js';
  if (['.png','.jpg','.jpeg','.gif','.svg','.webp','.ico','.bmp','.avif'].includes(ext)) return 'images';
  if (['.woff','.woff2','.ttf','.otf','.eot'].includes(ext)) return 'fonts';
  if (['.mp4','.webm','.ogg','.mp3','.wav'].includes(ext)) return 'media';
  return 'misc';
};

const fetchBuffer = (urlStr, attempt=0) => new Promise((resolve,reject) => {
  const isHttps = urlStr.startsWith('https:');
  const mod = isHttps ? https : http;
  const ctrl = new AbortController();
  const timer = setTimeout(()=>{ctrl.abort();}, TIMEOUT_MS);
  const u = new URL(urlStr);
  const hdrs = {
    'User-Agent':'Mozilla/5.0',
    'Accept':'*/*',
    'Accept-Language':'en-US,en;q=0.9,zh-CN;q=0.8',
    'Accept-Encoding':'gzip, deflate, br',
    'Connection':'keep-alive'
  };
  if (u.hostname.includes('fonts.googleapis.com')){
    hdrs['Accept'] = 'text/css,*/*;q=0.1';
  }
  if (u.hostname.includes('gstatic.com')){
    hdrs['Referer'] = 'https://fonts.googleapis.com/';
    hdrs['Origin'] = 'https://fonts.googleapis.com';
    hdrs['Accept'] = 'font/woff2,*/*;q=0.1';
  }
  const req = mod.get(urlStr, {signal: ctrl.signal, headers: hdrs}, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      const loc = res.headers.location;
      clearTimeout(timer);
      const nextUrl = (()=>{ try { return new URL(loc, urlStr).toString(); } catch { return loc; } })();
      resolve(fetchBuffer(nextUrl, attempt));
      return;
    }
    if (res.statusCode !== 200) {
      clearTimeout(timer);
      reject(new Error('HTTP '+res.statusCode+' for '+urlStr));
      return;
    }
    let stream = res;
    const enc = String(res.headers['content-encoding']||'').toLowerCase();
    if (enc.includes('br')) stream = res.pipe(zlib.createBrotliDecompress());
    else if (enc.includes('gzip')) stream = res.pipe(zlib.createGunzip());
    else if (enc.includes('deflate')) stream = res.pipe(zlib.createInflate());
    const chunks=[]; stream.on('data',d=>chunks.push(d));
    stream.on('end',()=>{clearTimeout(timer); resolve(Buffer.concat(chunks));});
    stream.on('error',(e)=>{clearTimeout(timer); reject(e);});
  });
  req.on('error',err=>{clearTimeout(timer); reject(err);});
});

async function politeDownload(urlStr, outFile){
  let lastErr = null;
  for(let a=0;a<=RETRIES;a++){
    try{
      await sleep(jitter());
      const buf = await fetchBuffer(urlStr);
      await ensureDir(path.dirname(outFile));
      const isCss = path.extname(outFile).toLowerCase() === '.css';
      if (isCss){
        let text = buf.toString('utf8');
        if (!/^\/\*\s*@source:/m.test(text)){
          text = `/* @source: ${urlStr} */\n` + text;
        }
        await fs.writeFile(outFile, text, 'utf8');
      }else{
        await fs.writeFile(outFile, buf);
      }
      return true;
    }catch(e){
      lastErr = e;
      if (a===RETRIES){
        console.error(`[download-fail] ${urlStr} -> ${outFile}: ${e?.message||e}`);
        return false;
      }
      await sleep(500 + a*700);
    }
  }
  return false;
}

function sanitizeName(name){
  return name.replace(/[\\:*?"<>|]/g,'_');
}

function targetPathFor(urlStr){
  const u = new URL(urlStr);
  let base = path.basename(u.pathname) || 'index';
  const ext = path.extname(base).toLowerCase();
  // keep query as hash suffix to avoid collisions
  const q = u.search ? '-'+sha8(u.search) : '';
  if (!ext) base += q; else base = base.replace(ext, q+ext);
  const sub = pickSubdir(ext || '.misc');
  return path.join(ASSETS_DIR, sub, sanitizeName(base));
}

// 修复：清理误注入的 diff 标记并统一为允许主机替换
async function rewriteInHtml(html, mapping){
  // Replace all absolute links (in allowed hosts) with mapped relative asset path
  return html.replace(ABS_URL, (m)=>{
    try { const h = new URL(m).hostname; if (!ALLOWED_HOSTS.has(h)) return m; } catch { return m; }
    const local = mapping.get(m);
    if (!local) return m;
    return path.posix.join('assets', path.posix.relative(ASSETS_DIR.replaceAll('\\','/'), local.replaceAll('\\','/')));
  });
}

async function localizeCssNested(filePath, baseUrl){
  try{
    let css = await fs.readFile(filePath, 'utf8');
    if (!baseUrl){
      const m = css.match(/^\/\*\s*@source:\s*(.*?)\s*\*\//m);
      if (m) baseUrl = m[1].trim();
    }
    const urlPat = /url\(\s*([^\)\s]+)\s*\)/gi; // capture inside url(...)
    const foundSet = new Set();
    let mm;
    while ((mm = urlPat.exec(css)) !== null) {
      let raw = mm[1];
      if (!raw) continue;
      // strip quotes
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith('\'') && raw.endsWith('\''))) {
        raw = raw.slice(1, -1);
      }
      if (raw.startsWith('data:') || raw.startsWith('about:') || raw.startsWith('#')) continue;
      try{
        let abs;
        if (/^https?:\/\//i.test(raw)) {
          abs = new URL(raw);
        } else if (baseUrl) {
          abs = new URL(raw, baseUrl);
        } else {
          continue;
        }
        if (abs.hostname && ALLOWED_HOSTS.has(abs.hostname)) {
          foundSet.add(abs.toString());
        }
      }catch{ /* ignore bad url */ }
    }
    const found = Array.from(foundSet);
    if (found.length===0) return { downloaded:0, rewritten:false };

    const mapCss = new Map();
    let ok=0;
    for (const u of found){
      const out = targetPathFor(u);
      const done = await politeDownload(u, out);
      if (done){ ok++; mapCss.set(u,out); }
    }

    if (ok>0){
      const rewritten = css.replace(urlPat, (match, p1)=>{
        let raw = p1;
        let quote = '';
        if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith('\'') && raw.endsWith('\''))){
          quote = raw[0];
          raw = raw.slice(1,-1);
        }
        if (raw.startsWith('data:') || raw.startsWith('about:') || raw.startsWith('#')) return match;
        let absStr;
        try{
          if (/^https?:\/\//i.test(raw)) absStr = raw;
          else if (baseUrl) absStr = new URL(raw, baseUrl).toString();
          else return match;
        }catch{ return match; }
        const local = mapCss.get(absStr);
        if (!local) return match;
        const rel = path.posix.relative(path.dirname(filePath).replaceAll('\\','/'), local.replaceAll('\\','/'));
        return `url(${quote}${rel}${quote})`;
      });
      await fs.writeFile(filePath, rewritten, 'utf8');
      return { downloaded: ok, rewritten: true };
    }
    return { downloaded:0, rewritten:false };
  }catch(e){ return { downloaded:0, rewritten:false }; }
}

async function walk(dir){
  const out = [];
  const ents = await fs.readdir(dir, {withFileTypes:true});
  for (const it of ents){
    const p = path.join(dir, it.name);
    if (it.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

async function fixLocalFontPathPluralization(filePath){
  try{
    let css = await fs.readFile(filePath, 'utf8');
    let changed = false;
    const re2 = /url\(\s*(["']?)\.\.\/font\/([^\)"'\s]+\.woff2)\1\s*\)/gi;
    let out = '';
    let lastIndex = 0;
    let m;
    while((m = re2.exec(css))!==null){
      const q = m[1];
      const name = m[2];
      const candidate = path.join(ASSETS_DIR, 'fonts', name);
      if (await exists(candidate)){
        changed = true;
        out += css.slice(lastIndex, m.index) + `url(${q}../fonts/${name}${q})`;
        lastIndex = re2.lastIndex;
      }
    }
    if (changed){
      out += css.slice(lastIndex);
      await fs.writeFile(filePath, out, 'utf8');
    }
    return {rewritten: changed};
  }catch{ return {rewritten:false}; }
}

async function exists(p){
  try{ await fs.stat(p); return true; } catch{ return false; }
}

function sanitizeAbsUrl(u){
  if (!u) return u;
  // 去掉结尾的引号/括号/分号等无效字符
  return u.replace(/[)"'""']+$/g, '');
}

function isLikelyAssetUrl(u){
  try{
    const url = new URL(u);
    const host = url.hostname;
    const p = url.pathname || '/';
    // 跳过裸主机或仅根路径（多为 dns-prefetch/preconnect）
    if (p === '/' || p === '') return false;
    // 允许 Google Fonts CSS（/css2）
    if (host.includes('fonts.googleapis.com')) return true;
    const ext = (p.split('/').pop()||'').toLowerCase();
    const i = ext.lastIndexOf('.');
    const dotExt = i>=0 ? ext.slice(i) : '';
    const allowed = new Set(['.css','.js','.mjs','.png','.jpg','.jpeg','.gif','.svg','.webp','.ico','.bmp','.avif','.mp4','.webm','.ogg','.mp3','.wav','.woff','.woff2','.ttf','.otf','.eot']);
    if (allowed.has(dotExt)) return true;
    return false;
  }catch{ return false; }
}

function buildGoogleCssUrlFromLocalFile(base){
  // 将文件名编码为 css2 API：family=<Fam>:ital,wght@0,<r1>;1,<r2>&display=swap
  if (!base.startsWith('css2-') || !base.endsWith('_swap.css')) return null;
  const body = base.slice('css2-'.length, -('_swap.css'.length));
  const m = body.match(/^(.*)italwght0([0-9.]+)1([0-9.]+)$/);
  if (!m) return null;
  const famRaw = m[1];
  const r1 = m[2];
  const r2 = m[3];
  // CamelCase -> 拆分空格，再用 + 连接；不要对 + 做 URL 编码
  const famSpaced = famRaw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g,' ').trim();
  const famParam = famSpaced.split(/\s+/).join('+');
  const q = `family=${famParam}:ital,wght@0,${r1};1,${r2}&display=swap`;
  return `https://fonts.googleapis.com/css2?${q}`;
}

async function hydrateAndReplaceLocalCssFromGoogle(filePath){
  try{
    const base = path.basename(filePath);
    const apiUrl = buildGoogleCssUrlFromLocalFile(base);
    if (!apiUrl) return { downloaded:0, rewritten:false };

    // 拉取 Google Fonts CSS
    let css;
    try { css = (await fetchBuffer(apiUrl)).toString('utf8'); }
    catch { return { downloaded:0, rewritten:false } }

    // 提取 gstatic 字体 URL 并下载到本地
    const urls = (css.match(ABS_URL) || []).filter(u=>{
      try{ const x=new URL(u); return x.hostname.includes('fonts.gstatic.com') && /\.woff2(?:$|\?)/i.test(x.pathname);}catch{return false}
    });
    if (urls.length===0) return { downloaded:0, rewritten:false };

    const map = new Map();
    let ok=0;
    for (const u of urls){
      const out = targetPathFor(u);
      const done = await politeDownload(u, out);
      if (done){
        ok++;
        map.set(u, out);
      }
    }

    // 重写 CSS 内的 url(...) 为相对路径
    const urlPat = /url\(\s*(["']?)([^)'"\s]+)\1\s*\)/gi;
    const rewritten = css.replace(urlPat, (m,q,raw)=>{
      try{
        const abs = new URL(raw);
        if (!abs.hostname.includes('fonts.gstatic.com')) return m;
        const local = map.get(abs.toString());
        if (!local) return m;
        const rel = path.posix.relative(path.dirname(filePath).replaceAll('\\','/'), local.replaceAll('\\','/'));
        return `url(${q}${rel}${q})`;
      }catch{ return m; }
    });

    // 加上 @source 便于后续二次处理
    const finalCss = (/^\/\*\s*@source:/m.test(rewritten) ? rewritten : `/* @source: ${apiUrl} */\n` + rewritten);
    await fs.writeFile(filePath, finalCss, 'utf8');
    return { downloaded: ok, rewritten: true };
  }catch{ return { downloaded:0, rewritten:false } }
}

async function processAllLocalCss(){
  const cssDir = path.join(ASSETS_DIR, 'css');
  try{
    const files = (await walk(cssDir)).filter(f=>f.toLowerCase().endsWith('.css'));
    let total=0, rew=0, gdl=0, grew=0, fixr=0;
    for (const f of files){
      // 1) 优先用 Google 回源覆盖本地 css2-*.css
      const g2 = await hydrateAndReplaceLocalCssFromGoogle(f);
      gdl += g2.downloaded||0; if (g2.rewritten) grew++;
      // 2) 处理 CSS 内部嵌套的绝对/相对 url()
      const r = await localizeCssNested(f, null);
      total += r.downloaded||0; if (r.rewritten) rew++;
      // 3) 兼容处理 ../font -> ../fonts 的路径复数化
      const fx = await fixLocalFontPathPluralization(f);
      if (fx.rewritten) fixr++;
    }
    console.log(JSON.stringify({css_scanned: files.length, css_downloaded: total, css_rewritten: rew, gfonts_downloaded: gdl, gfonts_rewritten: grew, local_fix_rewritten: fixr}));
  }catch{ /* ignore if no dir */ }
}

async function main(){
  const html = await fs.readFile(INDEX_FILE, 'utf8');
  const raw = html.match(ABS_URL) || [];
  const cleaned = Array.from(new Set(raw.map(sanitizeAbsUrl)));
  const urls = cleaned.filter(u => {
    try {
      const x = new URL(u);
      if (!ALLOWED_HOSTS.has(x.hostname)) return false;
      return isLikelyAssetUrl(u);
    } catch { return false; }
  });
  if (urls.length===0){
    // 即使没有远程 URL，也执行本地 CSS 的二次处理（如 ../font -> ../fonts 修复与嵌套 url() 本地化）
    await processAllLocalCss();
    console.log('No remote URLs found. Processed local CSS only.');
    return;
  }
  await ensureDir(ASSETS_DIR);
  const queue = urls.slice();
  const mapping = new Map();
  let active = 0, done = 0, fail = 0;

  await new Promise((resolve)=>{
    const next = ()=>{
      if (queue.length===0 && active===0) return resolve();
      while(active<CONCURRENCY && queue.length){
        const u = queue.shift();
        active++;
        const out = targetPathFor(u);
        politeDownload(u,out).then(ok=>{
          if (ok){ mapping.set(u, out); done++; if (out.endsWith('.css')) localizeCssNested(out, u); }
          else { fail++; }
        }).finally(()=>{ active--; next(); });
      }
    };
    next();
  });

  const newHtml = await rewriteInHtml(html, mapping);
  await fs.writeFile(INDEX_FILE, newHtml, 'utf8');

  // 二次遍历本地 CSS，处理未覆盖的相对 url()
  await processAllLocalCss();

  console.log(JSON.stringify({total: urls.length, success: done, failed: fail, mapped: mapping.size}, null, 2));
}

main().catch(e=>{ console.error(e); process.exit(1); });