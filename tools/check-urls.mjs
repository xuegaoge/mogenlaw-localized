#!/usr/bin/env node
// tools/check-urls.mjs - 浣跨敤 Playwright 妫€鏌ョ綉绔欓〉闈RL
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkUrls() {
  console.log('姝ｅ湪妫€鏌ョ綉绔欓〉闈RL缁撴瀯...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // 璁块棶涓婚〉
    await page.goto('https://aekhw.com/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 绛夊緟椤甸潰鍔犺浇瀹屾垚
    await page.waitForTimeout(5000);
    
    // 鎻愬彇鎵€鏈夊鑸摼鎺?
    const links = await page.evaluate(() => {
      const navLinks = [];
      const linkElements = document.querySelectorAll('a[href]');
      
      for (const link of linkElements) {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        
        // 鍙敹闆嗙浉瀵归摼鎺ュ拰鍚屽煙閾炬帴
        if (href && (href.startsWith('/') || href.includes('aekhw.com'))) {
          navLinks.push({
            text: text,
            href: href
          });
        }
      }
      
      return navLinks;
    });
    
console.log('鎵惧埌鐨勯〉闈㈤摼鎺?');
    links.forEach((link, index) => {
      console.log(`${index + 1}. ${link.text} -> ${link.href}`);
    });
    
// 淇濆瓨閾炬帴鍒版枃浠?
    const outputPath = path.join(__dirname, '..', 'page-links.json');
    await fs.writeFile(outputPath, JSON.stringify(links, null, 2), 'utf8');
    console.log(`\n閾炬帴宸蹭繚瀛樺埌: ${outputPath}`);
    
  } catch (error) {
    console.error('妫€鏌RL鏃跺嚭閿?', error);
  } finally {
    await browser.close();
  }
}

// 濡傛灉鐩存帴杩愯姝よ剼鏈?
if (import.meta.url === `file://${process.argv[1]}`) {
  checkUrls().catch(console.error);
}

export { checkUrls };

