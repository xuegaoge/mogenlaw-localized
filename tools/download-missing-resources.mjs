#!/usr/bin/env node
// tools/download-missing-resources.mjs - 涓嬭浇缂哄け鐨勮祫婧?
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 缂哄け鐨勮祫婧愬垪琛?
const missingResources = [
  // 瀛椾綋璧勬簮
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
// Roboto瀛椾綋
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
// Roboto Bold瀛椾綋
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

// 涓嬭浇鏂囦欢鐨勫嚱鏁?
function downloadFile(url, localPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(PROJECT_ROOT, localPath);
    const dir = path.dirname(fullPath);
    
    // 纭繚鐩綍瀛樺湪
    fs.mkdir(dir, { recursive: true }).then(() => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const file = fs.createWriteStream(fullPath);
      
      protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`涓嬭浇瀹屾垚: ${localPath}`);
            resolve();
          });
        } else {
          file.close();
          fs.unlink(fullPath).catch(() => {}); // 鍒犻櫎绌烘枃浠?
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        }
      }).on('error', (err) => {
        file.close();
        fs.unlink(fullPath).catch(() => {}); // 鍒犻櫎绌烘枃浠?
        reject(err);
      });
    }).catch(reject);
  });
}

// 涓诲嚱鏁?
async function downloadMissingResources() {
  console.log('寮€濮嬩笅杞界己澶辩殑璧勬簮...');
  
  for (const resource of missingResources) {
    try {
      const fullPath = path.join(PROJECT_ROOT, resource.localPath);
      
      // 妫€鏌ユ枃浠舵槸鍚﹀凡瀛樺湪
      try {
        await fs.access(fullPath);
        console.log(`鏂囦欢宸插瓨鍦紝璺宠繃: ${resource.localPath}`);
        continue;
      } catch {
        // 鏂囦欢涓嶅瓨鍦紝闇€瑕佷笅杞?
      }
      
      console.log(`姝ｅ湪涓嬭浇: ${resource.url}`);
      await downloadFile(resource.url, resource.localPath);
      
      // 娣诲姞寤惰繜浠ラ伩鍏嶈繃浜庨绻佺殑璇锋眰
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`涓嬭浇澶辫触 ${resource.url}:`, error.message);
    }
  }
  
  console.log('璧勬簮涓嬭浇瀹屾垚锛?);
}

// 濡傛灉鐩存帴杩愯姝よ剼鏈?
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadMissingResources().catch(console.error);
}

export { downloadMissingResources };

