#!/usr/bin/env node
// tools/extract-page-content.mjs - 使用Playwright提取页面内容
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 提取页面内容的函数
async function extractPageContent(url, pageName) {
  console.log(`正在提取页面: ${pageName} (${url})`);
  
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
    
    // 提取页面元数据
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
    console.error(`提取页面 ${pageName} 时出错:`, error);
    return null;
  } finally {
    await browser.close();
  }
}

// 批量提取多个页面
async function extractMultiplePages(urls) {
  const results = [];
  
  for (const [pageName, url] of Object.entries(urls)) {
    const result = await extractPageContent(url, pageName);
    if (result) {
      results.push(result);
    }
    
    // 添加延迟以避免过于频繁的请求
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node extract-page-content.mjs <URL> <页面名称>');
    console.log('示例: node extract-page-content.mjs https://aekhw.com/about/ about');
    process.exit(1);
  }
  
  const url = args[0];
  const pageName = args[1];
  
  try {
    const result = await extractPageContent(url, pageName);
    if (result) {
      console.log('\n提取完成！');
      console.log('页面信息:', JSON.stringify(result, null, 2));
    } else {
      console.log('提取失败');
      process.exit(1);
    }
  } catch (error) {
    console.error('提取过程中出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { extractPageContent, extractMultiplePages };
