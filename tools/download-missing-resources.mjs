#!/usr/bin/env node
// tools/download-missing-resources.mjs - 下载缺失的资源
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 缺失的资源列表
const missingResources = [
  // 字体资源
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptsg8zYS_SKggPNyCg4QIFqPfE.woff2',
    localPath: 'assets/fonts/1Ptsg8zYS_SKggPNyCg4QIFqPfE.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptsg8zYS_SKggPNyCg4SYFqPfE.woff2',
    localPath: 'assets/fonts/1Ptsg8zYS_SKggPNyCg4SYFqPfE.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptsg8zYS_SKggPNyCg4QoFqPfE.woff2',
    localPath: 'assets/fonts/1Ptsg8zYS_SKggPNyCg4QoFqPfE.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptsg8zYS_SKggPNyCg4Q4FqPfE.woff2',
    localPath: 'assets/fonts/1Ptsg8zYS_SKggPNyCg4Q4FqPfE.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptsg8zYS_SKggPNyCg4TYFq.woff2',
    localPath: 'assets/fonts/1Ptsg8zYS_SKggPNyCg4TYFq.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCAIT5lu.woff2',
    localPath: 'assets/fonts/1Ptug8zYS_SKggPNyCAIT5lu.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCkIT5lu.woff2',
    localPath: 'assets/fonts/1Ptug8zYS_SKggPNyCkIT5lu.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCIIT5lu.woff2',
    localPath: 'assets/fonts/1Ptug8zYS_SKggPNyCIIT5lu.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCMIT5lu.woff2',
    localPath: 'assets/fonts/1Ptug8zYS_SKggPNyCMIT5lu.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyC0ITw.woff2',
    localPath: 'assets/fonts/1Ptug8zYS_SKggPNyC0ITw.woff2'
  },
  // Roboto字体
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkAnkaWzU.woff2',
    localPath: 'assets/fonts/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkAnkaWzU.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBXkaWzU.woff2',
    localPath: 'assets/fonts/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBXkaWzU.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBnka.woff2',
    localPath: 'assets/fonts/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkBnka.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkC3kaWzU.woff2',
    localPath: 'assets/fonts/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkC3kaWzU.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkCHkaWzU.woff2',
    localPath: 'assets/fonts/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkCHkaWzU.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkCXkaWzU.woff2',
    localPath: 'assets/fonts/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkCXkaWzU.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkCnkaWzU.woff2',
    localPath: 'assets/fonts/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkCnkaWzU.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkaHkaWzU.woff2',
    localPath: 'assets/fonts/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkaHkaWzU.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkenkaWzU.woff2',
    localPath: 'assets/fonts/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkenkaWzU.woff2'
  },
  // Roboto Bold字体
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3-UBGEe.woff2',
    localPath: 'assets/fonts/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3-UBGEe.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3CUBGEe.woff2',
    localPath: 'assets/fonts/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3CUBGEe.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3GUBGEe.woff2',
    localPath: 'assets/fonts/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3GUBGEe.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3KUBGEe.woff2',
    localPath: 'assets/fonts/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3KUBGEe.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3OUBGEe.woff2',
    localPath: 'assets/fonts/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3OUBGEe.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3iUBGEe.woff2',
    localPath: 'assets/fonts/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3iUBGEe.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2',
    localPath: 'assets/fonts/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMawCUBGEe.woff2',
    localPath: 'assets/fonts/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMawCUBGEe.woff2'
  },
  {
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMMaxKUBGEe.woff2',
    localPath: 'assets/fonts/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMMaxKUBGEe.woff2'
  }
];

// 下载文件的函数
function downloadFile(url, localPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(PROJECT_ROOT, localPath);
    const dir = path.dirname(fullPath);
    
    // 确保目录存在
    fs.mkdir(dir, { recursive: true }).then(() => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const file = fs.createWriteStream(fullPath);
      
      protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`下载完成: ${localPath}`);
            resolve();
          });
        } else {
          file.close();
          fs.unlink(fullPath).catch(() => {}); // 删除空文件
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        }
      }).on('error', (err) => {
        file.close();
        fs.unlink(fullPath).catch(() => {}); // 删除空文件
        reject(err);
      });
    }).catch(reject);
  });
}

// 主函数
async function downloadMissingResources() {
  console.log('开始下载缺失的资源...');
  
  for (const resource of missingResources) {
    try {
      const fullPath = path.join(PROJECT_ROOT, resource.localPath);
      
      // 检查文件是否已存在
      try {
        await fs.access(fullPath);
        console.log(`文件已存在，跳过: ${resource.localPath}`);
        continue;
      } catch {
        // 文件不存在，需要下载
      }
      
      console.log(`正在下载: ${resource.url}`);
      await downloadFile(resource.url, resource.localPath);
      
      // 添加延迟以避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`下载失败 ${resource.url}:`, error.message);
    }
  }
  
  console.log('资源下载完成！');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadMissingResources().catch(console.error);
}

export { downloadMissingResources };
