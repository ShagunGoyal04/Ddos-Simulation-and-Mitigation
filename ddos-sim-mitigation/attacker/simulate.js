// simulate.js
// Generates "legitimate" and "flood" traffic against the local test server
// so you can observe how the mitigations in server/mitigations.js respond.
//
// SAFETY GUARD: this script refuses to run against anything other than
// localhost/127.0.0.1. It is a training tool for your own local server,
// not a general-purpose load/stress tool for other hosts.

const http = require('http');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const MODE = getArg('mode', 'mixed'); // legit | attack | mixed
const DURATION_SEC = parseInt(getArg('duration', '15'), 10);
const TARGET_HOST = getArg('host', 'localhost');
const TARGET_PORT = parseInt(getArg('port', '3000'), 10);

const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1']);
if (!ALLOWED_HOSTS.has(TARGET_HOST)) {
  console.error(
    `Refusing to run: target host "${TARGET_HOST}" is not localhost.\n` +
    `This tool is scoped to your own local test server only.`
  );
  process.exit(1);
}

const LEGIT_RATE_PER_SEC = 8;    // realistic user traffic
const ATTACK_RATE_PER_SEC = 150; // simulated flood volume

let sent = 0, ok = 0, blocked = 0, failed = 0;

function fireRequest(kind) {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: '/',
    method: 'GET',
    headers: kind === 'attack'
      ? { 'User-Agent': 'attack-bot/1.0' }       // deliberately flagged by the demo WAF
      : { 'User-Agent': 'demo-legit-client/1.0' },
    timeout: 2000,
  };

  sent += 1;
  const req = http.request(options, (res) => {
    if (res.statusCode === 200) ok += 1;
    else if ([429, 403, 503].includes(res.statusCode)) blocked += 1;
    else failed += 1;
    res.resume();
  });
  req.on('error', () => { failed += 1; });
  req.on('timeout', () => { req.destroy(); failed += 1; });
  req.end();
}

function startStream(kind, ratePerSec) {
  const intervalMs = 1000 / ratePerSec;
  return setInterval(() => fireRequest(kind), intervalMs);
}

console.log(`Mode: ${MODE} | Target: http://${TARGET_HOST}:${TARGET_PORT} | Duration: ${DURATION_SEC}s`);

const timers = [];
if (MODE === 'legit' || MODE === 'mixed') {
  timers.push(startStream('legit', LEGIT_RATE_PER_SEC));
}
if (MODE === 'attack' || MODE === 'mixed') {
  timers.push(startStream('attack', ATTACK_RATE_PER_SEC));
}

const reportInterval = setInterval(() => {
  console.log(`sent=${sent} ok=${ok} blocked=${blocked} failed=${failed}`);
}, 2000);

setTimeout(() => {
  timers.forEach(clearInterval);
  clearInterval(reportInterval);
  console.log('--- Final summary ---');
  console.log(`sent=${sent} ok=${ok} blocked=${blocked} failed=${failed}`);
  console.log(`legit success rate context: check /stats on the server for mitigation effectiveness`);
  process.exit(0);
}, DURATION_SEC * 1000);
