#!/usr/bin/env node
// tools/playwright-downloader.mjs - 使用 Playwright 下载失败的资源
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');

// 确保目录存在
const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

// 从文件扩展名推断子目录
const pickSubdir = (ext) => {
  ext = (ext || '').toLowerCase();
  if (['.css'].includes(ext)) return 'css';
  if (['.js', '.mjs'].includes(ext)) return 'js';
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp', '.avif'].includes(ext)) return 'images';
  if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) return 'fonts';
  if (['.mp4', '.webm', '.ogg', '.mp3', '.wav'].includes(ext)) return 'media';
  return 'misc';
};

// 生成目标路径
const targetPathFor = (url) => {
  const u = new URL(url);
  let base = path.basename(u.pathname) || 'index';
  const ext = path.extname(base).toLowerCase();
  const sub = pickSubdir(ext || '.misc');
  return path.join(ASSETS_DIR, sub, base);
};

// 使用 Playwright 下载资源
async function downloadWithPlaywright(urls) {
  console.log(`准备使用 Playwright 下载 ${urls.length} 个资源...`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  let successCount = 0;
  let failCount = 0;
  
  for (const url of urls) {
    try {
      console.log(`正在下载: ${url}`);
      
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      if (response && response.ok()) {
        const buffer = await response.body();
        const targetPath = targetPathFor(url);
        
        await ensureDir(path.dirname(targetPath));
        
        // 如果是 CSS 文件，添加源注释
        if (path.extname(targetPath).toLowerCase() === '.css') {
          let content = buffer.toString('utf8');
          if (!/^\/\*\s*@source:/m.test(content)) {
            content = `/* @source: ${url} */\n` + content;
          }
          await fs.writeFile(targetPath, content, 'utf8');
        } else {
          await fs.writeFile(targetPath, buffer);
        }
        
        console.log(`✓ 成功下载: ${path.basename(targetPath)}`);
        successCount++;
      } else {
        console.log(`✗ 下载失败 (HTTP ${response?.status()}): ${url}`);
        failCount++;
      }
    } catch (error) {
      console.log(`✗ 下载失败 (${error.message}): ${url}`);
      failCount++;
    }
    
    // 添加延迟避免过于频繁的请求
    await page.waitForTimeout(500);
  }
  
  await browser.close();
  
  console.log(`\n下载完成: 成功 ${successCount}, 失败 ${failCount}`);
  return { success: successCount, failed: failCount };
}

// 从 index.html 提取需要下载的资源 URL
async function extractResourceUrls() {
  const indexPath = path.join(PROJECT_ROOT, 'index.html');
  const html = await fs.readFile(indexPath, 'utf8');
  
  // 提取所有绝对 URL
  const absUrlPattern = /https?:\/\/[^\s"'<>()]+/gi;
  const absUrls = html.match(absUrlPattern) || [];
  
  // 提取相对路径的资源 URL (assets/ 和 /static/ 开头的)
  const relUrlPattern1 = /assets\/[^\s"'<>()]+\.(css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|bmp|avif|mp4|webm|ogg|mp3|wav|woff|woff2|ttf|otf|eot)(\?[^\s"'<>()]*)?/gi;
  const relUrls1 = (html.match(relUrlPattern1) || []).map(relUrl => `https://aekhw.com/${relUrl}`);
  
  const relUrlPattern2 = /\/static\/[^\s"'<>()]+\.(css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|bmp|avif|mp4|webm|ogg|mp3|wav|woff|woff2|ttf|otf|eot)(\?[^\s"'<>()]*)?/gi;
  const relUrls2 = (html.match(relUrlPattern2) || []).map(relUrl => `https://aekhw.com${relUrl}`);
  
  const relUrls = [...relUrls1, ...relUrls2];
  
  // 合并所有 URL
  const allUrls = [...absUrls, ...relUrls];
  
  // 过滤出需要下载的资源
  const resourceUrls = allUrls.filter(url => {
    try {
      const u = new URL(url);
      const pathname = u.pathname.toLowerCase();
      
      // 跳过根路径和 API 端点
      if (pathname === '/' || pathname === '') return false;
      
      // 包含资源文件扩展名
      const hasResourceExt = /\.(css|js|mjs|png|jpg|jpeg|gif|svg|webp|ico|bmp|avif|mp4|webm|ogg|mp3|wav|woff|woff2|ttf|otf|eot)(\?|$)/i.test(pathname);
      
      // 或者是 Google Fonts CSS
      const isGoogleFonts = u.hostname.includes('fonts.googleapis.com') && pathname.includes('/css');
      
      return hasResourceExt || isGoogleFonts;
    } catch {
      return false;
    }
  });
  
  // 去重
  return [...new Set(resourceUrls)];
}

// 主函数
async function main() {
  try {
    console.log('正在分析 index.html 中的资源链接...');
    const urls = await extractResourceUrls();
    
    if (urls.length === 0) {
      console.log('未找到需要下载的资源链接');
      return;
    }
    
    console.log(`找到 ${urls.length} 个资源链接:`);
    urls.forEach((url, i) => console.log(`${i + 1}. ${url}`));
    
    await downloadWithPlaywright(urls);
    
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { downloadWithPlaywright, extractResourceUrls };