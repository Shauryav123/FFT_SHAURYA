import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const b64 = fs.readFileSync(path.join(rootDir, 'screenshots', 'extracted_0.jpg')).toString('base64');

const html = `<!DOCTYPE html>
<html>
<body>
<canvas id="c" width="571" height="807"></canvas>
<pre id="log">WAITING</pre>
<script>
  const img = new Image();
  img.src = 'data:image/jpeg;base64,${b64}';
  img.onload = () => {
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);

    let minX = 999, maxX = 0;
    for (let y = 250; y <= 270; y++) {
      for (let x = 40; x <= 350; x++) {
        const p = ctx.getImageData(x, y, 1, 1).data;
        if (p[0] > 70 || p[1] > 70) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    document.getElementById('log').innerText = 'RESULT:' + JSON.stringify({ minX, maxX });
  };
</script>
</body>
</html>`;

const outHtml = path.join(rootDir, 'screenshots', 'find_box.html');
fs.writeFileSync(outHtml, html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const child = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--virtual-time-budget=2000',
  '--dump-dom',
  outHtml
]);

let out = '';
child.stdout.on('data', d => out += d);
child.on('close', () => {
  const match = out.match(/RESULT:(\{.*?\})/);
  if (match) {
    console.log('Found coordinates:', match[1]);
  } else {
    console.log('No match:', out.slice(0, 300));
  }
});
