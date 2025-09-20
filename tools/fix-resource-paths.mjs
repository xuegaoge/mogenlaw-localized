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
async function fixHtmlPaths(htmlContent) {
  let fixedContent = htmlContent;
  
  // 淇瀛椾綋棰勫姞杞介摼鎺?
  for (const [fontFile, localPath] of Object.entries(fontPathMap)) {
    const googleFontUrl = `https://fonts.gstatic.com/s/raleway/v28/${fontFile}`;
    const robotoFontUrl = `https://fonts.gstatic.com/s/roboto/v30/${fontFile}`;
    
    fixedContent = fixedContent.replace(new RegExp(googleFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
    fixedContent = fixedContent.replace(new RegExp(robotoFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }
  
  // 淇鍥剧墖璺緞
  for (const [imageFile, localPath] of Object.entries(imagePathMap)) {
    const imageUrl = `https://aekhw.com/wp-content/uploads/2024/12/${imageFile}`;
    fixedContent = fixedContent.replace(new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }
  
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
      fixedContent = await fixHtmlPaths(content);
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
    const files = await fs.readdir(dirPath, { recursive: true });
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
    console.log('  淇鏁翠釜椤圭洰: node fix-resource-paths.mjs --project');
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
    
    console.log('\n淇瀹屾垚锛?);
    console.log(`Assets鏂囦欢: ${assetsResults.filter(r => r.success).length}/${assetsResults.length}`);
    console.log(`Pages鏂囦欢: ${pagesResults.filter(r => r.success).length}/${pagesResults.length}`);
    console.log(`Index鏂囦欢: ${indexResult ? '鎴愬姛' : '澶辫触'}`);
    
  } else {
    const filePath = path.resolve(args[0]);
    const success = await fixResourcePathsInFile(filePath);
    
    if (success) {
      console.log('淇瀹屾垚锛?);
    } else {
      console.log('淇澶辫触');
      process.exit(1);
    }
  }
}

// 濡傛灉鐩存帴杩愯姝よ剼鏈?
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { fixResourcePathsInFile, fixResourcePathsInDirectory, fixFontPaths, fixImagePaths, fixHtmlPaths };

