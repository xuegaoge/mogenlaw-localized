#!/usr/bin/env node
// tools/check-urls.mjs - 使用 Playwright 检查网站页面URL
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkUrls() {
  console.log('正在检查网站页面URL结构...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // 访问主页
    await page.goto('https://aekhw.com/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 等待页面加载完成
    await page.waitForTimeout(5000);
    
    // 提取所有导航链接
    const links = await page.evaluate(() => {
      const navLinks = [];
      const linkElements = document.querySelectorAll('a[href]');
      
      for (const link of linkElements) {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        
        // 只收集相对链接和同域链接
        if (href && (href.startsWith('/') || href.includes('aekhw.com'))) {
          navLinks.push({
            text: text,
            href: href
          });
        }
      }
      
      return navLinks;
    });
    
    // 去重并排序
    const uniqueLinks = [...new Map(links.map(link => [link.href, link])).values()]
      .sort((a, b) => a.href.localeCompare(b.href));
    
    console.log(`找到 ${uniqueLinks.length} 个唯一链接:`);
    uniqueLinks.forEach(link => {
      console.log(`- ${link.href} (${link.text})`);
    });
    
    // 保存到文件
    const outputPath = path.join(__dirname, '..', 'urls.json');
    await fs.writeFile(outputPath, JSON.stringify(uniqueLinks, null, 2), 'utf8');
    console.log(`\n链接列表已保存到: ${outputPath}`);
    
    return uniqueLinks;
    
  } catch (error) {
    console.error('检查URL时出错:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function main() {
  await checkUrls();
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { checkUrls };