// mitigations.js
// Lightweight, dependency-free mitigation layers for demo purposes.
// Each one is deliberately simple so it's easy to explain in a report:
//   1. Rate limiting     -> caps requests per IP per time window
//   2. WAF-style filter  -> blocks requests that look obviously malicious
//   3. Connection cap    -> limits concurrent in-flight requests server-wide

const rateLimitState = new Map(); // ip -> { count, windowStart }
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window
const RATE_LIMIT_MAX_REQUESTS = 10; // max requests per IP per window

let activeConnections = 0;
const MAX_CONCURRENT_CONNECTIONS = 50;

function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = rateLimitState.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitState.set(ip, { count: 1, windowStart: now });
    return next();
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    res.set('Retry-After', '1');
    return res.status(429).json({ error: 'Too many requests, slow down.' });
  }
  next();
}

// Very simple heuristic "WAF": flags requests with suspicious headers/UA,
// missing headers real browsers/clients normally send, or known junk paths.
function wafFilter(req, res, next) {
  const ua = req.get('User-Agent') || '';
  const suspiciousUA = /curl-flood|attack-bot|zombie|junk-agent/i.test(ua);
  const suspiciousPath = /\.\.|\/etc\/passwd|<script/i.test(req.path);
  const missingUA = ua.trim().length === 0;

  if (suspiciousUA || suspiciousPath || missingUA) {
    return res.status(403).json({ error: 'Request blocked by filter.' });
  }
  next();
}

// Caps concurrent connections to simulate a load balancer / origin
// protecting itself once autoscaled capacity is exhausted.
function connectionCap(req, res, next) {
  if (activeConnections >= MAX_CONCURRENT_CONNECTIONS) {
    return res.status(503).json({ error: 'Server busy, try again shortly.' });
  }
  activeConnections += 1;
  res.on('finish', () => {
    activeConnections = Math.max(0, activeConnections - 1);
  });
  next();
}

// Periodically clear stale rate-limit entries so the Map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitState.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 5) {
      rateLimitState.delete(ip);
    }
  }
}, 5000).unref();

module.exports = { rateLimiter, wafFilter, connectionCap };
