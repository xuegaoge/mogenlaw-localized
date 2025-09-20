#!/usr/bin/env node
// tools/extract-all-pages.mjs - 鎵归噺鎻愬彇椤甸潰鍐呭
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 椤甸潰URL鏄犲皠
const pageUrls = {
  'about': 'https://aekhw.com/about/',
  'services': 'https://aekhw.com/services/',
  'team': 'https://aekhw.com/team/',
  'contact': 'https://aekhw.com/contact/',
  'news': 'https://aekhw.com/news/',
  'cases': 'https://aekhw.com/cases/',
  'practice-areas': 'https://aekhw.com/practice-areas/',
  'publications': 'https://aekhw.com/publications/',
  'careers': 'https://aekhw.com/careers/',
  'privacy': 'https://aekhw.com/privacy/',
  'terms': 'https://aekhw.com/terms/'
};

// 鎻愬彇椤甸潰鍐呭鐨勫嚱鏁?
async function extractPageContent(page, url, pageName) {
  console.log(`姝ｅ湪鎻愬彇椤甸潰: ${pageName} (${url})`);
  
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
    
    // 鎻愬彇椤甸潰鏍囬鍜屾弿杩?
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
        url: window.location.href
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
  }
}

// 涓诲嚱鏁?
async function extractAllPages() {
  console.log('寮€濮嬫壒閲忔彁鍙栭〉闈㈠唴瀹?..');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
const results = [];
  
  try {
    for (const [pageName, url] of Object.entries(pageUrls)) {
      const result = await extractPageContent(page, url, pageName);
      if (result) {
        results.push(result);
      }
      
      // 娣诲姞寤惰繜浠ラ伩鍏嶈繃浜庨绻佺殑璇锋眰
      await page.waitForTimeout(2000);
    }
    
    // 淇濆瓨椤甸潰淇℃伅鍒癑SON鏂囦欢
    const manifestPath = path.join(PROJECT_ROOT, 'pages-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`椤甸潰娓呭崟宸蹭繚瀛? ${manifestPath}`);
    
    console.log(`\n鎻愬彇瀹屾垚锛佸叡澶勭悊 ${results.length} 涓〉闈);
    
  } catch (error) {
    console.error('鎵归噺鎻愬彇杩囩▼涓嚭閿?', error);
  } finally {
    await browser.close();
  }
}

// 濡傛灉鐩存帴杩愯姝よ剼鏈?
if (import.meta.url === `file://${process.argv[1]}`) {
  extractAllPages().catch(console.error);
}

export { extractAllPages };

