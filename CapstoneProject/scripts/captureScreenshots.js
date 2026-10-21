import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const screenshotsDir = 'C:\\Users\\SHAURYA VENKTA\\Desktop\\FFTProject\\decision-duel\\screenshots';
const dbPath = 'C:\\Users\\SHAURYA VENKTA\\Desktop\\FFTProject\\decision-duel\\database\\decision_duel_db.json';

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Prepare a finished room for 06_result_page
const finishedRoom = JSON.parse(JSON.stringify(db.rooms['G9G96G']));
finishedRoom.room.status = 'finished';
finishedRoom.room.champion_option_id = 'opt_room_G9G96G_mvasp5bd_1';
db.rooms['CHAMP1'] = finishedRoom;
finishedRoom.room.room_code = 'CHAMP1';
finishedRoom.room.room_id = 'room_CHAMP1';

// We will launch Chrome with remote debugging
const chrome = spawn(chromePath, [
  '--remote-debugging-port=9222',
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,850',
  'about:blank'
]);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const data = await res.json();
      if (data && data[0] && data[0].webSocketDebuggerUrl) {
        return data[0].webSocketDebuggerUrl;
      }
    } catch {}
    await sleep(300);
  }
  throw new Error('Could not connect to Chrome debugging port');
}

async function run() {
  console.log('Connecting to Chrome DevTools...');
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((res) => ws.onopen = res);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  // First navigate to app to get same-origin for localStorage
  console.log('Navigating to root to seed localStorage...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(1500);

  // Seed localStorage with user and rooms
  const seedScript = `
    (() => {
      localStorage.setItem('dd_current_user_v2', JSON.stringify({
        id: 'usr_demo_shaurya',
        fullName: 'Shaurya Venkta',
        email: 'shaurya@decisionduel.app',
        avatar: '⚡'
      }));
      ${Object.entries(db.rooms).map(([code, snap]) => `
        localStorage.setItem('dd_room_v2_${code}', ${JSON.stringify(JSON.stringify(snap))});
        localStorage.setItem('dd_session_player_v2_${code}', JSON.stringify({
          player_id: 'p_demo_shaurya',
          nickname: 'Shaurya Venkta'
        }));
      `).join('\n')}
    })();
  `;
  await send('Runtime.evaluate', { expression: seedScript });
  console.log('Seeded localStorage with user session and mock duel rooms.');

  const targets = [
    { name: '01_home_page.png', url: 'http://localhost:5173/' },
    { name: '02_auth_page.png', url: 'http://localhost:5173/auth' },
    { name: '03_lobby_page.png', url: 'http://localhost:5173/room/DUEL26' },
    { name: '04_duel_page.png', url: 'http://localhost:5173/room/G9G96G/duel' },
    { name: '05_tiebreak_page.png', url: 'http://localhost:5173/room/DM2QG4/tiebreak' },
    { name: '06_result_page.png', url: 'http://localhost:5173/room/CHAMP1/result' },
  ];

  for (const t of targets) {
    console.log(`Capturing ${t.name} from ${t.url}...`);
    await send('Page.navigate', { url: t.url });
    await sleep(2500); // Allow react & mini-game state to render smoothly
    const res = await send('Page.captureScreenshot', { format: 'png', quality: 95 });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(screenshotsDir, t.name), buffer);
    console.log(`Saved: ${t.name} (${buffer.length} bytes)`);
  }

  console.log('All screenshots captured successfully!');
  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error running capture:', err);
  chrome.kill();
  process.exit(1);
});
