// server.js
// A local test server used as the target for the DDoS simulation.
// Run with MITIGATIONS=on to enable rate limiting / WAF / connection cap.
//
// IMPORTANT: This server is meant to run on localhost for demo purposes only.

const express = require('express');
const { rateLimiter, wafFilter, connectionCap } = require('./mitigations');

const app = express();
const PORT = process.env.PORT || 3000;
const MITIGATIONS_ON = process.env.MITIGATIONS === 'on';

// Simulate some real work per request so load is visible (CPU + delay)
function simulateWork() {
  let x = 0;
  for (let i = 0; i < 200000; i++) x += Math.sqrt(i);
  return x;
}

let totalRequests = 0;
let blockedRequests = 0;

app.use((req, res, next) => {
  totalRequests += 1;
  const originalStatus = res.status.bind(res);
  res.status = (code) => {
    if (code === 429 || code === 403 || code === 503) blockedRequests += 1;
    return originalStatus(code);
  };
  next();
});

if (MITIGATIONS_ON) {
  app.use(wafFilter);
  app.use(rateLimiter);
  app.use(connectionCap);
}

app.get('/', (req, res) => {
  simulateWork();
  res.json({ message: 'ok', servedAt: Date.now() });
});

app.get('/stats', (req, res) => {
  res.json({
    mitigationsEnabled: MITIGATIONS_ON,
    totalRequests,
    blockedRequests,
    blockRate: totalRequests ? (blockedRequests / totalRequests) : 0,
  });
});

app.listen(PORT, () => {
  console.log(`Target server listening on http://localhost:${PORT}`);
  console.log(`Mitigations: ${MITIGATIONS_ON ? 'ENABLED' : 'disabled'}`);
  console.log(`Stats endpoint: http://localhost:${PORT}/stats`);
});
