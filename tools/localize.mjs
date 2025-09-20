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
      } else {
        await fs.writeFile(outFile, buf);
      }
      return;
    } catch(e){
      lastErr = e;
      if(a<RETRIES) console.log(`  Retry ${a+1}/${RETRIES} for ${urlStr}: ${e.message}`);
    }
  }
  throw lastErr;
}

function sanitizeName(name){
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/^\.+|\.+$/g, '');
}

function targetPathFor(urlStr){
  const u = new URL(urlStr);
  let base = path.basename(u.pathname) || 'index';
  if (u.search) base += '-' + sha8(u.search);
  base = sanitizeName(base);
  const ext = path.extname(base).toLowerCase();
  const sub = pickSubdir(ext || '.misc');
  return path.join(ASSETS_DIR, sub, base);
}

// 在 HTML 中替换 URL
async function rewriteInHtml(html, mapping){
  let result = html;
  for(const [orig, local] of mapping){
    const rel = path.posix.relative('.', local.replace(/\\/g, '/'));
    result = result.replaceAll(orig, rel);
  }
  return result;
}

async function localizeCssNested(filePath, baseUrl){
  let content = await fs.readFile(filePath, 'utf8');
  const urls = [];
  const urlPattern = /url\(['"]?([^'"()]+)['"]?\)/gi;
  let match;
  while((match = urlPattern.exec(content)) !== null){
    const u = match[1];
    if(u.startsWith('http://') || u.startsWith('https://')){
      urls.push(u);
    } else if(u.startsWith('//')){
      urls.push('https:' + u);
    } else if(u.startsWith('/')){
      const base = new URL(baseUrl);
      urls.push(`${base.protocol}//${base.host}${u}`);
    } else {
      const resolved = new URL(u, baseUrl).toString();
      urls.push(resolved);
    }
  }
  
  const mapping = new Map();
  const semaphore = [];
  
  for(const url of urls){
    if(semaphore.length >= CONCURRENCY){
      await semaphore.shift();
    }
    
    const promise = (async () => {
      try{
        const u = new URL(url);
        if(!ALLOWED_HOSTS.has(u.hostname)){
          console.log(`  Skipping ${url} (host not in whitelist)`);
          return;
        }
        
        const localPath = targetPathFor(url);
        const exists = await fs.access(localPath).then(()=>true).catch(()=>false);
        if(!exists){
          console.log(`  Downloading nested: ${url}`);
          await politeDownload(url, localPath);
        }
        
        const relPath = path.posix.relative(path.dirname(filePath), localPath).replace(/\\/g, '/');
        mapping.set(url, relPath);
      } catch(e){
        console.log(`  Failed to download nested ${url}: ${e.message}`);
      }
    })();
    
    semaphore.push(promise);
  }
  
  await Promise.all(semaphore);
  
  // 替换 CSS 中的 URL
  for(const [orig, local] of mapping){
    const pattern = new RegExp(`url\\(['"]?${orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?\\)`, 'gi');
    content = content.replace(pattern, `url('${local}')`);
  }
  
  await fs.writeFile(filePath, content, 'utf8');
  console.log(`  Updated ${urls.length} nested URLs in ${path.basename(filePath)}`);
}

async function walk(dir){
  const files = [];
  const entries = await fs.readdir(dir, {withFileTypes: true});
  for(const entry of entries){
    const fullPath = path.join(dir, entry.name);
    if(entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

async function fixLocalFontPathPluralization(filePath){
  let content = await fs.readFile(filePath, 'utf8');
  const changed = content.replace(
    /url\(['"]?assets\/font\//gi,
    "url('assets/fonts/"
  );
  if(changed !== content){
    await fs.writeFile(filePath, changed, 'utf8');
    console.log(`  Fixed font path pluralization in ${path.basename(filePath)}`);
  }
}

async function exists(p){
  return fs.access(p).then(()=>true).catch(()=>false);
}

function sanitizeAbsUrl(u){
  return u.replace(/[<>"'\s]/g, '');
}

function isLikelyAssetUrl(u){
  try{
    const url = new URL(u);
    const ext = path.extname(url.pathname).toLowerCase();
    return ['.css','.js','.png','.jpg','.jpeg','.gif','.svg','.webp','.ico','.woff','.woff2','.ttf','.otf','.eot','.mp4','.webm','.ogg','.mp3','.wav'].includes(ext) ||
           url.hostname.includes('fonts.googleapis.com') ||
           url.hostname.includes('fonts.gstatic.com') ||
           url.pathname.includes('/wp-content/') ||
           url.pathname.includes('/assets/') ||
           url.pathname.includes('/static/');
  } catch {
    return false;
  }
}

function buildGoogleCssUrlFromLocalFile(base){
  const match = base.match(/css2\?family=([^&]+)/);
  if(!match) return null;
  
  const family = decodeURIComponent(match[1]);
  const encoded = encodeURIComponent(family);
  return `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
}

async function hydrateAndReplaceLocalCssFromGoogle(filePath){
  const base = path.basename(filePath);
  const googleUrl = buildGoogleCssUrlFromLocalFile(base);
  if(!googleUrl) return;
  
  try{
    console.log(`  Hydrating Google Fonts CSS: ${base}`);
    const buf = await fetchBuffer(googleUrl);
    let content = buf.toString('utf8');
    
    // 添加源注释
    if(!/^\/\*\s*@source:/m.test(content)){
      content = `/* @source: ${googleUrl} */\n` + content;
    }
    
    await fs.writeFile(filePath, content, 'utf8');
    
    // 处理嵌套的字体文件
    await localizeCssNested(filePath, googleUrl);
    
    console.log(`  ✓ Hydrated and localized: ${base}`);
  } catch(e){
    console.log(`  ✗ Failed to hydrate ${base}: ${e.message}`);
  }
}

async function processAllLocalCss(){
  const cssDir = path.join(ASSETS_DIR, 'css');
  if(!(await exists(cssDir))) return;
  
  const files = await walk(cssDir);
  const cssFiles = files.filter(f => path.extname(f).toLowerCase() === '.css');
  
  for(const cssFile of cssFiles){
    const base = path.basename(cssFile);
    if(base.includes('css2?family=')){
      await hydrateAndReplaceLocalCssFromGoogle(cssFile);
    } else {
      await fixLocalFontPathPluralization(cssFile);
    }
  }
}

async function main(){
  console.log('🚀 Starting localization process...');
  
  if(!(await exists(INDEX_FILE))){
    console.error(`❌ ${INDEX_FILE} not found`);
    process.exit(1);
  }
  
  let html = await fs.readFile(INDEX_FILE, 'utf8');
  const urls = [...html.matchAll(ABS_URL)].map(m => sanitizeAbsUrl(m[0])).filter(isLikelyAssetUrl);
  const uniqueUrls = [...new Set(urls)];
  
  console.log(`📋 Found ${uniqueUrls.length} unique asset URLs`);
  
  const mapping = new Map();
  const semaphore = [];
  
  for(const url of uniqueUrls){
    if(semaphore.length >= CONCURRENCY){
      await semaphore.shift();
    }
    
    const promise = (async () => {
      try{
        const u = new URL(url);
        if(!ALLOWED_HOSTS.has(u.hostname)){
          console.log(`⏭️  Skipping ${url} (host not in whitelist)`);
          return;
        }
        
        const localPath = targetPathFor(url);
        const alreadyExists = await exists(localPath);
        if(!alreadyExists){
          console.log(`⬇️  Downloading: ${url}`);
          await politeDownload(url, localPath);
        } else {
          console.log(`✅ Already exists: ${path.basename(localPath)}`);
        }
        mapping.set(url, localPath);
      } catch(e){
        console.log(`❌ Failed: ${url} - ${e.message}`);
      }
    })();
    
    semaphore.push(promise);
  }
  
  await Promise.all(semaphore);
  
  console.log('🔄 Processing CSS files for nested resources...');
  await processAllLocalCss();
  
  console.log('📝 Rewriting HTML with local paths...');
  html = await rewriteInHtml(html, mapping);
  await fs.writeFile(INDEX_FILE, html, 'utf8');
  
  console.log(`✅ Localization complete! Downloaded ${mapping.size} assets.`);
}

main().catch(e=>{ console.error(e); process.exit(1); });