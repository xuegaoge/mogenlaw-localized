#!/usr/bin/env node
// tools/server.mjs - Zero-dependency static file server with basic Range support
import http from 'http';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 8090);

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.mjs':'application/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml', '.webp':'image/webp', '.ico':'image/x-icon', '.bmp':'image/bmp', '.avif':'image/avif',
  '.mp4':'video/mp4', '.webm':'video/webm', '.ogg':'video/ogg', '.mp3':'audio/mpeg', '.wav':'audio/wav',
  '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.otf':'font/otf', '.eot':'application/vnd.ms-fontobject'
};

function safeJoin(root, reqPath){
  const p = path.normalize(path.join(root, reqPath));
  if (!p.startsWith(root)) return root; // prevent path traversal
  return p;
}

const server = http.createServer(async (req,res)=>{
  try{
    const urlPath = decodeURIComponent((req.url||'/').split('?')[0]);
    let filePath = safeJoin(ROOT, urlPath === '/' ? '/index.html' : urlPath);
    let stat;
    try{ stat = await fsp.stat(filePath); }catch{ /* try with index.html under directory */ }
    if (!stat){
      try{
        const alt = safeJoin(ROOT, path.join(urlPath, 'index.html'));
        stat = await fsp.stat(alt);
        if (stat && stat.isFile()) filePath = alt;
      }catch{}
    }
    if (!stat || !stat.isFile()){
      res.writeHead(404); res.end('Not Found'); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    const range = req.headers['range'];
    const total = stat.size;
    if (range){
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] ? parseInt(m[1]) : 0;
      let end = m && m[2] ? parseInt(m[2]) : total-1;
      if (isNaN(start) || isNaN(end) || start> end || end>= total){ start=0; end= total-1; }
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': (end-start+1),
        'Content-Type': mime
      });
      fs.createReadStream(filePath, {start, end}).pipe(res);
      return;
    }

    res.writeHead(200, {'Content-Type': mime, 'Content-Length': total});
    fs.createReadStream(filePath).pipe(res);
  }catch(e){ res.writeHead(500); res.end('Server Error'); }
});

server.listen(PORT, ()=>{
  console.log(`Static server running at http://localhost:${PORT}/`);
});