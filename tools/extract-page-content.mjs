#!/usr/bin/env node
// tools/extract-page-content.mjs - 浣跨敤Playwright鎻愬彇椤甸潰鍐呭
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 鎻愬彇椤甸潰鍐呭鐨勫嚱鏁?
async function extractPageContent(url, pageName) {
  console.log(`姝ｅ湪鎻愬彇椤甸潰: ${pageName} (${url})`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
// 绛夊緟椤甸潰瀹屽叏鍔犺浇
    await page.waitForTimeout(3000);
    
    // 鎻愬彇椤甸潰HTML鍐呭
    const content = await page.content();
    
    // 淇濆瓨鍒皃ages鐩綍
    const pagesDir = path.join(PROJECT_ROOT, 'pages');
    await fs.mkdir(pagesDir, { recursive: true });
    
    const outputPath = path.join(pagesDir, `${pageName}.html`);
    await fs.writeFile(outputPath, content, 'utf8');
    
    console.log(`椤甸潰宸蹭繚瀛? ${outputPath}`);
    
    // 鎻愬彇椤甸潰鍏冩暟鎹?
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
        url: window.location.href,
        lang: document.documentElement.lang || 'en'
      };
    });
    
    return {
      name: pageName,
      url: url,
      file: `${pageName}.html`,
      ...pageInfo
    };
    
  } catch (error) {
    console.error(`鎻愬彇椤甸潰 ${pageName} 鏃跺嚭閿?`, error);
    return null;
  } finally {
    await browser.close();
  }
}

// 鎵归噺鎻愬彇澶氫釜椤甸潰
async function extractMultiplePages(urls) {
  const results = [];
  
  for (const [pageName, url] of Object.entries(urls)) {
    const result = await extractPageContent(url, pageName);
    if (result) {
      results.push(result);
    }
    
    // 娣诲姞寤惰繜浠ラ伩鍏嶈繃浜庨绻佺殑璇锋眰
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

// 涓诲嚱鏁?
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('鐢ㄦ硶: node extract-page-content.mjs <URL> <椤甸潰鍚嶇О>');
    console.log('绀轰緥: node extract-page-content.mjs https://aekhw.com/about/ about');
    process.exit(1);
  }
  
  const url = args[0];
  const pageName = args[1];
  
  try {
    const result = await extractPageContent(url, pageName);
    if (result) {
      console.log('\n鎻愬彇瀹屾垚锛?);
      console.log('椤甸潰淇℃伅:', JSON.stringify(result, null, 2));
    } else {
      console.log('鎻愬彇澶辫触');
      process.exit(1);
    }
  } catch (error) {
    console.error('鎻愬彇杩囩▼涓嚭閿?', error);
    process.exit(1);
  }
}

// 濡傛灉鐩存帴杩愯姝よ剼鏈?
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { extractPageContent, extractMultiplePages };

