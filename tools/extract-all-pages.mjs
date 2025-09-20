#!/usr/bin/env node
// tools/extract-all-pages.mjs - 批量提取页面内容
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 页面URL映射
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
  } finally {
    await browser.close();
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  extractAllPages().catch(console.error);
}

export { extractAllPages };
