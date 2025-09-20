#!/usr/bin/env node
<<<<<<< HEAD
// tools/extract-page-content-mcp.mjs - 使用MCP Playwright提取页面内容
=======
// tools/extract-page-content-mcp.mjs - 使用 MCP Playwright 提取页面内容
import { chromium } from 'playwright';
>>>>>>> 21cefa2 (chore(extract): 备份并全量覆盖所有内页（完整 DOM 模式）)
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

<<<<<<< HEAD
// 提取页面内容的函数
async function extractPageContentMCP(url, pageName) {
  console.log(`正在提取页面: ${pageName} (${url})`);
  
  try {
    // 这里需要使用MCP Playwright工具
    // 由于这是一个工具脚本，实际的MCP调用需要在Trae AI环境中进行
    console.log('请在Trae AI环境中使用MCP Playwright工具来提取页面内容');
    console.log(`目标URL: ${url}`);
    console.log(`页面名称: ${pageName}`);
    
    // 返回提取指令
    return {
      instruction: 'mcp_playwright_browser_navigate',
      url: url,
      pageName: pageName,
      nextSteps: [
        '1. 导航到页面',
        '2. 等待页面加载完成',
        '3. 提取页面HTML内容',
        '4. 保存到pages目录'
      ]
    };
    
  } catch (error) {
    console.error(`提取页面 ${pageName} 时出错:`, error);
    return null;
  }
}

// 启动浏览器的函数（MCP版本）
async function startBrowserMCP() {
  console.log('启动MCP Playwright浏览器...');
  
  // 返回MCP浏览器启动指令
  return {
    instruction: 'mcp_playwright_browser_install',
    description: '安装并启动Playwright浏览器'
  };
}

// 设置浏览器上下文的函数
async function setupBrowserContext() {
  console.log('设置浏览器上下文...');
  
  return {
    instruction: 'mcp_playwright_browser_resize',
    width: 1920,
    height: 1080,
    description: '设置浏览器窗口大小'
  };
}

// 提取页面HTML内容
async function extractHTML(pageName) {
  console.log(`提取页面HTML: ${pageName}`);
  
  return {
    instruction: 'mcp_playwright_browser_evaluate',
    function: '() => { return document.documentElement.outerHTML; }',
    description: '提取完整的页面HTML内容'
  };
}

// 保存页面内容到文件
async function savePageContent(content, pageName) {
  try {
    const pagesDir = path.join(PROJECT_ROOT, 'pages');
    await fs.mkdir(pagesDir, { recursive: true });
    
    const outputPath = path.join(pagesDir, `${pageName}.html`);
    await fs.writeFile(outputPath, content, 'utf8');
    
    console.log(`页面已保存: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error(`保存页面 ${pageName} 时出错:`, error);
    return null;
  }
}

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

// 主函数 - 生成MCP指令序列
async function generateMCPInstructions() {
  console.log('生成MCP Playwright指令序列...');
  
  const instructions = [];
  
  // 1. 启动浏览器
  instructions.push(await startBrowserMCP());
  
  // 2. 设置浏览器上下文
  instructions.push(await setupBrowserContext());
  
  // 3. 为每个页面生成提取指令
  for (const [pageName, url] of Object.entries(pageUrls)) {
    instructions.push(await extractPageContentMCP(url, pageName));
  }
  
  // 保存指令到文件
  const instructionsPath = path.join(PROJECT_ROOT, 'mcp-instructions.json');
  await fs.writeFile(instructionsPath, JSON.stringify(instructions, null, 2), 'utf8');
  console.log(`MCP指令已保存: ${instructionsPath}`);
  
  return instructions;
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMCPInstructions().catch(console.error);
}

export { 
  extractPageContentMCP, 
  startBrowserMCP, 
  setupBrowserContext, 
  extractHTML, 
  savePageContent, 
  generateMCPInstructions,
  pageUrls 
};
=======
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
  } finally {
    await browser.close();
  }
}

// 主函数
async function main() {
  const url = process.argv[2] || 'https://aekhw.com/about.html';
  const outputPath = process.argv[3] || path.join(PROJECT_ROOT, 'pages', 'about.html');
  
  await extractPageContent(url, outputPath);
}

// 如果直接运行此脚本
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { extractPageContent };
>>>>>>> 21cefa2 (chore(extract): 备份并全量覆盖所有内页（完整 DOM 模式）)
