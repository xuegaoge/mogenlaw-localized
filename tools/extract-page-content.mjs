#!/usr/bin/env node
<<<<<<< HEAD
// tools/extract-page-content.mjs - 使用Playwright提取页面内容
=======
// tools/extract-page-content.mjs - 使用 Playwright 提取页面内容
>>>>>>> 21cefa2 (chore(extract): 备份并全量覆盖所有内页（完整 DOM 模式）)
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

<<<<<<< HEAD
// 提取页面内容的函数
async function extractPageContent(url, pageName) {
  console.log(`正在提取页面: ${pageName} (${url})`);
=======
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
  
  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
<<<<<<< HEAD
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
=======
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
        title,
        mainContent: mainContent ? mainContent.innerHTML : '',
        navContent: navContent ? navContent.innerHTML : '',
        footerContent: footerContent ? footerContent.innerHTML : ''
      };
    });
    
    // 生成完整的 HTML 文件
    const html = `<!DOCTYPE html>
<html lang="en-US">
<head>
    <meta charset="UTF-8">
    <meta name='robots' content='index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${content.title}</title>
    <link rel="stylesheet" href="../assets/css/style.min-6.8.1.css">
    <link rel="stylesheet" href="../assets/css/widget-areas.min.css">
    <link rel="stylesheet" href="../assets/css/main.min.css">
    <link rel="stylesheet" href="../assets/css/style-1751249515.css">
    <link rel="stylesheet" href="../assets/css/css.css">
    <link rel="stylesheet" href="../assets/css/css2-Ralewayitalwght0100..9001100..900_swap.css">
    <link rel="stylesheet" href="../assets/css/css2-Robotoitalwght0100..9001100..900_swap.css">
    <link rel="stylesheet" href="../assets/css/css2-ArchivoNarrowitalwght0400..7001400..700_swap.css">
    <link rel="stylesheet" href="../assets/css/flexslider.css">
    <link rel="stylesheet" href="../assets/css/public.css">
    <link rel="stylesheet" href="../assets/css/style-1.0.0.css">
</head>
<body>
    <header class="site-header">
        ${content.navContent}
    </header>
    <main class="site-content">
        <div class="entry-content">
            ${content.mainContent}
        </div>
    </main>
    <footer class="site-footer">
        ${content.footerContent}
    </footer>
    
    <script src="../assets/js/jquery.min.js"></script>
    <script src="../assets/js/jquery-migrate.min.js"></script>
    <script src="../assets/js/jquery.flexslider.min.js"></script>
    <script src="../assets/js/script.min.js"></script>
    <script src="../assets/js/jQuery.easing.min.js"></script>
    <script src="../assets/js/menu.min.js"></script>
    <script src="../assets/js/wp-emoji-release.min.js"></script>
    <script src="../assets/js/frontend-gtag.min.js"></script>
    <script src="../assets/js/classList.min-1278caee.js"></script>
</body>
</html>`;
    
    // 保存文件
    await fs.writeFile(outputPath, html, 'utf8');
    console.log(`页面内容已保存到: ${outputPath}`);
    
  } catch (error) {
    console.error('提取页面内容时出错:', error);
>>>>>>> 21cefa2 (chore(extract): 备份并全量覆盖所有内页（完整 DOM 模式）)
  } finally {
    await browser.close();
  }
}

<<<<<<< HEAD
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
=======
// 主函数
async function main() {
  const url = process.argv[2] || 'https://aekhw.com/about-us/';
  const outputPath = process.argv[3] || path.join(PROJECT_ROOT, 'pages', 'about.html');
  
  await extractPageContent(url, outputPath);
}

// 如果直接运行此脚本
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { extractPageContent };
>>>>>>> 21cefa2 (chore(extract): 备份并全量覆盖所有内页（完整 DOM 模式）)
