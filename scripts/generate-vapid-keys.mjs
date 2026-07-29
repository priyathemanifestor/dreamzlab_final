// Generates a fresh VAPID keypair for Web Push, using only Node's built-in
// crypto module — no npm install, no network access needed.
//
// Run it yourself: node scripts/generate-vapid-keys.mjs
//
// Each run makes a brand new, unique keypair. Never reuse a keypair someone
// else generated or has seen — the private key must stay secret to you.

import crypto from 'node:crypto';

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const ecdh = crypto.createECDH('prime256v1');
ecdh.generateKeys();

let priv = ecdh.getPrivateKey();
if (priv.length < 32) {
  const padded = Buffer.alloc(32);
  priv.copy(padded, 32 - priv.length);
  priv = padded;
}

const pub = ecdh.getPublicKey(); // 65 bytes, uncompressed EC point: 0x04 || X || Y

console.log('Add these to your Vercel project (Settings -> Environment Variables):\n');
console.log('VAPID_PUBLIC_KEY=' + base64url(pub));
console.log('VAPID_PRIVATE_KEY=' + base64url(priv));
console.log('VAPID_SUBJECT=mailto:you@example.com   # any contact URI/email, required by the push spec\n');
console.log('Also add the public key to your Vite build env so the browser can use it:');
console.log('VITE_VAPID_PUBLIC_KEY=<same value as VAPID_PUBLIC_KEY above>\n');
console.log('For local dev, put these in a .env file (see .env.example).');
