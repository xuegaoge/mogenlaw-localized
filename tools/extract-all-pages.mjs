#!/usr/bin/env node
<<<<<<< HEAD
// tools/extract-all-pages.mjs - 批量提取页面内容
=======
// tools/extract-all-pages.mjs - 批量提取所有页面内容
>>>>>>> 21cefa2 (chore(extract): 备份并全量覆盖所有内页（完整 DOM 模式）)
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 页面URL映射
<<<<<<< HEAD
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

// 提取页面内容的函数
async function extractPageContent(page, url, pageName) {
  console.log(`正在提取页面: ${pageName} (${url})`);
  
  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 提取页面HTML内容
    const content = await page.content();
    
    // 保存到pages目录
    const pagesDir = path.join(PROJECT_ROOT, 'pages');
    await fs.mkdir(pagesDir, { recursive: true });
    
    const outputPath = path.join(pagesDir, `${pageName}.html`);
    await fs.writeFile(outputPath, content, 'utf8');
    
    console.log(`页面已保存: ${outputPath}`);
    
    // 提取页面标题和描述
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
    console.error(`提取页面 ${pageName} 时出错:`, error);
    return null;
  }
}

// 主函数
async function extractAllPages() {
  console.log('开始批量提取页面内容...');
=======
const pageUrls = [
  { name: 'about.html', url: 'https://aekhw.com/about.html' },
  { name: 'clients-we-represent.html', url: 'https://aekhw.com/clients-we-represent.html' },
  { name: 'matters-we-handle.html', url: 'https://aekhw.com/matters-we-handle.html' },
  { name: 'our-experience.html', url: 'https://aekhw.com/our-experience.html' },
  { name: 'our-approach.html', url: 'https://aekhw.com/our-approach.html' },
  { name: 'our-technological-advantages.html', url: 'https://aekhw.com/our-technological-advantages.html' },
  { name: 'what-makes-us-different.html', url: 'https://aekhw.com/what-makes-us-different.html' },
  { name: 'enter-to-view.html', url: 'https://aekhw.com/enter-to-view.html' },
  { name: 'trial-practice.html', url: 'https://aekhw.com/trial-practice.html' },
  { name: 'crisis-management.html', url: 'https://aekhw.com/crisis-management.html' },
  { name: 'government-and-internal-investigations.html', url: 'https://aekhw.com/government-and-internal-investigations.html' },
  { name: 'criminal-and-regulatory-enforcement-defense.html', url: 'https://aekhw.com/criminal-and-regulatory-enforcement-defense.html' },
  { name: 'business-crimes-and-fraud.html', url: 'https://aekhw.com/business-crimes-and-fraud.html' },
  { name: 'national-security-economic-sanctions-and-export-controls.html', url: 'https://aekhw.com/national-security-economic-sanctions-and-export-controls.html' },
  { name: 'securities-and-commodities-fraud-and-market-manipulation.html', url: 'https://aekhw.com/securities-and-commodities-fraud-and-market-manipulation.html' },
  { name: 'money-laundering-bank-secrecy-act.html', url: 'https://aekhw.com/money-laundering-bank-secrecy-act.html' },
  { name: 'fcpa-and-anti-corruption.html', url: 'https://aekhw.com/fcpa-and-anti-corruption.html' },
  { name: 'criminal-antitrust.html', url: 'https://aekhw.com/criminal-antitrust.html' },
  { name: 'tax-fraud.html', url: 'https://aekhw.com/tax-fraud.html' },
  { name: 'environmental-crimes.html', url: 'https://aekhw.com/environmental-crimes.html' },
  { name: 'civil-litigation.html', url: 'https://aekhw.com/civil-litigation.html' },
  { name: 'asset-recovery.html', url: 'https://aekhw.com/asset-recovery.html' },
  { name: 'compliance-counseling.html', url: 'https://aekhw.com/compliance-counseling.html' },
  { name: 'whistleblower-representations.html', url: 'https://aekhw.com/whistleblower-representations.html' },
  { name: 'monitorships.html', url: 'https://aekhw.com/monitorships.html' },
  { name: 'appeals.html', url: 'https://aekhw.com/appeals.html' },
  { name: 'crypto-fraud-recovery.html', url: 'https://aekhw.com/crypto-fraud-recovery.html' },
  { name: 'active-lawsuits.html', url: 'https://aekhw.com/active-lawsuits.html' },
  { name: 'open-investigations.html', url: 'https://aekhw.com/open-investigations.html' },
  { name: 'becoming-a-client.html', url: 'https://aekhw.com/becoming-a-client.html' },
  { name: 'contact.html', url: 'https://aekhw.com/contact.html' },
  { name: 'disclaimer.html', url: 'https://aekhw.com/disclaimer.html' },
  { name: 'accessibility-statement.html', url: 'https://aekhw.com/accessibility-statement.html' },
  // 新增：补全遗漏的页面
  { name: 'cryptocurrencies-and-blockchain.html', url: 'https://aekhw.com/cryptocurrencies-and-blockchain.html' },
  { name: 'cybercrime.html', url: 'https://aekhw.com/cybercrime.html' }
];

async function extractPageContent(url, outputPath) {
  console.log(`正在提取页面内容: ${url}`);
>>>>>>> 21cefa2 (chore(extract): 备份并全量覆盖所有内页（完整 DOM 模式）)
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
<<<<<<< HEAD
  const results = [];
  
  try {
    for (const [pageName, url] of Object.entries(pageUrls)) {
      const result = await extractPageContent(page, url, pageName);
      if (result) {
        results.push(result);
      }
      
      // 添加延迟以避免过于频繁的请求
      await page.waitForTimeout(2000);
    }
    
    // 保存页面信息到JSON文件
    const manifestPath = path.join(PROJECT_ROOT, 'pages-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`页面清单已保存: ${manifestPath}`);
    
    console.log(`\n提取完成！共处理 ${results.length} 个页面`);
    
  } catch (error) {
    console.error('批量提取过程中出错:', error);
=======
  
  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // 等待页面加载完成与动态内容稳定
    await page.waitForTimeout(5000);
    
    // 完整 DOM 快照（方案B）
    const html = await page.content();

    // 直接落盘：保持与原站一致的 head/body 结构与资源引用
    await fs.writeFile(outputPath, html, 'utf8');
    console.log(`页面内容已保存到: ${outputPath}`);
    
  } catch (error) {
    console.error(`提取页面内容时出错 (${url}):`, error);
>>>>>>> 21cefa2 (chore(extract): 备份并全量覆盖所有内页（完整 DOM 模式）)
  } finally {
    await browser.close();
  }
}

<<<<<<< HEAD
// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  extractAllPages().catch(console.error);
}

export { extractAllPages };
=======
// 主函数
async function main() {
  console.log(`开始批量提取 ${pageUrls.length} 个页面的内容...`);
  
  for (const page of pageUrls) {
    const outputPath = path.join(PROJECT_ROOT, 'pages', page.name);
    await extractPageContent(page.url, outputPath);
  }
  
  console.log('所有页面内容提取完成！');
}

// 如果直接运行此脚本
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { extractPageContent, pageUrls };
>>>>>>> 21cefa2 (chore(extract): 备份并全量覆盖所有内页（完整 DOM 模式）)
