/**
 * Helper script to deploy database.rules.json to Firebase Realtime Database
 * using serviceAccountKey.json with Google OAuth2.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const saPath = path.join(rootDir, 'serviceAccountKey.json');
const rulesPath = path.join(rootDir, 'database.rules.json');

if (!fs.existsSync(saPath)) {
  console.error('❌ serviceAccountKey.json not found in project root.');
  process.exit(1);
}

if (!fs.existsSync(rulesPath)) {
  console.error('❌ database.rules.json not found in project root.');
  process.exit(1);
}

async function deployRules() {
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  console.log(`Connecting to Google OAuth2 as service account: ${sa.client_email}...`);

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + payload);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = header + '.' + payload + '.' + signature;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const tokenData = await res.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to obtain Google access token: ${JSON.stringify(tokenData)}`);
  }

  // Derive regional RTDB endpoint
  const rulesUrl = `https://${sa.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app/.settings/rules.json`;
  console.log(`Publishing security rules to: ${rulesUrl}...`);

  const rulesRes = await fetch(rulesUrl, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + tokenData.access_token,
      'Content-Type': 'application/json'
    },
    body: rulesContent
  });

  const rulesResult = await rulesRes.json();
  if (rulesResult.status === 'ok') {
    console.log('✅ Success! Firebase Realtime Database rules have been published.');
  } else {
    console.error('⚠️ Rules deployment response:', rulesResult);
  }
}

deployRules().catch((err) => {
  console.error('❌ Error deploying rules:', err.message);
  process.exit(1);
});
