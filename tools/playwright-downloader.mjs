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

// 从 HTML 文件中提取资源 URL
async function extractResourceUrls() {
  const htmlFiles = [];
  
  // 递归查找所有 HTML 文件
  const findHtmlFiles = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await findHtmlFiles(fullPath);
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.html') {
        htmlFiles.push(fullPath);
      }
    }
  };
  
  await findHtmlFiles(PROJECT_ROOT);
  
  const urls = new Set();
  
  for (const htmlFile of htmlFiles) {
    try {
      const content = await fs.readFile(htmlFile, 'utf8');
      
      // 提取各种资源链接
      const patterns = [
        /href=['"]([^'"]+\.css[^'"]*)['"]/gi,
        /src=['"]([^'"]+\.js[^'"]*)['"]/gi,
        /src=['"]([^'"]+\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|avif)[^'"]*)['"]/gi,
        /url\(['"]?([^'"()]+\.(woff2?|ttf|otf|eot)[^'"()]*)['"]\)/gi,
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const url = match[1];
          if (url.startsWith('http://') || url.startsWith('https://')) {
            urls.add(url);
          }
        }
      }
    } catch (error) {
      console.log(`读取文件失败: ${htmlFile} - ${error.message}`);
    }
  }
  
  return Array.from(urls);
}

// 主函数
async function main() {
  try {
    console.log('正在扫描 HTML 文件中的外部资源...');
    const urls = await extractResourceUrls();
    
    if (urls.length === 0) {
      console.log('未找到需要下载的外部资源');
      return;
    }
    
    console.log(`找到 ${urls.length} 个外部资源`);
    urls.forEach(url => console.log(`  - ${url}`));
    
    const result = await downloadWithPlaywright(urls);
    
    console.log(`\n总结: 成功下载 ${result.success} 个资源，失败 ${result.failed} 个`);
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