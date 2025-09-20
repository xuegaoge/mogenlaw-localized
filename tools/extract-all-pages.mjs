#!/usr/bin/env node
// tools/extract-all-pages.mjs - 批量提取所有页面内容
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 页面URL映射
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
  { name: 'accessibility-statement.html', url: 'https://aekhw.com/accessibility-statement.html' }
];

async function extractPageContent(url, outputPath) {
  console.log(`正在提取页面内容: ${url}`);
  
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
    
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // 写入文件
    await fs.writeFile(outputPath, content, 'utf8');
    console.log(`页面内容已保存到: ${outputPath}`);
    
    return content;
    
  } catch (error) {
    console.error(`提取页面内容失败 ${url}:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function extractAllPages() {
  console.log(`开始批量提取 ${pageUrls.length} 个页面...`);
  
  const pagesDir = path.join(PROJECT_ROOT, 'pages');
  await fs.mkdir(pagesDir, { recursive: true });
  
  const results = [];
  
  for (const pageInfo of pageUrls) {
    try {
      const outputPath = path.join(pagesDir, pageInfo.name);
      await extractPageContent(pageInfo.url, outputPath);
      results.push({ ...pageInfo, success: true });
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`处理页面失败 ${pageInfo.name}:`, error);
      results.push({ ...pageInfo, success: false, error: error.message });
    }
  }
  
  // 生成报告
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  console.log(`\n批量提取完成:`);
  console.log(`- 成功: ${successCount} 个页面`);
  console.log(`- 失败: ${failCount} 个页面`);
  
  if (failCount > 0) {
    console.log('\n失败的页面:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.name}: ${r.error}`);
    });
  }
  
  return results;
}

async function main() {
  try {
    await extractAllPages();
  } catch (error) {
    console.error('批量提取失败:', error);
    process.exit(1);
  }
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { extractPageContent, pageUrls };