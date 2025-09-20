#!/usr/bin/env node
// tools/extract-page-content-mcp.mjs - 浣跨敤MCP Playwright鎻愬彇椤甸潰鍐呭
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 鎻愬彇椤甸潰鍐呭鐨勫嚱鏁?
async function extractPageContentMCP(url, pageName) {
  console.log(`姝ｅ湪鎻愬彇椤甸潰: ${pageName} (${url})`);
  
  try {
    // 杩欓噷闇€瑕佷娇鐢∕CP Playwright宸ュ叿
    // 鐢变簬杩欐槸涓€涓伐鍏疯剼鏈紝瀹為檯鐨凪CP璋冪敤闇€瑕佸湪Trae AI鐜涓繘琛?
    console.log('璇峰湪Trae AI鐜涓娇鐢∕CP Playwright宸ュ叿鏉ユ彁鍙栭〉闈㈠唴瀹?);
    console.log(`鐩爣URL: ${url}`);
    console.log(`椤甸潰鍚嶇О: ${pageName}`);
    
    // 杩斿洖鎻愬彇鎸囦护
    return {
      instruction: 'mcp_playwright_browser_navigate',
      url: url,
      pageName: pageName,
      nextSteps: [
        '1. 瀵艰埅鍒伴〉闈?,
        '2. 绛夊緟椤甸潰鍔犺浇瀹屾垚',
        '3. 鎻愬彇椤甸潰HTML鍐呭',
        '4. 淇濆瓨鍒皃ages鐩綍'
      ]
    };
    
  } catch (error) {
    console.error(`鎻愬彇椤甸潰 ${pageName} 鏃跺嚭閿?`, error);
    return null;
  }
}

// 鍚姩娴忚鍣ㄧ殑鍑芥暟锛圡CP鐗堟湰锛?
async function startBrowserMCP() {
  console.log('鍚姩MCP Playwright娴忚鍣?..');
  
  // 杩斿洖MCP娴忚鍣ㄥ惎鍔ㄦ寚浠?
  return {
    instruction: 'mcp_playwright_browser_install',
    description: '瀹夎骞跺惎鍔≒laywright娴忚鍣?
  };
}

// 璁剧疆娴忚鍣ㄤ笂涓嬫枃鐨勫嚱鏁?
async function setupBrowserContext() {
  console.log('璁剧疆娴忚鍣ㄤ笂涓嬫枃...');
  
  return {
    instruction: 'mcp_playwright_browser_resize',
    width: 1920,
    height: 1080,
    description: '璁剧疆娴忚鍣ㄧ獥鍙ｅぇ灏?
  };
}

// 鎻愬彇椤甸潰HTML鍐呭
async function extractHTML(pageName) {
  console.log(`鎻愬彇椤甸潰HTML: ${pageName}`);
  
  return {
    instruction: 'mcp_playwright_browser_evaluate',
    function: '() => { return document.documentElement.outerHTML; }',
    description: '鎻愬彇瀹屾暣鐨勯〉闈TML鍐呭'
  };
}

// 淇濆瓨椤甸潰鍐呭鍒版枃浠?
async function savePageContent(content, pageName) {
  try {
    const pagesDir = path.join(PROJECT_ROOT, 'pages');
    await fs.mkdir(pagesDir, { recursive: true });
    
    const outputPath = path.join(pagesDir, `${pageName}.html`);
    await fs.writeFile(outputPath, content, 'utf8');
    
    console.log(`椤甸潰宸蹭繚瀛? ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error(`淇濆瓨椤甸潰 ${pageName} 鏃跺嚭閿?`, error);
    return null;
  }
}

// 椤甸潰URL鏄犲皠
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

// 涓诲嚱鏁?- 鐢熸垚MCP鎸囦护搴忓垪
async function generateMCPInstructions() {
  console.log('鐢熸垚MCP Playwright鎸囦护搴忓垪...');
  
  const instructions = [];
  
  // 1. 鍚姩娴忚鍣?
  instructions.push(await startBrowserMCP());
  
  // 2. 璁剧疆娴忚鍣ㄤ笂涓嬫枃
  instructions.push(await setupBrowserContext());
  
  // 3. 涓烘瘡涓〉闈㈢敓鎴愭彁鍙栨寚浠?
  for (const [pageName, url] of Object.entries(pageUrls)) {
    instructions.push(await extractPageContentMCP(url, pageName));
  }
  
  // 淇濆瓨鎸囦护鍒版枃浠?
  const instructionsPath = path.join(PROJECT_ROOT, 'mcp-instructions.json');
  await fs.writeFile(instructionsPath, JSON.stringify(instructions, null, 2), 'utf8');
  console.log(`MCP鎸囦护宸蹭繚瀛? ${instructionsPath}`);
  
  return instructions;
}

// 濡傛灉鐩存帴杩愯姝よ剼鏈?
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

