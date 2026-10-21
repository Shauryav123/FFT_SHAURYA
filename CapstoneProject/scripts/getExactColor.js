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
<div id="res">PENDING</div>
<script>
  const img = new Image();
  img.src = 'data:image/jpeg;base64,${b64}';
  img.onload = () => {
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    // Sample background pixel right above BloodConnect360
    const p1 = ctx.getImageData(50, 245, 1, 1).data;
    const hex = '#' + [p1[0], p1[1], p1[2]].map(x => x.toString(16).padStart(2,'0')).join('');
    // Completely cover BloodConnect360 (which is from x=58 to 338, y=250 to 275)
    ctx.fillStyle = hex;
    ctx.fillRect(55, 248, 310, 32);
    // Write Decision Duel in the EXACT same place
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Decision Duel', 58, 270);
    
    // Save painted image to disk via dataURL
    const cleanJpg = c.toDataURL('image/jpeg', 0.95);
    document.getElementById('res').innerText = 'DONE:' + hex + ':' + cleanJpg;
  };
</script>
</body>
</html>`;

const samplerPath = path.join(rootDir, 'screenshots', 'canvas_patch.html');
fs.writeFileSync(samplerPath, html);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const child = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--virtual-time-budget=2000',
  '--dump-dom',
  samplerPath
]);

let out = '';
child.stdout.on('data', d => out += d);
child.on('close', () => {
  const match = out.match(/DONE:(#[0-9a-fA-F]{6}):(data:image\/jpeg;base64,[A-Za-z0-9+/=]+)/);
  if (match) {
    const hex = match[1];
    const b64Data = match[2].replace('data:image/jpeg;base64,', '');
    const cleanPath = path.join(rootDir, 'screenshots', 'clean_cover_page1.jpg');
    fs.writeFileSync(cleanPath, Buffer.from(b64Data, 'base64'));
    console.log('Sampled color:', hex);
    console.log('Clean Page 1 cover written to:', cleanPath);
  } else {
    console.log('Output did not match:', out.slice(0, 200));
  }
});
