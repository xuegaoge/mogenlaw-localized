#!/usr/bin/env node
// tools/extract-page-content-mcp.mjs - 使用 MCP Playwright 提取页面内容
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

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
    
    // 等待页面加载完成
    await page.waitForTimeout(5000);
    
    // 提取页面主要内容
    const content = await page.evaluate(() => {
      // 获取页面标题
      const title = document.title;
      
      // 获取页面主要内容（通常在.entry-content或类似容器中）
      const mainContent = document.querySelector('.entry-content') || 
                         document.querySelector('.site-content') || 
                         document.querySelector('main') || 
                         document.querySelector('#content') ||
                         document.body;
      
      // 获取导航菜单内容
      const navContent = document.querySelector('.main-navigation') || null;
      
      // 获取页脚内容
      const footerContent = document.querySelector('.site-footer') || 
                           document.querySelector('footer') || null;
      
      return {
        title: title,
        url: window.location.href,
        mainContent: mainContent ? mainContent.innerHTML : '',
        navContent: navContent ? navContent.innerHTML : '',
        footerContent: footerContent ? footerContent.innerHTML : '',
        fullHTML: document.documentElement.outerHTML
      };
    });
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // 保存提取的内容
    const extractedData = {
      extractedAt: new Date().toISOString(),
      ...content
    };
    
    // 保存为JSON格式
    const jsonPath = outputPath.replace(/\.html$/, '.json');
    await fs.writeFile(jsonPath, JSON.stringify(extractedData, null, 2), 'utf8');
    
    // 保存完整HTML
    await fs.writeFile(outputPath, content.fullHTML, 'utf8');
    
    console.log(`页面内容已保存到:`);
    console.log(`- HTML: ${outputPath}`);
    console.log(`- JSON: ${jsonPath}`);
    
    return extractedData;
    
  } catch (error) {
    console.error(`提取页面内容失败 ${url}:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function main() {
  const url = process.argv[2];
  const outputPath = process.argv[3] || path.join(PROJECT_ROOT, 'extracted-page.html');
  
  if (!url) {
    console.error('请提供要提取的页面URL');
    console.log('用法: node extract-page-content-mcp.mjs <URL> [输出路径]');
    process.exit(1);
  }
  
  try {
    await extractPageContent(url, outputPath);
  } catch (error) {
    console.error('提取失败:', error);
    process.exit(1);
  }
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { extractPageContent };