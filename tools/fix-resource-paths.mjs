#!/usr/bin/env node
// tools/fix-resource-paths.mjs - 淇璧勬簮璺緞
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 瀛椾綋璺緞鏄犲皠
const fontPathMap = {
  '1Ptsg8zYS_SKggPNyCg4QIFqPfE.woff2': 'assets/fonts/1Ptsg8zYS_SKggPNyCg4QIFqPfE.woff2',
  '1Ptsg8zYS_SKggPNyCg4SYFqPfE.woff2': 'assets/fonts/1Ptsg8zYS_SKggPNyCg4SYFqPfE.woff2',
  '1Ptsg8zYS_SKggPNyCg4QoFqPfE.woff2': 'assets/fonts/1Ptsg8zYS_SKggPNyCg4QoFqPfE.woff2',
  '1Ptsg8zYS_SKggPNyCg4Q4FqPfE.woff2': 'assets/fonts/1Ptsg8zYS_SKggPNyCg4Q4FqPfE.woff2',
  '1Ptsg8zYS_SKggPNyCg4TYFq.woff2': 'assets/fonts/1Ptsg8zYS_SKggPNyCg4TYFq.woff2',
  '1Ptug8zYS_SKggPNyCAIT5lu.woff2': 'assets/fonts/1Ptug8zYS_SKggPNyCAIT5lu.woff2',
  '1Ptug8zYS_SKggPNyCkIT5lu.woff2': 'assets/fonts/1Ptug8zYS_SKggPNyCkIT5lu.woff2',
  '1Ptug8zYS_SKggPNyCIIT5lu.woff2': 'assets/fonts/1Ptug8zYS_SKggPNyCIIT5lu.woff2',
  '1Ptug8zYS_SKggPNyCMIT5lu.woff2': 'assets/fonts/1Ptug8zYS_SKggPNyCMIT5lu.woff2',
  '1Ptug8zYS_SKggPNyC0ITw.woff2': 'assets/fonts/1Ptug8zYS_SKggPNyC0ITw.woff2'
};

// 鍥剧墖璺緞鏄犲皠
const imagePathMap = {
  'logo.png': 'assets/images/logo.png',
  'favicon.ico': 'assets/images/favicon.ico',
  'apple-touch-icon.png': 'assets/images/apple-touch-icon.png'
};

// 淇CSS涓殑瀛椾綋璺緞
async function fixFontPaths(cssContent) {
  let fixedContent = cssContent;
  
  // 鏇挎崲Google Fonts URL涓烘湰鍦拌矾寰?
  for (const [fontFile, localPath] of Object.entries(fontPathMap)) {
    const googleFontUrl = `https://fonts.gstatic.com/s/raleway/v28/${fontFile}`;
    const robotoFontUrl = `https://fonts.gstatic.com/s/roboto/v30/${fontFile}`;
    
    fixedContent = fixedContent.replace(new RegExp(googleFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
    fixedContent = fixedContent.replace(new RegExp(robotoFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }
  
  return fixedContent;
}

// 淇CSS涓殑鍥剧墖璺緞
async function fixImagePaths(cssContent) {
  let fixedContent = cssContent;
  
  // 鏇挎崲鍥剧墖URL涓烘湰鍦拌矾寰?
  for (const [imageFile, localPath] of Object.entries(imagePathMap)) {
    const imageUrl = `https://aekhw.com/wp-content/uploads/2024/12/${imageFile}`;
    fixedContent = fixedContent.replace(new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }
  
  return fixedContent;
}

// 淇HTML涓殑璧勬簮璺緞
async function fixHtmlPaths(htmlContent, filePath) {
  let fixedContent = htmlContent;

  // 计算从当前 HTML 文件到 assets 目录的相对前缀（pages => '../assets', 根目录 index.html => 'assets'）
  const computeAssetsPrefix = (fp) => {
    const fromDir = path.dirname(fp);
    const toAssets = path.join(PROJECT_ROOT, 'assets');
    let rel = path.relative(fromDir, toAssets).replace(/\\/g, '/');
    if (rel === '') rel = '.';
    return rel;
  };
  const assetsPrefix = computeAssetsPrefix(filePath);

  // 现有：修复字体直链与图片直链
  for (const [fontFile, localPath] of Object.entries(fontPathMap)) {
    const googleFontUrl = `https://fonts.gstatic.com/s/raleway/v28/${fontFile}`;
    const robotoFontUrl = `https://fonts.gstatic.com/s/roboto/v30/${fontFile}`;
    fixedContent = fixedContent.replace(new RegExp(googleFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
    fixedContent = fixedContent.replace(new RegExp(robotoFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }
  for (const [imageFile, localPath] of Object.entries(imagePathMap)) {
    const imageUrl = `https://aekhw.com/wp-content/uploads/2024/12/${imageFile}`;
    fixedContent = fixedContent.replace(new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }

  // 新增：统一修复 /static 下资源到本地 assets
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 已有的本地文件清单（按 assets 目录实际情况）
  const cssFiles = [
    'style.min-6.8.1.css',
    'widget-areas.min.css',
    'main.min.css',
    'style-1751249515.css',
    'css.css',
    'flexslider.css',
    'public.css',
    'style-1.0.0.css',
    'css2-Ralewayitalwght0100..9001100..900_swap.css',
    'css2-Robotoitalwght0100..9001100..900_swap.css',
    'css2-ArchivoNarrowitalwght0400..7001400..700_swap.css'
  ];
  const jsFiles = [
    'frontend-gtag.min.js',
    'menu.min.js',
    'jquery.min.js',
    'jquery-migrate.min.js',
    'jquery.flexslider.min.js',
    'script.min.js',
    'jQuery.easing.min.js',
    'wp-emoji-release.min.js'
  ];
  // 别名（源文件名 => 本地实际文件名）
  const jsAliasMap = {
    'classList.min.js': 'classList.min-1278caee.js'
  };

  // 修复 CSS 链接（属性精确匹配）
  for (const name of cssFiles) {
    const re = new RegExp(`(href=)(["'])/static/css/${escapeRegExp(name)}(?:\\?[^"'>]*)?(["'])`, 'g');
    fixedContent = fixedContent.replace(re, (_m, attr, q1, q2) => `${attr}${q1}${assetsPrefix}/css/${name}${q2}`);
  }

  // 修复 JS 链接（属性精确匹配）
  for (const name of jsFiles) {
    const re = new RegExp(`(src=)(["'])/static/js/${escapeRegExp(name)}(?:\\?[^"'>]*)?(["'])`, 'g');
    fixedContent = fixedContent.replace(re, (_m, attr, q1, q2) => `${attr}${q1}${assetsPrefix}/js/${name}${q2}`);
  }
  // 修复 JS 链接（别名 classList.min.js -> 本地哈希名）
  {
    const srcName = 'classList.min.js';
    const dstName = jsAliasMap[srcName];
    const re = new RegExp(`(src=)(["'])/static/js/${escapeRegExp(srcName)}(?:\\?[^"'>]*)?(["'])`, 'g');
    fixedContent = fixedContent.replace(re, (_m, attr, q1, q2) => `${attr}${q1}${assetsPrefix}/js/${dstName}${q2}`);
  }

  // 修复图片与字体（属性精确匹配）
  fixedContent = fixedContent.replace(/(src=)(["'])\/static\/picture\/([^"'>?]+)(?:\?[^"'>]*)?(["'])/g,
    (_m, attr, q1, fname, q2) => `${attr}${q1}${assetsPrefix}/images/${fname}${q2}`
  );
  fixedContent = fixedContent.replace(/(href=)(["'])\/static\/font\/([^"'>?]+)(?:\?[^"'>]*)?(["'])/g,
    (_m, attr, q1, fname, q2) => `${attr}${q1}${assetsPrefix}/fonts/${fname}${q2}`
  );
  fixedContent = fixedContent.replace(/(src=)(["'])\/static\/font\/([^"'>?]+)(?:\?[^"'>]*)?(["'])/g,
    (_m, attr, q1, fname, q2) => `${attr}${q1}${assetsPrefix}/fonts/${fname}${q2}`
  );

  // 新增：通用字符串值替换，覆盖内联脚本/JSON-LD/样式中的 "/static/..." 残留（要求两侧有引号）
  const replaceGenericQuoted = (content, type, dir) => {
    const rgx = new RegExp(`(["'])/static/${type}/([^"'>?]+)(?:\\?[^"'>]*)?(["'])`, 'g');
    return content.replace(rgx, (_m, q1, fname, q2) => `${q1}${assetsPrefix}/${dir}/${fname}${q2}`);
  };
  fixedContent = replaceGenericQuoted(fixedContent, 'css', 'css');
  fixedContent = replaceGenericQuoted(fixedContent, 'js', 'js');
  fixedContent = replaceGenericQuoted(fixedContent, 'picture', 'images');
  fixedContent = replaceGenericQuoted(fixedContent, 'font', 'fonts');

  // 新增：最强兜底（不要求引号）匹配 /static/** 任意位置
  const replaceGenericBare = (content, type, dir) => {
    const rgx = new RegExp(`/static/${type}/([^\s"'<>\)]+)`, 'g');
    return content.replace(rgx, (_m, fname) => `${assetsPrefix}/${dir}/${fname}`);
  };
  fixedContent = replaceGenericBare(fixedContent, 'css', 'css');
  fixedContent = replaceGenericBare(fixedContent, 'js', 'js');
  fixedContent = replaceGenericBare(fixedContent, 'picture', 'images');
  fixedContent = replaceGenericBare(fixedContent, 'font', 'fonts');

  // 对 classList.min.js 做一次别名纠正（避免通用替换映射到不存在的文件名）
  fixedContent = fixedContent.replace(new RegExp(`(["'])${escapeRegExp(assetsPrefix)}/js/${escapeRegExp('classList.min.js')}(?:\\?[^"'>]*)?(["'])`, 'g'),
    (_m, q1, q2) => `${q1}${assetsPrefix}/js/classList.min-1278caee.js${q2}`
  );
  fixedContent = fixedContent.replace(new RegExp(`${escapeRegExp(assetsPrefix)}/js/${escapeRegExp('classList.min.js')}(?:\\?[^\s"'<>\)]*)?`, 'g'),
    () => `${assetsPrefix}/js/classList.min-1278caee.js`
  );

  return fixedContent;
}

// 澶勭悊鍗曚釜鏂囦欢
async function fixResourcePathsInFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();
    
    let fixedContent;
    
    if (ext === '.css') {
      fixedContent = await fixFontPaths(content);
      fixedContent = await fixImagePaths(fixedContent);
    } else if (ext === '.html') {
      const before = (content.match(/\/static\//g) || []).length;
      fixedContent = await fixHtmlPaths(content, filePath);
      const after = (fixedContent.match(/\/static\//g) || []).length;
      console.log(`[fix] ${filePath}  before:/static=${before}  after:/static=${after}`);
    } else {
      console.log(`璺宠繃涓嶆敮鎸佺殑鏂囦欢绫诲瀷: ${filePath}`);
      return false;
    }
    
    await fs.writeFile(filePath, fixedContent, 'utf8');
    console.log(`宸蹭慨澶嶈祫婧愯矾寰? ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`淇鏂囦欢 ${filePath} 鏃跺嚭閿?`, error);
    return false;
  }
}

// 鎵归噺澶勭悊鐩綍涓殑鏂囦欢
async function fixResourcePathsInDirectory(dirPath, extensions = ['.css', '.html']) {
  try {
    const files = await fs.readdir(dirPath); // 去除不兼容的 recursive 选项
    const results = [];
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        if (extensions.includes(ext)) {
          const success = await fixResourcePathsInFile(filePath);
          results.push({ file: filePath, success });
        }
      }
    }
    
    return results;
    
  } catch (error) {
    console.error(`澶勭悊鐩綍 ${dirPath} 鏃跺嚭閿?`, error);
    return [];
  }
}

// 涓诲嚱鏁?
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('鐢ㄦ硶:');
    console.log('  淇鍗曚釜鏂囦欢: node fix-resource-paths.mjs <鏂囦欢璺緞>');
    console.log('  淇鏁cretebash椤圭洰: node fix-resource-paths.mjs --project');
    process.exit(1);
  }
  
  if (args[0] === '--project') {
    console.log('寮€濮嬩慨澶嶆暣涓」鐩殑璧勬簮璺緞...');
    
    // 淇assets鐩綍涓殑CSS鏂囦欢
    const assetsResults = await fixResourcePathsInDirectory(path.join(PROJECT_ROOT, 'assets'), ['.css']);
    
    // 淇pages鐩綍涓殑HTML鏂囦欢
    const pagesResults = await fixResourcePathsInDirectory(path.join(PROJECT_ROOT, 'pages'), ['.html']);
    
    // 淇鏍圭洰褰曠殑index.html
    const indexPath = path.join(PROJECT_ROOT, 'index.html');
    const indexResult = await fixResourcePathsInFile(indexPath);
    
    console.log('\n淇瀹屾垚锛?');
    console.log(`Assets鏂囦欢: ${assetsResults.filter(r => r.success).length}/${assetsResults.length}`);
    console.log(`Pages鏂囦欢: ${pagesResults.filter(r => r.success).length}/${pagesResults.length}`);
    console.log(`Index鏂囦欢: ${indexResult ? '鎴愬姛' : '澶辫触'}`);
    
  } else {
    const filePath = path.resolve(args[0]);
    const success = await fixResourcePathsInFile(filePath);
    
    if (success) {
      console.log('淇瀹屾垚锛?');
    } else {
      console.log('淇澶辫触');
      process.exit(1);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

export { fixResourcePathsInFile, fixResourcePathsInDirectory, fixFontPaths, fixImagePaths, fixHtmlPaths };

