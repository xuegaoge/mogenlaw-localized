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
    
    console.log('找到的页面链接:');
    links.forEach((link, index) => {
      console.log(`${index + 1}. ${link.text} -> ${link.href}`);
    });
    
    // 保存链接到文件
    const outputPath = path.join(__dirname, '..', 'page-links.json');
    await fs.writeFile(outputPath, JSON.stringify(links, null, 2), 'utf8');
    console.log(`\n链接已保存到: ${outputPath}`);
    
  } catch (error) {
    console.error('检查URL时出错:', error);
  } finally {
    await browser.close();
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  checkUrls().catch(console.error);
}

export { checkUrls };
