#!/usr/bin/env node
// tools/fix-resource-paths.mjs - 修复资源路径
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 字体路径映射
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

// 图片路径映射
const imagePathMap = {
  'logo.png': 'assets/images/logo.png',
  'favicon.ico': 'assets/images/favicon.ico',
  'apple-touch-icon.png': 'assets/images/apple-touch-icon.png'
};

// 修复CSS中的字体路径
async function fixFontPaths(cssContent) {
  let fixedContent = cssContent;
  
  // 替换Google Fonts URL为本地路径
  for (const [fontFile, localPath] of Object.entries(fontPathMap)) {
    const googleFontUrl = `https://fonts.gstatic.com/s/raleway/v28/${fontFile}`;
    const robotoFontUrl = `https://fonts.gstatic.com/s/roboto/v30/${fontFile}`;
    
    fixedContent = fixedContent.replace(new RegExp(googleFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
    fixedContent = fixedContent.replace(new RegExp(robotoFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }
  
  return fixedContent;
}

// 修复CSS中的图片路径
async function fixImagePaths(cssContent) {
  let fixedContent = cssContent;
  
  // 替换图片URL为本地路径
  for (const [imageFile, localPath] of Object.entries(imagePathMap)) {
    const imageUrl = `https://aekhw.com/wp-content/uploads/2024/12/${imageFile}`;
    fixedContent = fixedContent.replace(new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }
  
  return fixedContent;
}

// 修复HTML中的资源路径
async function fixHtmlPaths(htmlContent) {
  let fixedContent = htmlContent;
  
  // 修复字体预加载链接
  for (const [fontFile, localPath] of Object.entries(fontPathMap)) {
    const googleFontUrl = `https://fonts.gstatic.com/s/raleway/v28/${fontFile}`;
    const robotoFontUrl = `https://fonts.gstatic.com/s/roboto/v30/${fontFile}`;
    
    fixedContent = fixedContent.replace(new RegExp(googleFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
    fixedContent = fixedContent.replace(new RegExp(robotoFontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }
  
  // 修复图片路径
  for (const [imageFile, localPath] of Object.entries(imagePathMap)) {
    const imageUrl = `https://aekhw.com/wp-content/uploads/2024/12/${imageFile}`;
    fixedContent = fixedContent.replace(new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
  }
  
  return fixedContent;
}

// 处理单个文件
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
      console.log(`跳过不支持的文件类型: ${filePath}`);
      return false;
    }
    
    await fs.writeFile(filePath, fixedContent, 'utf8');
    console.log(`已修复资源路径: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`修复文件 ${filePath} 时出错:`, error);
    return false;
  }
}

// 批量处理目录中的文件
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
    console.error(`处理目录 ${dirPath} 时出错:`, error);
    return [];
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法:');
    console.log('  修复单个文件: node fix-resource-paths.mjs <文件路径>');
    console.log('  修复整个项目: node fix-resource-paths.mjs --project');
    process.exit(1);
  }
  
  if (args[0] === '--project') {
    console.log('开始修复整个项目的资源路径...');
    
    // 修复assets目录中的CSS文件
    const assetsResults = await fixResourcePathsInDirectory(path.join(PROJECT_ROOT, 'assets'), ['.css']);
    
    // 修复pages目录中的HTML文件
    const pagesResults = await fixResourcePathsInDirectory(path.join(PROJECT_ROOT, 'pages'), ['.html']);
    
    // 修复根目录的index.html
    const indexPath = path.join(PROJECT_ROOT, 'index.html');
    const indexResult = await fixResourcePathsInFile(indexPath);
    
    console.log('\n修复完成！');
    console.log(`Assets文件: ${assetsResults.filter(r => r.success).length}/${assetsResults.length}`);
    console.log(`Pages文件: ${pagesResults.filter(r => r.success).length}/${pagesResults.length}`);
    console.log(`Index文件: ${indexResult ? '成功' : '失败'}`);
    
  } else {
    const filePath = path.resolve(args[0]);
    const success = await fixResourcePathsInFile(filePath);
    
    if (success) {
      console.log('修复完成！');
    } else {
      console.log('修复失败');
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { fixResourcePathsInFile, fixResourcePathsInDirectory, fixFontPaths, fixImagePaths, fixHtmlPaths };
